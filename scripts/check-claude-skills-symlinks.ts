#!/usr/bin/env bun
/**
 * check-claude-skills-symlinks.ts
 *
 * Ensures every staged entry under `.claude/skills/` is a symlink that points
 * into `.agents/skills/`. Skills must be authored under `.agents/skills/<name>/`
 * and only symlinked into `.claude/skills/<name>` — plain files committed
 * directly under `.claude/skills/` are never allowed.
 *
 * Two checks, over STAGED entries only (`--diff-filter=ACMR`; deletions are
 * excluded so removing an entry is never blocked):
 *
 * Check 1 — mode guard
 *   A staged path under `.claude/skills/` whose new mode is NOT `120000`
 *   (i.e. a regular file or executable) is a violation.
 *
 * Check 2 — target guard
 *   A staged path under `.claude/skills/` that IS a symlink (mode 120000)
 *   but whose target string does not contain `.agents/skills/` is a violation.
 *   If reading the target fails, this check is skipped for that path (no crash).
 *
 * Copied nearly verbatim from control-pane's check-claude-skills-symlinks.ts.
 * No changes needed — the convention is identical in brain.
 *
 * Exit codes:
 *   0 — all staged `.claude/skills/` entries pass (or none staged there)
 *   1 — one or more entries violate either check
 */

import { execSync } from "child_process";

const SKILLS_PREFIX = ".claude/skills/";
const SYMLINK_MODE = "120000";

interface RawEntry {
  newMode: string;
  path: string;
}

function getStagedEntries(): RawEntry[] {
  let output: string;
  try {
    output = execSync("git diff --cached --raw --diff-filter=ACMR", {
      encoding: "utf8",
    });
  } catch {
    // If git command fails (e.g. not in a git repo), skip the check
    console.log(
      "[check-claude-skills-symlinks] NOTICE: Could not run git diff — skipping check."
    );
    process.exit(0);
  }

  const entries: RawEntry[] = [];
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: :<oldmode> <newmode> <oldsha> <newsha> <status>\t<path>
    // For renames/copies:  ...R100\t<old-path>\t<new-path>  — use last path.
    const tabIndex = trimmed.indexOf("\t");
    if (tabIndex === -1) continue;

    const metaPart = trimmed.slice(0, tabIndex);
    const pathPart = trimmed.slice(tabIndex + 1);

    // The destination path is the last tab-delimited token
    const pathTokens = pathPart.split("\t");
    const path = pathTokens[pathTokens.length - 1] ?? "";

    // Fields in meta: :<oldmode> <newmode> <oldsha> <newsha> <status>
    // Strip the leading ":"
    const fields = metaPart.replace(/^:/, "").split(/\s+/);
    const newMode = fields[1] ?? "";

    entries.push({ newMode, path });
  }
  return entries;
}

function readSymlinkTarget(path: string): string | null {
  try {
    return execSync(`git show :${path}`, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const allEntries = getStagedEntries();

  // Only look at paths under .claude/skills/
  const skillsEntries = allEntries.filter((e) =>
    e.path.startsWith(SKILLS_PREFIX)
  );

  if (skillsEntries.length === 0) {
    console.log(
      "[check-claude-skills-symlinks] OK: no .claude/skills/ entries staged."
    );
    process.exit(0);
  }

  interface Violation {
    path: string;
    reason: string;
  }
  const violations: Violation[] = [];

  for (const { newMode, path } of skillsEntries) {
    if (newMode !== SYMLINK_MODE) {
      // Check 1: not a symlink at all
      violations.push({
        path,
        reason: "plain file — author it in .agents/skills/ and symlink it here",
      });
    } else {
      // Check 2: symlink target must point into .agents/skills/
      const target = readSymlinkTarget(path);
      if (target !== null && !target.includes(".agents/skills/")) {
        violations.push({
          path,
          reason: `symlink does not point into .agents/skills/ (target: ${target})`,
        });
      }
      // If target is null (read failed), skip check 2 for this path
    }
  }

  if (violations.length > 0) {
    console.error(
      "\n[check-claude-skills-symlinks] FAIL: staged .claude/skills/ entry(ies) violate the symlink convention:\n"
    );
    for (const { path, reason } of violations) {
      console.error(`  ${path}  — ${reason}`);
    }
    console.error(
      "\nHint: author skills under .agents/skills/<name>/, then create a relative symlink:\n" +
        "  ln -s ../../.agents/skills/<name> .claude/skills/<name>\n" +
        "and stage the symlink (git add .claude/skills/<name>) instead of a plain file.\n"
    );
    process.exit(1);
  }

  console.log(
    `[check-claude-skills-symlinks] OK: ${skillsEntries.length} .claude/skills/ entry(ies) checked — all valid symlinks pointing into .agents/skills/.`
  );
  process.exit(0);
}

main();
