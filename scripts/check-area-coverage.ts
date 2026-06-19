#!/usr/bin/env bun
/**
 * check-area-coverage.ts
 *
 * Ensures every area (each immediate subdirectory of workspace/areas/) is
 * referenced in all the area-list docs that must stay in sync when an area is
 * added. Validate-and-block — it never edits files; it tells you exactly which
 * docs still need the new area.
 *
 * To track an additional doc, add an entry to LOCATIONS below.
 *
 * Ported from control-pane's check-brand-coverage.ts; adapted for the personal
 * brain repo (areas/ instead of projects/).
 *
 * Locations checked:
 *   1. CLAUDE.md — "## The 6 life areas" section
 *   2. workspace/references/README.md — area→archetype mapping (if file exists)
 *   3. .agents/skills/life-status/SKILL.md — area table (if file exists; skipped
 *      gracefully with a NOTE if absent since the skill is not built yet in Phase 1)
 *
 * TODO (Phase 4): wire the life-status skill check once .agents/skills/life-status/SKILL.md
 * is authored. For now the check is tolerant: if the file is absent it skips with a note
 * rather than hard-failing, so Phase 1 commits pass cleanly.
 *
 * Exit codes:
 *   0 — every area is present in every required location (or no areas yet)
 *   1 — one or more areas are missing from one or more locations
 */

import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const AREAS_DIR = join(ROOT, "workspace", "areas");

/**
 * A place an area name must appear. `section` optionally narrows the search
 * to the markdown section under a given `## Heading` (up to the next `#`/`##`
 * heading), so e.g. CLAUDE.md's tables can be checked independently.
 */
interface Location {
  file: string;    // path relative to repo root
  label: string;   // shown to the user
  section?: string; // heading text to scope the search
  optional?: boolean; // if true, skip gracefully if file is absent
}

const LOCATIONS: Location[] = [
  {
    file: "CLAUDE.md",
    label: "CLAUDE.md (The 6 life areas table)",
    section: "## The 6 life areas",
  },
  {
    file: "workspace/references/README.md",
    label: "references README (area→archetype mapping)",
    optional: true,
  },
  {
    file: ".agents/skills/life-status/SKILL.md",
    label: "life-status skill (area table)",
    optional: true, // TODO: Phase 4 — remove optional once skill is authored
  },
];

/** Return the slice of `content` under `heading` up to the next markdown heading. */
function sectionText(content: string, heading: string): string {
  const lines = content.split("\n");
  const start = lines.findIndex((l) => l.trim() === heading || l.startsWith(heading));
  if (start === -1) return ""; // heading not found → treat as not covered
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function getAreas(): string[] {
  if (!existsSync(AREAS_DIR)) return [];
  let entries: string[];
  try {
    entries = readdirSync(AREAS_DIR);
  } catch {
    return [];
  }
  return entries.filter((name) => {
    try {
      return statSync(join(AREAS_DIR, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

interface TextResult {
  loc: Location;
  text: string | null;     // null means file not found
  skipped: boolean;        // true when optional and file absent
}

function textFor(loc: Location): TextResult {
  const abs = join(ROOT, loc.file);
  if (!existsSync(abs)) {
    if (loc.optional) {
      return { loc, text: null, skipped: true };
    }
    // Non-optional missing file → treat as "area not found" (text = null, not skipped)
    return { loc, text: null, skipped: false };
  }
  let content: string;
  try {
    content = readFileSync(abs, "utf8");
  } catch {
    return { loc, text: null, skipped: false };
  }
  const text = loc.section ? sectionText(content, loc.section) : content;
  return { loc, text, skipped: false };
}

function main() {
  const areas = getAreas();
  if (areas.length === 0) {
    console.log("[check-area-coverage] NOTICE: no area dirs — nothing to check.");
    process.exit(0);
  }

  // Pre-read each location's searchable text once.
  const locResults = LOCATIONS.map((loc) => textFor(loc));

  // Log graceful skips for optional missing files
  for (const { loc, skipped } of locResults) {
    if (skipped) {
      console.log(
        `[check-area-coverage] NOTE: ${loc.label} — file not found (${loc.file}); skipping this check (optional until authored).`
      );
    }
  }

  // area → list of missing location labels
  const failures: Array<{ area: string; missing: string[] }> = [];

  for (const area of areas) {
    const missing: string[] = [];
    for (const { loc, text, skipped } of locResults) {
      if (skipped) continue; // optional and absent — don't penalise
      if (text === null) {
        missing.push(`${loc.label} — FILE NOT FOUND (${loc.file})`);
      } else if (!text.includes(area)) {
        missing.push(loc.label);
      }
    }
    if (missing.length > 0) failures.push({ area, missing });
  }

  if (failures.length > 0) {
    console.error("\n[check-area-coverage] FAIL: area(s) missing from docs:\n");
    for (const { area, missing } of failures) {
      console.error(`  ${area}  (workspace/areas/${area}/)`);
      for (const m of missing) console.error(`    - ${m}`);
      console.error("");
    }
    console.error(
      "Add the area to each listed location (with its real metadata),\n" +
        "then re-commit. See CLAUDE.md for the area-list conventions.\n"
    );
    process.exit(1);
  }

  const checkedCount = locResults.filter((r) => !r.skipped).length;
  console.log(
    `[check-area-coverage] OK: ${areas.length} area(s) present in all ${checkedCount} required location(s).`
  );
  process.exit(0);
}

main();
