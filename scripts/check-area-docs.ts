#!/usr/bin/env bun
/**
 * check-area-docs.ts
 *
 * Verifies that every immediate subdirectory under workspace/areas/
 * contains all 6 required, non-empty documentation files.
 *
 * Ported from control-pane's check-project-docs.ts; adapted for the
 * personal brain repo's 6 life-area docs (instead of 10 brand docs).
 *
 * To require an additional doc in the future, add its filename to REQUIRED_DOCS.
 *
 * Exit codes:
 *   0 — all good (or workspace/areas/ doesn't exist / is empty)
 *   1 — one or more area dirs are missing required docs
 */

import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import { join } from "path";

export const REQUIRED_DOCS = [
  "OVERVIEW.md",
  "GOALS.md",
  "METRICS.md",
  "ROADMAP.md",
  "HABITS.md",
  "PRINCIPLES.md",
];

const AREAS_DIR = join(import.meta.dir, "..", "workspace", "areas");

function main() {
  // Gracefully handle missing workspace/areas/
  if (!existsSync(AREAS_DIR)) {
    console.log(
      "[check-area-docs] NOTICE: workspace/areas/ does not exist yet — skipping check."
    );
    process.exit(0);
  }

  // Collect immediate subdirectories
  let entries: string[];
  try {
    entries = readdirSync(AREAS_DIR);
  } catch {
    console.log(
      "[check-area-docs] NOTICE: Could not read workspace/areas/ — skipping check."
    );
    process.exit(0);
  }

  const areaDirs = entries.filter((name) => {
    try {
      return statSync(join(AREAS_DIR, name)).isDirectory();
    } catch {
      return false;
    }
  });

  if (areaDirs.length === 0) {
    console.log(
      "[check-area-docs] NOTICE: workspace/areas/ is empty — nothing to check."
    );
    process.exit(0);
  }

  // Collect failures: map of dir → list of missing/empty doc names
  const failures: Array<{ dir: string; issues: string[] }> = [];

  for (const dir of areaDirs) {
    const issues: string[] = [];
    for (const doc of REQUIRED_DOCS) {
      const docPath = join(AREAS_DIR, dir, doc);
      if (!existsSync(docPath)) {
        issues.push(`${doc} not found`);
        continue;
      }
      try {
        const content = readFileSync(docPath, "utf8").trim();
        if (content.length === 0) {
          issues.push(`${doc} is empty`);
        }
      } catch {
        issues.push(`${doc} could not be read`);
      }
    }
    if (issues.length > 0) {
      failures.push({ dir, issues });
    }
  }

  if (failures.length > 0) {
    console.error(
      "\n[check-area-docs] FAIL: The following area directories have missing or empty required docs:\n"
    );
    for (const { dir, issues } of failures) {
      console.error(`  workspace/areas/${dir}/`);
      for (const issue of issues) {
        console.error(`    - ${issue}`);
      }
    }
    console.error(
      `\nRequired docs: ${REQUIRED_DOCS.join(", ")}\n` +
        "Add the missing file(s), make them non-empty, and stage them before committing.\n"
    );
    process.exit(1);
  }

  const summary = areaDirs.map((d) => `workspace/areas/${d}/`).join(", ");
  console.log(
    `[check-area-docs] OK: ${areaDirs.length} area(s) all have ${REQUIRED_DOCS.join(" + ")} — ${summary}`
  );
  process.exit(0);
}

if (import.meta.main) {
  main();
}
