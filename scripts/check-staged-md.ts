#!/usr/bin/env bun
/**
 * check-staged-md.ts
 *
 * Two-rule-set guard for staged files:
 *
 * Rule set A — files under `workspace/areas/` (path starts with that prefix):
 *   Allowed only if they match one of:
 *     a. Root-level area doc: workspace/areas/<area>/<DOC>.md
 *        where <DOC> stem is one of the 6 required doc names (REQUIRED_DOCS).
 *     b. Resources:  workspace/areas/<area>/resources/**  (any type)
 *   Everything else inside workspace/areas/ is BLOCKED (stray files at the
 *   area root, unknown extensions, etc.).
 *
 * Rule set B — files NOT under `workspace/areas/`:
 *   Non-.md files are ignored (not a violation).
 *   .md files are allowed only if:
 *     a.  Exactly `CLAUDE.md` (repo root config)
 *     a2. Exactly `README.md` (repo root readme)
 *     a3. Exactly `AGENTS.md` (repo root config; symlink to CLAUDE.md)
 *     b.  Starts with `.claude/`
 *     b2. Starts with `.agents/` (agent memory store)
 *     c.  workspace/references/**  (.md)
 *     d.  workspace/resources/**   (.md)
 *     e.  workspace/people/**      (.md)
 *     f.  workspace/tasks/**
 *     g.  workspace/scheduled/**
 *   Any other .md outside workspace/areas/ is BLOCKED.
 *
 * Note: no platform-submodule exemption needed — brain has no submodules.
 *
 * Deletions are excluded (`--diff-filter=ACMR`) so removing a stray file
 * is never blocked.
 *
 * Ported from control-pane's check-staged-md.ts; adapted for the personal brain
 * repo (areas/ instead of projects/, people/ instead of social-profiles/,
 * 6 required docs instead of 10, no content-plan or platform submodule branches).
 *
 * Exit codes:
 *   0 — all staged files pass (or none staged)
 *   1 — one or more staged files violate either rule set
 */

import { execSync } from "child_process";
import { REQUIRED_DOCS } from "./check-area-docs";

// Derive the bare doc names from REQUIRED_DOCS (e.g. "OVERVIEW" from "OVERVIEW.md")
const ALLOWED_DOC_NAMES = new Set(REQUIRED_DOCS.map((d) => d.replace(/\.md$/, "")));

// ── Rule set A: files inside workspace/areas/ ─────────────────────────────────

function isAllowedInAreaFolder(filePath: string): boolean {
  // a. Root-level area doc: workspace/areas/<area>/<DOC>.md
  const areaDocMatch = filePath.match(
    /^workspace\/areas\/([^/]+)\/([^/]+)\.md$/
  );
  if (areaDocMatch) {
    const docName = areaDocMatch[2] ?? "";
    return ALLOWED_DOC_NAMES.has(docName);
  }

  // b. Resources: workspace/areas/<area>/resources/**  (any file type, any depth)
  if (filePath.match(/^workspace\/areas\/[^/]+\/resources\/.+/)) {
    return true;
  }

  return false;
}

// ── Rule set B: .md files outside workspace/areas/ ───────────────────────────

function isAllowedOutsideAreas(filePath: string): boolean {
  // a. Exactly CLAUDE.md at repo root
  if (filePath === "CLAUDE.md") return true;

  // a2. Exactly README.md at repo root
  if (filePath === "README.md") return true;

  // a3. Exactly AGENTS.md at repo root (symlink to CLAUDE.md)
  if (filePath === "AGENTS.md") return true;

  // b. Anywhere under .claude/
  if (filePath.startsWith(".claude/")) return true;

  // b2. Anywhere under .agents/ (agent memory: .agents/memory/<YYYY-MM>/*.md)
  if (filePath.startsWith(".agents/")) return true;

  // c. workspace/references/** (.md)
  if (filePath.match(/^workspace\/references\/.+\.md$/)) return true;

  // d. workspace/resources/** (.md)
  if (filePath.match(/^workspace\/resources\/.+\.md$/)) return true;

  // e. workspace/people/** (.md)
  if (filePath.match(/^workspace\/people\/.+\.md$/)) return true;

  // f. Anywhere under workspace/tasks/
  if (filePath.startsWith("workspace/tasks/")) return true;

  // g. Anywhere under workspace/scheduled/
  if (filePath.startsWith("workspace/scheduled/")) return true;

  return false;
}

// ── File collection ───────────────────────────────────────────────────────────

function getStagedFiles(): string[] {
  let output: string;
  try {
    output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf8",
    });
  } catch {
    // If git command fails (e.g. not in a git repo), skip the check
    console.log("[check-staged-md] NOTICE: Could not run git diff — skipping check.");
    process.exit(0);
  }
  return output
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    // Nothing to check — exit quietly
    process.exit(0);
  }

  const areaFolderViolations: string[] = [];
  const outsideMdViolations: string[] = [];

  for (const filePath of stagedFiles) {
    if (filePath.startsWith("workspace/areas/")) {
      // Rule set A
      if (!isAllowedInAreaFolder(filePath)) {
        areaFolderViolations.push(filePath);
      }
    } else {
      // Rule set B — only .md files are governed outside areas/
      if (filePath.endsWith(".md") && !isAllowedOutsideAreas(filePath)) {
        outsideMdViolations.push(filePath);
      }
    }
  }

  if (areaFolderViolations.length > 0) {
    console.error(
      "\n[check-staged-md] FAIL: File(s) staged inside an area folder that aren't allowed there:\n"
    );
    for (const v of areaFolderViolations) {
      console.error(`  ${v}`);
    }
    console.error(
      "\nHint: An area folder may only contain the 6 required docs " +
        `(${REQUIRED_DOCS.join(", ")}) at the area root. ` +
        "Keep all other data, assets, exports, and research " +
        "under workspace/areas/<area>/resources/ (any file type, any depth is allowed there).\n"
    );
  }

  if (outsideMdViolations.length > 0) {
    console.error("\n[check-staged-md] FAIL: Staged .md file(s) outside the allowlist:\n");
    for (const v of outsideMdViolations) {
      console.error(`  ${v}`);
    }
    console.error(
      "\nHint: .md files are restricted. Area docs must be one of the 6 required names " +
        `(${REQUIRED_DOCS.join(", ")}); ops files go under workspace/tasks/<YYYY>/<MM-Wn>/; ` +
        "see CLAUDE.md for the full allowlist.\n"
    );
  }

  if (areaFolderViolations.length > 0 || outsideMdViolations.length > 0) {
    process.exit(1);
  }

  console.log(
    `[check-staged-md] OK: ${stagedFiles.length} staged file(s) checked, all in allowed locations.`
  );
  process.exit(0);
}

main();
