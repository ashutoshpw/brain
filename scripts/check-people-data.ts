#!/usr/bin/env bun
/**
 * check-people-data.ts
 *
 * Guards people profiles stored under workspace/people/<slug>/profile.md
 * AND per-person call notes stored under
 * workspace/people/<slug>/calls/YYYY/MM-DD/notes.md.
 *
 * ── Profile record types (profile.md) ─────────────────────────────────────────
 *
 * Type "person" — required fields:
 *   type, name, relation, area, updated
 *   Optional fields validated when present: cadence_days, important_dates,
 *   tags, location, how_we_met, interests, notes
 *
 * Type "family-member" — all person fields PLUS:
 *   relationship, dob (YYYY-MM-DD)
 *   Optional but validated when present: important_dates (each entry must have
 *   label and date in MM-DD format).
 *
 * Type "notable-person" — required fields:
 *   type, name, area, field, why_tracked, updated
 *   Optional fields validated when present: nationality, relation (must equal
 *   "role-model"), links, projects, achievements, lessons, tags, important_dates
 *
 * ── Call-note files (calls/YYYY/MM-DD/notes.md) ───────────────────────────────
 *
 * Type "call-note" — required fields:
 *   type (must equal "call-note"), person (must equal path <slug>),
 *   date (YYYY-MM-DD, must match path YYYY/MM-DD), learnings (non-empty list)
 *   Optional fields validated when present: channel (string), duration_min
 *   (number), topics (list), follow_ups (list), mood (string),
 *   updated (YYYY-MM-DD).
 *
 * ── Rules (all violations collected and printed together before exiting) ───────
 *
 * Rule 1 — frontmatter validation:
 *   Validates staged profile.md AND call-note notes.md files per their schemas.
 *
 * Rule 2 — secret / credential scanning (all staged text files under people/):
 *   Blocks common credential patterns; never echoes the matched secret value.
 *   Placeholder values (contains 'xxx', 'your_', 'example', …) are not flagged.
 *   Note: repo is private, so personal stats (medical_notes, blood_group, sizes)
 *   ARE allowed — only credentials/tokens/keys are blocked.
 *   Call-note files are included in this scan.
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

// Matches workspace/people/<slug>/calls/YYYY/MM-DD/notes.md
// Capture groups: [1] slug, [2] YYYY, [3] MM-DD
const CALL_NOTE_PATH_RE =
  /^workspace\/people\/([^/]+)\/calls\/(\d{4})\/(\d{2}-\d{2})\/notes\.md$/;

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

// ── Call-note validation helper ───────────────────────────────────────────────

/** Validates a single call-note file (calls/YYYY/MM-DD/notes.md).
 *  Returns a list of "[Rule 1 – frontmatter] <path>: <error>" lines. */
function validateCallNote(
  filePath: string,
  slug: string,
  yyyy: string,
  mmdd: string
): string[] {
  const violations: string[] = [];

  let content: string;
  try {
    content = readFileSync(join(ROOT, filePath), "utf8");
  } catch {
    violations.push(`${filePath}: could not read file`);
    return violations;
  }

  const fmText = extractFrontmatterText(content);
  if (fmText === null) {
    violations.push(
      `${filePath}: missing YAML frontmatter block (must start with ---)`
    );
    return violations;
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

  // type: must equal "call-note"
  const type = fm["type"];
  if (type !== "call-note") {
    fileErrors.push(
      `frontmatter "type" must be "call-note" (got ${JSON.stringify(type)})`
    );
  }

  // person: required, non-empty, must equal path slug
  const person = fm["person"];
  if (!person || typeof person !== "string" || person.trim().length === 0) {
    fileErrors.push(`frontmatter "person" is required and must be non-empty`);
  } else if (person.trim() !== slug) {
    fileErrors.push(
      `frontmatter "person" (${JSON.stringify(person)}) must equal the path slug (${JSON.stringify(slug)})`
    );
  }

  // date: required, must match YYYY-MM-DD, must equal path YYYY-MM-DD
  const expectedDate = `${yyyy}-${mmdd}`;
  const date = fm["date"];
  if (!date || typeof date !== "string" || !DATE_RE.test(date)) {
    fileErrors.push(
      `frontmatter "date" must be a YYYY-MM-DD date (got ${JSON.stringify(date)})`
    );
  } else if (date !== expectedDate) {
    fileErrors.push(
      `frontmatter "date" (${JSON.stringify(date)}) does not match path date (${JSON.stringify(expectedDate)})`
    );
  }

  // learnings: required, non-empty list of strings
  const learnings = fm["learnings"];
  if (learnings === undefined || learnings === null) {
    fileErrors.push(`frontmatter "learnings" is required (non-empty list of strings)`);
  } else if (!Array.isArray(learnings)) {
    fileErrors.push(`frontmatter "learnings" must be a list`);
  } else if (learnings.length === 0) {
    fileErrors.push(`frontmatter "learnings" must not be empty`);
  } else {
    for (let idx = 0; idx < learnings.length; idx++) {
      if (typeof learnings[idx] !== "string" || (learnings[idx] as string).trim().length === 0) {
        fileErrors.push(`frontmatter learnings[${idx}]: must be a non-empty string`);
      }
    }
  }

  // duration_min: optional, if present must be a number
  const durationMin = fm["duration_min"];
  if (durationMin !== undefined) {
    const asNum = Number(durationMin);
    if (isNaN(asNum) || typeof durationMin === "boolean") {
      fileErrors.push(
        `frontmatter "duration_min" must be a number (got ${JSON.stringify(durationMin)})`
      );
    }
  }

  // topics: optional, if present must be a list
  const topics = fm["topics"];
  if (topics !== undefined && !Array.isArray(topics)) {
    fileErrors.push(`frontmatter "topics" must be an array`);
  }

  // follow_ups: optional, if present must be a list
  const followUps = fm["follow_ups"];
  if (followUps !== undefined && !Array.isArray(followUps)) {
    fileErrors.push(`frontmatter "follow_ups" must be an array`);
  }

  // updated: optional, if present must match YYYY-MM-DD
  const updated = fm["updated"];
  if (updated !== undefined && !DATE_RE.test(String(updated))) {
    fileErrors.push(
      `frontmatter "updated" must be a YYYY-MM-DD date (got ${JSON.stringify(updated)})`
    );
  }

  for (const err of fileErrors) {
    violations.push(`${filePath}: ${err}`);
  }

  return violations;
}

// ── Rule 1: frontmatter validation ───────────────────────────────────────────

function rule1Frontmatter(stagedFiles: string[]): string[] {
  const violations: string[] = [];

  for (const filePath of stagedFiles) {
    const callNoteMatch = CALL_NOTE_PATH_RE.exec(filePath);
    if (callNoteMatch) {
      const callNoteViolations = validateCallNote(
        filePath,
        callNoteMatch[1] ?? "",
        callNoteMatch[2] ?? "",
        callNoteMatch[3] ?? ""
      );
      violations.push(...callNoteViolations);
      continue;
    }

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

    // type: must be "person", "family-member", or "notable-person"
    if (type !== "person" && type !== "family-member" && type !== "notable-person") {
      fileErrors.push(
        `frontmatter "type" must be "person", "family-member", or "notable-person" (got ${JSON.stringify(type)})`
      );
      // Can't validate further type-specific fields without a valid type
      for (const err of fileErrors) violations.push(`${filePath}: ${err}`);
      continue;
    }

    // ── notable-person ─────────────────────────────────────────────────────────
    if (type === "notable-person") {
      const name = fm["name"];
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        fileErrors.push(`frontmatter missing or empty "name"`);
      }

      const area = fm["area"];
      if (!area || typeof area !== "string" || area.trim().length === 0) {
        fileErrors.push(`frontmatter missing or empty "area"`);
      }

      const field = fm["field"];
      if (!field || typeof field !== "string" || field.trim().length === 0) {
        fileErrors.push(`frontmatter missing or empty "field"`);
      }

      const whyTracked = fm["why_tracked"];
      if (!whyTracked || typeof whyTracked !== "string" || whyTracked.trim().length === 0) {
        fileErrors.push(`frontmatter missing or empty "why_tracked"`);
      }

      const updated = fm["updated"];
      if (!updated || !DATE_RE.test(String(updated))) {
        fileErrors.push(
          `frontmatter "updated" must be a YYYY-MM-DD date (got ${JSON.stringify(updated)})`
        );
      }

      // Optional: relation — if present must equal "role-model"
      const relation = fm["relation"];
      if (relation !== undefined && String(relation) !== "role-model") {
        fileErrors.push(
          `frontmatter "relation" for notable-person must be "role-model" when present (got ${JSON.stringify(relation)})`
        );
      }

      // Optional: links — list of {label, url} maps
      const links = fm["links"];
      if (links !== undefined) {
        if (!Array.isArray(links)) {
          fileErrors.push(`frontmatter "links" must be an array`);
        } else {
          for (let idx = 0; idx < links.length; idx++) {
            const entry = links[idx];
            if (typeof entry !== "object" || entry === null) {
              fileErrors.push(`frontmatter links[${idx}]: must be a mapping with label and url`);
              continue;
            }
            const e = entry as Record<string, unknown>;
            if (!e["label"] || typeof e["label"] !== "string") {
              fileErrors.push(`frontmatter links[${idx}]: missing "label"`);
            }
            if (!e["url"] || typeof e["url"] !== "string") {
              fileErrors.push(`frontmatter links[${idx}]: missing "url"`);
            }
          }
        }
      }

      // Optional: projects — list of maps, each requiring "name"
      const projects = fm["projects"];
      if (projects !== undefined) {
        if (!Array.isArray(projects)) {
          fileErrors.push(`frontmatter "projects" must be an array`);
        } else {
          for (let idx = 0; idx < projects.length; idx++) {
            const entry = projects[idx];
            if (typeof entry !== "object" || entry === null) {
              fileErrors.push(`frontmatter projects[${idx}]: must be a mapping`);
              continue;
            }
            const e = entry as Record<string, unknown>;
            if (!e["name"] || typeof e["name"] !== "string") {
              fileErrors.push(`frontmatter projects[${idx}]: missing "name"`);
            }
            // Optional project-level achievements — if present must be a list
            if (e["achievements"] !== undefined && !Array.isArray(e["achievements"])) {
              fileErrors.push(`frontmatter projects[${idx}].achievements must be a list`);
            }
          }
        }
      }

      // Optional: achievements, lessons, tags — each must be a list if present
      for (const listField of ["achievements", "lessons", "tags"] as const) {
        const val = fm[listField];
        if (val !== undefined && !Array.isArray(val)) {
          fileErrors.push(`frontmatter "${listField}" must be an array`);
        }
      }

      // Optional: important_dates (reuse same logic as family-member)
      validateImportantDates(fm, fileErrors);

      for (const err of fileErrors) violations.push(`${filePath}: ${err}`);
      continue;
    }

    // ── person / family-member ─────────────────────────────────────────────────

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

    // person: optional new fields — validate shape only when present
    if (type === "person") {
      const interests = fm["interests"];
      if (interests !== undefined && !Array.isArray(interests)) {
        fileErrors.push(`frontmatter "interests" must be an array`);
      }
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
    }

    // Validate important_dates entries when present (both person and family-member)
    validateImportantDates(fm, fileErrors);

    for (const err of fileErrors) {
      violations.push(`${filePath}: ${err}`);
    }
  }

  return violations;
}

/** Shared helper: validates important_dates list shape. Pushes errors into fileErrors. */
function validateImportantDates(fm: Record<string, unknown>, fileErrors: string[]): void {
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
        "\n  Rule 1 – profile (workspace/people/<slug>/profile.md):" +
        "\n    type: person requires: type, name, relation, area, updated." +
        "\n    type: family-member additionally requires: relationship, dob (YYYY-MM-DD)." +
        "\n    type: notable-person requires: type, name, area, field, why_tracked, updated." +
        "\n    important_dates entries must each have label and date (MM-DD)." +
        "\n    notable-person 'relation' (optional) must equal 'role-model' when present." +
        "\n  Rule 1 – call-note (workspace/people/<slug>/calls/YYYY/MM-DD/notes.md):" +
        "\n    Required: type: call-note, person (must equal path slug)," +
        "\n              date (YYYY-MM-DD, must match path YYYY/MM-DD), learnings (non-empty list)." +
        "\n    Optional: channel, duration_min (number), topics (list), follow_ups (list)," +
        "\n              mood, updated (YYYY-MM-DD)." +
        "\n  Rule 2: do not store real credentials — use placeholder values or a secrets manager.\n"
    );
    process.exit(1);
  }

  const profileCount = stagedFiles.filter((f) => PROFILE_PATH_RE.test(f)).length;
  const callNoteCount = stagedFiles.filter((f) => CALL_NOTE_PATH_RE.test(f)).length;
  const checkedCount = profileCount + callNoteCount;
  if (checkedCount > 0) {
    const parts: string[] = [];
    if (profileCount > 0) parts.push(`${profileCount} profile(s)`);
    if (callNoteCount > 0) parts.push(`${callNoteCount} call-note(s)`);
    console.log(
      `[check-people-data] OK: ${parts.join(", ")} checked, all rules passed.`
    );
  } else {
    console.log("[check-people-data] OK: no staged people profiles or call-notes to check.");
  }
  process.exit(0);
}

main();
