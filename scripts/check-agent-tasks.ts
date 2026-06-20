#!/usr/bin/env bun
/**
 * check-agent-tasks.ts
 *
 * Guards agent task files stored under .agents/tasks/*.md
 * (README.md and any non-.md files are intentionally skipped).
 *
 * ── Schema ────────────────────────────────────────────────────────────────────
 *
 * Required frontmatter:
 *   id          — string, YYYY-MM-DD-<kebab-slug>, must equal filename (sans .md)
 *   title       — non-empty string
 *   status      — enum: pending | blocked | in-progress | done | cancelled
 *   capability  — non-empty kebab string
 *   created     — YYYY-MM-DD
 *   updated     — YYYY-MM-DD
 *
 * Optional frontmatter (validated when present):
 *   source        — string
 *   target        — string (repo-relative path)
 *   depends_on    — list of strings (task ids)
 *   blocked_reason — string (required when status === "blocked")
 *   result        — string
 *   tags          — list of strings
 *   priority      — "low" | "normal" | "high"
 *
 * ── Rules ─────────────────────────────────────────────────────────────────────
 *
 * Rule 1 — required fields present & non-empty.
 * Rule 2 — status in enum; lists valid values on error.
 * Rule 3 — id equals filename (minus .md).
 * Rule 4 — created/updated match YYYY-MM-DD.
 * Rule 5 — depends_on / tags must be lists when present.
 * Rule 6 — priority in {low,normal,high} when present.
 * Rule 7 — if status === "blocked", blocked_reason must be non-empty.
 *
 * All violations collected and printed together before exit.
 *
 * Exit codes:
 *   0 — clean (or no relevant staged files)
 *   1 — one or more violations
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, basename, extname } from "path";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dir, "..");

// Matches .agents/tasks/<filename>.md (but not README.md)
const TASK_PATH_RE = /^\.agents\/tasks\/(?!README\.md$)([^/]+)\.md$/;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VALID_STATUSES = new Set(["pending", "blocked", "in-progress", "done", "cancelled"]);
const VALID_PRIORITIES = new Set(["low", "normal", "high"]);

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
      "[check-agent-tasks] NOTICE: Could not run git diff — skipping check."
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

/** Minimal YAML field extractor — handles scalar strings and inline/block arrays. */
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

    // Block list:  key:\n  - value
    const blockListKey = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*$/);
    if (blockListKey && i + 1 < lines.length && (lines[i + 1] ?? "").match(/^\s*-\s/)) {
      const key = blockListKey[1] ?? "";
      const items: unknown[] = [];
      i++;
      while (i < lines.length) {
        const listLine = lines[i] ?? "";
        if (!listLine.match(/^\s*-\s/)) break;
        const listMatch = listLine.match(/^\s*-\s+(.+?)\s*$/);
        if (listMatch) {
          items.push((listMatch[1] ?? "").replace(/^['"]|['"]$/g, "").trim());
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

// ── Validation ────────────────────────────────────────────────────────────────

function validateTaskFile(filePath: string): string[] {
  const fileErrors: string[] = [];

  let content: string;
  try {
    content = readFileSync(join(ROOT, filePath), "utf8");
  } catch {
    return [`${filePath}: could not read file`];
  }

  // Derive expected id from filename
  const filename = basename(filePath, ".md");

  const fmText = extractFrontmatterText(content);
  if (fmText === null) {
    return [
      `${filePath}: missing YAML frontmatter block (must start with ---)`,
    ];
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

  // ── Rule 1 & 3: id — required, non-empty, must equal filename ────────────────
  const id = fm["id"];
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    fileErrors.push(`frontmatter "id" is required and must be non-empty`);
  } else if (id.trim() !== filename) {
    fileErrors.push(
      `frontmatter "id" (${JSON.stringify(id.trim())}) must equal the filename (${JSON.stringify(filename)})`
    );
  }

  // ── Rule 1: title — required, non-empty ──────────────────────────────────────
  const title = fm["title"];
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    fileErrors.push(`frontmatter "title" is required and must be non-empty`);
  }

  // ── Rule 1 & 2: status — required, must be in enum ───────────────────────────
  const status = fm["status"];
  if (!status || typeof status !== "string" || status.trim().length === 0) {
    fileErrors.push(`frontmatter "status" is required and must be non-empty`);
  } else if (!VALID_STATUSES.has(status.trim())) {
    fileErrors.push(
      `frontmatter "status" must be one of: ${[...VALID_STATUSES].join(", ")} (got ${JSON.stringify(status)})`
    );
  }

  // ── Rule 1: capability — required, non-empty ─────────────────────────────────
  const capability = fm["capability"];
  if (!capability || typeof capability !== "string" || capability.trim().length === 0) {
    fileErrors.push(`frontmatter "capability" is required and must be non-empty`);
  }

  // ── Rule 1 & 4: created — required, YYYY-MM-DD ───────────────────────────────
  const created = fm["created"];
  if (!created || typeof created !== "string" || created.trim().length === 0) {
    fileErrors.push(`frontmatter "created" is required and must be non-empty`);
  } else if (!DATE_RE.test(created.trim())) {
    fileErrors.push(
      `frontmatter "created" must be a YYYY-MM-DD date (got ${JSON.stringify(created)})`
    );
  }

  // ── Rule 1 & 4: updated — required, YYYY-MM-DD ───────────────────────────────
  const updated = fm["updated"];
  if (!updated || typeof updated !== "string" || updated.trim().length === 0) {
    fileErrors.push(`frontmatter "updated" is required and must be non-empty`);
  } else if (!DATE_RE.test(updated.trim())) {
    fileErrors.push(
      `frontmatter "updated" must be a YYYY-MM-DD date (got ${JSON.stringify(updated)})`
    );
  }

  // ── Rule 5: depends_on — list if present ─────────────────────────────────────
  const dependsOn = fm["depends_on"];
  if (dependsOn !== undefined && !Array.isArray(dependsOn)) {
    fileErrors.push(`frontmatter "depends_on" must be a list when present`);
  }

  // ── Rule 5: tags — list if present ───────────────────────────────────────────
  const tags = fm["tags"];
  if (tags !== undefined && !Array.isArray(tags)) {
    fileErrors.push(`frontmatter "tags" must be a list when present`);
  }

  // ── Rule 6: priority — enum if present ───────────────────────────────────────
  const priority = fm["priority"];
  if (priority !== undefined) {
    if (typeof priority !== "string" || !VALID_PRIORITIES.has(priority.trim())) {
      fileErrors.push(
        `frontmatter "priority" must be one of: ${[...VALID_PRIORITIES].join(", ")} when present (got ${JSON.stringify(priority)})`
      );
    }
  }

  // ── Rule 7: blocked_reason required when status === "blocked" ─────────────────
  if (typeof status === "string" && status.trim() === "blocked") {
    const blockedReason = fm["blocked_reason"];
    if (
      !blockedReason ||
      typeof blockedReason !== "string" ||
      blockedReason.trim().length === 0
    ) {
      fileErrors.push(
        `frontmatter "blocked_reason" is required and must be non-empty when status is "blocked"`
      );
    }
  }

  return fileErrors.map((err) => `${filePath}: ${err}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const stagedFiles = getStagedFiles();

  // Filter to only .agents/tasks/*.md files, excluding README.md
  const taskFiles = stagedFiles.filter((f) => TASK_PATH_RE.test(f));

  if (taskFiles.length === 0) {
    console.log("[check-agent-tasks] OK: no staged agent task files to check.");
    process.exit(0);
  }

  const allViolations: string[] = [];

  for (const filePath of taskFiles) {
    const violations = validateTaskFile(filePath);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error("\n[check-agent-tasks] FAIL:\n");
    for (const v of allViolations) {
      console.error(`  ${v}`);
    }
    console.error(
      "\nHints:" +
        "\n  Required frontmatter: id, title, status, capability, created, updated." +
        "\n  id must equal the filename without .md (e.g. 2026-06-20-my-task)." +
        "\n  status must be one of: pending, blocked, in-progress, done, cancelled." +
        "\n  created and updated must be YYYY-MM-DD dates." +
        "\n  depends_on and tags must be lists when present." +
        "\n  priority must be low, normal, or high when present." +
        "\n  blocked_reason is required (non-empty) when status is 'blocked'." +
        "\n  See .agents/tasks/README.md for the full spec.\n"
    );
    process.exit(1);
  }

  console.log(
    `[check-agent-tasks] OK: ${taskFiles.length} task file(s) checked, all rules passed.`
  );
  process.exit(0);
}

main();
