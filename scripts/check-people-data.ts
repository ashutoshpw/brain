#!/usr/bin/env bun
/**
 * check-people-data.ts
 *
 * Guards people profiles stored under workspace/people/<slug>/profile.md.
 *
 * Two record types with different required frontmatter fields:
 *
 * Type "person" — required fields:
 *   type, name, relation, area, updated
 *
 * Type "family-member" — all of the above PLUS:
 *   relationship, dob (YYYY-MM-DD)
 *   Optional but validated when present: important_dates (each entry must have
 *   label and date in MM-DD format).
 *
 * Three rules — all violations are collected and printed together before exiting:
 *
 * Rule 1 — frontmatter validation (staged profile.md files):
 *   Required fields per type as described above.
 *   dob and important_dates.*.date are validated for format when present.
 *
 * Rule 2 — secret / credential scanning (all staged text files under people/):
 *   Blocks common credential patterns; never echoes the matched secret value.
 *   Placeholder values (contains 'xxx', 'your_', 'example', …) are not flagged.
 *   Note: repo is private, so personal stats (medical_notes, blood_group, sizes)
 *   ARE allowed — only credentials/tokens/keys are blocked.
 *
 * Ported from control-pane's check-social-data.ts; adapted for the personal
 * brain repo's people registry (no subfolder structure rules, no AGENTS.md
 * presence check — just frontmatter + secrets).
 *
 * Exit codes:
 *   0 — clean (or no relevant files)
 *   1 — one or more violations
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, extname } from "path";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dir, "..");

// Matches workspace/people/<slug>/profile.md
const PROFILE_PATH_RE = /^workspace\/people\/([^/]+)\/profile\.md$/;

const VALID_RELATIONS = new Set(["family", "friend", "mentor", "colleague", "acquaintance"]);
const VALID_RELATIONSHIPS = new Set([
  "spouse", "parent", "child", "sibling", "grandparent", "in-law", "other",
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MMDD_RE = /^\d{2}-\d{2}$/;

// Binary / image extensions skipped by secret scanning
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".mp4", ".mov", ".pdf", ".zip",
]);

// Credential patterns — each has a label (never echo the value)
const CREDENTIAL_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "Private key block",    re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: "AWS access key",       re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "Slack token",          re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { label: "GitHub PAT",           re: /\bghp_[A-Za-z0-9]{36}\b/ },
  {
    label: "Assignment-shaped secret",
    re: /(password|passwd|secret|client_secret|api[_-]?key|access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*['"]?([A-Za-z0-9_\-.\/+=]{8,})/i,
  },
];

// Values that look like placeholders — NOT a violation.
// NOTE: "example" uses a word boundary so a synthetic key like "AKIAIOSFODNN7EXAMPLEX"
// (where EXAMPLE is a substring) is NOT dismissed as a placeholder.
const PLACEHOLDER_RE =
  /^<|xxx|your[_-]|\bexample\b|redacted|changeme|placeholder|todo|null|none|^\*+$/i;

// ── Git helpers ───────────────────────────────────────────────────────────────

function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf8",
    });
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch {
    console.log(
      "[check-people-data] NOTICE: Could not run git diff — skipping check."
    );
    process.exit(0);
  }
}

// ── Frontmatter parsing ───────────────────────────────────────────────────────

/** Returns the YAML frontmatter block text, or null if absent. */
function extractFrontmatterText(content: string): string | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? (match[1] ?? "") : null;
}

/** Minimal YAML field extractor — handles scalar strings and inline/block arrays.
 *  Also handles block mappings for simple cases (important_dates items). */
function parseSimpleYaml(block: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = block.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Inline array:  key: [a, b, c]
    const inlineArray = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*\[([^\]]*)\]\s*$/);
    if (inlineArray) {
      const key = inlineArray[1] ?? "";
      const raw = inlineArray[2] ?? "";
      result[key] = raw
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter((s) => s.length > 0);
      i++;
      continue;
    }

    // Block list:  key:\n  - value  OR  key:\n  - { ... }
    const blockListKey = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*$/);
    if (blockListKey && i + 1 < lines.length && (lines[i + 1] ?? "").match(/^\s*-\s/)) {
      const key = blockListKey[1] ?? "";
      const items: unknown[] = [];
      i++;
      while (i < lines.length) {
        const listLine = lines[i] ?? "";
        if (!listLine.match(/^\s*-\s/)) break;
        // Inline mapping: - { label: birthday, date: MM-DD }
        const inlineMap = listLine.match(/^\s*-\s+\{([^}]+)\}/);
        if (inlineMap) {
          const mapStr = inlineMap[1] ?? "";
          const obj: Record<string, string> = {};
          for (const pair of mapStr.split(",")) {
            const kv = pair.trim().match(/^([a-zA-Z_]+):\s*(.+)$/);
            if (kv) {
              obj[kv[1] ?? ""] = (kv[2] ?? "").replace(/^['"]|['"]$/g, "").trim();
            }
          }
          items.push(obj);
        } else {
          // Simple list item
          const listMatch = listLine.match(/^\s*-\s+(.+?)\s*$/);
          if (listMatch) {
            items.push((listMatch[1] ?? "").replace(/^['"]|['"]$/g, "").trim());
          }
        }
        i++;
      }
      result[key] = items;
      continue;
    }

    // Scalar key: value
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+?)\s*$/);
    if (kv) {
      const key = kv[1] ?? "";
      const val = (kv[2] ?? "").replace(/^['"]|['"]$/g, "").trim();
      result[key] = val;
    }

    i++;
  }

  return result;
}

// ── Rule 1: frontmatter validation ───────────────────────────────────────────

function rule1Frontmatter(stagedFiles: string[]): string[] {
  const violations: string[] = [];

  for (const filePath of stagedFiles) {
    if (!PROFILE_PATH_RE.test(filePath)) continue;

    let content: string;
    try {
      content = readFileSync(join(ROOT, filePath), "utf8");
    } catch {
      violations.push(`${filePath}: could not read file`);
      continue;
    }

    const fmText = extractFrontmatterText(content);
    if (fmText === null) {
      violations.push(
        `${filePath}: missing YAML frontmatter block (must start with ---)`
      );
      continue;
    }

    let fm: Record<string, unknown>;
    try {
      if (typeof (Bun as any).YAML?.parse === "function") {
        const parsed = (Bun as any).YAML.parse(fmText);
        fm =
          typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : {};
      } else {
        fm = parseSimpleYaml(fmText);
      }
    } catch {
      fm = parseSimpleYaml(fmText);
    }

    const fileErrors: string[] = [];
    const type = fm["type"];

    // type: must be "person" or "family-member"
    if (type !== "person" && type !== "family-member") {
      fileErrors.push(
        `frontmatter "type" must be "person" or "family-member" (got ${JSON.stringify(type)})`
      );
      // Can't validate further type-specific fields without a valid type
      for (const err of fileErrors) violations.push(`${filePath}: ${err}`);
      continue;
    }

    // Shared required fields for both types
    const name = fm["name"];
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      fileErrors.push(`frontmatter missing or empty "name"`);
    }

    const relation = fm["relation"];
    if (!relation || !VALID_RELATIONS.has(String(relation))) {
      fileErrors.push(
        `frontmatter "relation" must be one of: ${[...VALID_RELATIONS].join(", ")} (got ${JSON.stringify(relation)})`
      );
    }

    const area = fm["area"];
    if (!area || typeof area !== "string" || area.trim().length === 0) {
      fileErrors.push(`frontmatter missing or empty "area"`);
    }

    const updated = fm["updated"];
    if (!updated || !DATE_RE.test(String(updated))) {
      fileErrors.push(
        `frontmatter "updated" must be a YYYY-MM-DD date (got ${JSON.stringify(updated)})`
      );
    }

    // family-member additional required fields
    if (type === "family-member") {
      const relationship = fm["relationship"];
      if (!relationship || !VALID_RELATIONSHIPS.has(String(relationship))) {
        fileErrors.push(
          `frontmatter "relationship" must be one of: ${[...VALID_RELATIONSHIPS].join(", ")} (got ${JSON.stringify(relationship)})`
        );
      }

      const dob = fm["dob"];
      if (!dob || !DATE_RE.test(String(dob))) {
        fileErrors.push(
          `frontmatter "dob" is required for family-member and must be YYYY-MM-DD (got ${JSON.stringify(dob)})`
        );
      }

      // Validate important_dates entries when present
      const importantDates = fm["important_dates"];
      if (importantDates !== undefined) {
        if (!Array.isArray(importantDates)) {
          fileErrors.push(`frontmatter "important_dates" must be an array`);
        } else {
          for (let idx = 0; idx < importantDates.length; idx++) {
            const entry = importantDates[idx];
            if (typeof entry !== "object" || entry === null) {
              fileErrors.push(`frontmatter important_dates[${idx}]: must be a mapping with label and date`);
              continue;
            }
            const entryObj = entry as Record<string, unknown>;
            if (!entryObj["label"] || typeof entryObj["label"] !== "string") {
              fileErrors.push(`frontmatter important_dates[${idx}]: missing "label"`);
            }
            const dateVal = entryObj["date"];
            if (!dateVal || !MMDD_RE.test(String(dateVal))) {
              fileErrors.push(
                `frontmatter important_dates[${idx}]: "date" must be MM-DD (got ${JSON.stringify(dateVal)})`
              );
            }
          }
        }
      }
    }

    for (const err of fileErrors) {
      violations.push(`${filePath}: ${err}`);
    }
  }

  return violations;
}

// ── Rule 2: secret / credential scanning ─────────────────────────────────────

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_RE.test(value);
}

function rule2Secrets(stagedFiles: string[]): string[] {
  const violations: string[] = [];

  for (const filePath of stagedFiles) {
    // Only scan files under workspace/people/
    if (!filePath.startsWith("workspace/people/")) continue;

    // Skip binary / image extensions
    const ext = extname(filePath).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) continue;

    let content: string;
    try {
      content = readFileSync(join(ROOT, filePath), "utf8");
    } catch {
      // Unreadable file — skip (not a secret violation)
      continue;
    }

    for (const { label, re } of CREDENTIAL_PATTERNS) {
      const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
      const globalRe = new RegExp(re.source, flags);

      let found = false;
      let result: RegExpExecArray | null;

      while ((result = globalRe.exec(content)) !== null) {
        if (result.index === globalRe.lastIndex) {
          globalRe.lastIndex++;
          continue;
        }

        if (label === "Assignment-shaped secret") {
          const captured = result[2] ?? "";
          if (isPlaceholder(captured)) {
            continue;
          }
        }

        found = true;
        break;
      }

      if (found) {
        violations.push(
          `${filePath}: potential credential detected — matched pattern: "${label}" (value not shown)`
        );
      }
    }
  }

  return violations;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const stagedFiles = getStagedFiles();

  const allViolations: string[] = [];

  // Rule 1: frontmatter validation
  const r1 = rule1Frontmatter(stagedFiles);
  if (r1.length > 0) {
    allViolations.push(...r1.map((v) => `[Rule 1 – frontmatter] ${v}`));
  }

  // Rule 2: secrets
  const r2 = rule2Secrets(stagedFiles);
  if (r2.length > 0) {
    allViolations.push(...r2.map((v) => `[Rule 2 – secrets] ${v}`));
  }

  if (allViolations.length > 0) {
    console.error("\n[check-people-data] FAIL:\n");
    for (const v of allViolations) {
      console.error(`  ${v}`);
    }
    console.error(
      "\nHints:" +
        "\n  Rule 1: workspace/people/<slug>/profile.md must have YAML frontmatter." +
        "\n    type: person requires: type, name, relation, area, updated." +
        "\n    type: family-member additionally requires: relationship, dob (YYYY-MM-DD)." +
        "\n    important_dates entries must each have label and date (MM-DD)." +
        "\n  Rule 2: do not store real credentials — use placeholder values or a secrets manager.\n"
    );
    process.exit(1);
  }

  const checkedCount = stagedFiles.filter((f) => PROFILE_PATH_RE.test(f)).length;
  if (checkedCount > 0) {
    console.log(
      `[check-people-data] OK: ${checkedCount} staged profile(s) checked, all rules passed.`
    );
  } else {
    console.log("[check-people-data] OK: no staged people profiles to check.");
  }
  process.exit(0);
}

main();
