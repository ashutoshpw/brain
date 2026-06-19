#!/usr/bin/env bun
/**
 * check-workspace-layout.ts
 *
 * Ensures `workspace/` contains only approved top-level folders:
 *   areas/, references/, resources/, people/, scheduled/, tasks/
 *
 * No other directories or files may live directly under `workspace/`. Adding a
 * new top-level folder requires an explicit owner instruction and updating the
 * ALLOWED_DIRS list in this script.
 *
 * Ported from control-pane's check-workspace-layout.ts; updated ALLOWED_DIRS
 * for the personal brain repo (areas + people instead of projects + social-profiles).
 *
 * Exit codes:
 *   0 — layout is valid (or workspace/ does not exist yet)
 *   1 — one or more disallowed entries found under workspace/
 */

import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const WORKSPACE_DIR = join(ROOT, "workspace");

/** Top-level workspace folders permitted without explicit owner sign-off. */
const ALLOWED_DIRS = new Set([
  "areas",
  "references",
  "resources",
  "people",
  "scheduled",
  "tasks",
]);

function main() {
  if (!existsSync(WORKSPACE_DIR)) {
    console.log("[check-workspace-layout] OK: workspace/ does not exist — nothing to check.");
    process.exit(0);
  }

  const entries = readdirSync(WORKSPACE_DIR);
  const violations: string[] = [];

  for (const entry of entries) {
    const fullPath = join(WORKSPACE_DIR, entry);
    const relPath = `workspace/${entry}`;
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!ALLOWED_DIRS.has(entry)) {
        violations.push(`disallowed directory: ${relPath}/`);
      }
      continue;
    }

    violations.push(`disallowed file: ${relPath}`);
  }

  if (violations.length > 0) {
    console.error(
      "\n[check-workspace-layout] FAIL: workspace/ may only contain these top-level folders:\n"
    );
    for (const dir of [...ALLOWED_DIRS].sort()) {
      console.error(`  workspace/${dir}/`);
    }
    console.error("\nFound disallowed entries:\n");
    for (const v of violations) {
      console.error(`  ${v}`);
    }
    console.error(
      "\nHint: remove or relocate the entries above. A new top-level workspace folder " +
        "requires explicit owner instruction and an update to ALLOWED_DIRS in " +
        "scripts/check-workspace-layout.ts.\n"
    );
    process.exit(1);
  }

  console.log(
    `[check-workspace-layout] OK: workspace/ contains only ${ALLOWED_DIRS.size} approved top-level folder(s).`
  );
  process.exit(0);
}

main();
