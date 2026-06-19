#!/usr/bin/env bun
/**
 * check-references.ts
 *
 * Validates the frontmatter schema of every workspace/references/*.md file.
 * The catalog data lives in YAML frontmatter (a `sites:` array); the markdown
 * body is human guidance. See workspace/references/README.md for the schema.
 *
 * Runs on every commit (wired in .husky/pre-commit). Validates ALL reference
 * files on disk, not just staged ones, so the catalog cannot drift out of spec.
 *
 * Ported from control-pane's check-references.ts. Schema is preserved; the
 * brand_fit vocab is retained as-is — it describes the audience/fit of external
 * resources and remains valid terminology for a personal learning/tools catalog.
 * Path is identical (workspace/references/).
 *
 * Exit codes:
 *   0 — all reference files valid (or workspace/references/ absent / empty)
 *   1 — one or more reference files violate the schema
 */

import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const REFERENCES_DIR = join(import.meta.dir, "..", "workspace", "references");

const FILE_KINDS = new Set(["directory-catalog", "community-catalog", "index"]);
const CATALOG_KINDS = new Set(["directory-catalog", "community-catalog"]);
const COST = new Set(["free", "freemium", "paid"]);
const EFFORT = new Set(["low", "medium", "high"]);
const BRAND_FIT = new Set([
  "B2C",
  "B2C-prosumer",
  "B2B-SMB",
  "B2B-high-ticket",
  "B2B-services",
]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function extractFrontmatter(content: string): string | null {
  // Frontmatter must be the very first thing in the file.
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? (match[1] ?? "") : null;
}

function isHttpUrl(v: unknown): boolean {
  return typeof v === "string" && /^https?:\/\//.test(v);
}

function validateSite(site: any, kind: string, idx: number): string[] {
  const errs: string[] = [];
  const where = `sites[${idx}]${site && site.name ? ` (${site.name})` : ""}`;

  if (typeof site !== "object" || site === null || Array.isArray(site)) {
    return [`${where}: must be a mapping`];
  }
  if (!site.name || typeof site.name !== "string")
    errs.push(`${where}: missing "name"`);
  if (!isHttpUrl(site.url))
    errs.push(`${where}: "url" must start with http(s)://`);

  if (!Array.isArray(site.brand_fit) || site.brand_fit.length === 0) {
    errs.push(`${where}: "brand_fit" must be a non-empty array`);
  } else {
    for (const bf of site.brand_fit) {
      if (!BRAND_FIT.has(bf))
        errs.push(
          `${where}: invalid brand_fit "${bf}" (allowed: ${[...BRAND_FIT].join(", ")})`
        );
    }
  }

  if (site.dr !== undefined && site.dr !== null) {
    if (
      typeof site.dr !== "number" ||
      !Number.isInteger(site.dr) ||
      site.dr < 0 ||
      site.dr > 100
    )
      errs.push(`${where}: "dr" must be an integer 0–100 (or omitted if unknown)`);
  }

  if (kind === "directory-catalog") {
    if (!COST.has(site.cost))
      errs.push(`${where}: "cost" must be one of ${[...COST].join(", ")}`);
    if (!EFFORT.has(site.effort))
      errs.push(`${where}: "effort" must be one of ${[...EFFORT].join(", ")}`);
  } else if (kind === "community-catalog") {
    if (!site.audience || typeof site.audience !== "string")
      errs.push(`${where}: "audience" is required (string)`);
    if (!site.posture || typeof site.posture !== "string")
      errs.push(`${where}: "posture" is required (string)`);
    if (site.cost !== undefined && !COST.has(site.cost))
      errs.push(`${where}: "cost" if present must be one of ${[...COST].join(", ")}`);
    if (site.effort !== undefined && !EFFORT.has(site.effort))
      errs.push(`${where}: "effort" if present must be one of ${[...EFFORT].join(", ")}`);
  }

  return errs;
}

function validateFile(filePath: string): string[] {
  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return ["could not read file"];
  }

  const fmText = extractFrontmatter(content);
  if (fmText === null) {
    return ["must begin with a YAML frontmatter block delimited by ---"];
  }

  let fm: any;
  try {
    fm = Bun.YAML.parse(fmText);
  } catch (e: any) {
    return [`frontmatter is not valid YAML: ${e?.message ?? e}`];
  }
  if (typeof fm !== "object" || fm === null || Array.isArray(fm)) {
    return ["frontmatter must be a YAML mapping"];
  }

  const errs: string[] = [];

  if (fm.type !== "reference") errs.push(`"type" must equal "reference"`);
  if (!FILE_KINDS.has(fm.kind))
    errs.push(`"kind" must be one of ${[...FILE_KINDS].join(", ")}`);
  if (!fm.title || typeof fm.title !== "string") errs.push(`"title" is required`);
  if (typeof fm.updated !== "string" || !DATE_RE.test(fm.updated))
    errs.push(`"updated" must be a YYYY-MM-DD date`);

  if (CATALOG_KINDS.has(fm.kind)) {
    if (!fm.category || typeof fm.category !== "string")
      errs.push(`"category" is required for catalog kinds`);
    if (!Array.isArray(fm.sites) || fm.sites.length === 0) {
      errs.push(`"sites" must be a non-empty array for catalog kinds`);
    } else {
      fm.sites.forEach((s: any, i: number) => {
        errs.push(...validateSite(s, fm.kind, i));
      });
    }
  } else if (fm.sites !== undefined && !Array.isArray(fm.sites)) {
    errs.push(`"sites" if present must be an array`);
  }

  return errs;
}

function main() {
  if (!existsSync(REFERENCES_DIR)) {
    console.log(
      "[check-references] NOTICE: workspace/references/ does not exist yet — skipping check."
    );
    process.exit(0);
  }

  let entries: string[];
  try {
    entries = readdirSync(REFERENCES_DIR);
  } catch {
    console.log(
      "[check-references] NOTICE: Could not read workspace/references/ — skipping check."
    );
    process.exit(0);
  }

  const mdFiles = entries.filter((n) => {
    if (!n.endsWith(".md")) return false;
    try {
      return statSync(join(REFERENCES_DIR, n)).isFile();
    } catch {
      return false;
    }
  });

  if (mdFiles.length === 0) {
    console.log("[check-references] NOTICE: no reference files — nothing to check.");
    process.exit(0);
  }

  const failures: Array<{ file: string; errors: string[] }> = [];
  for (const name of mdFiles) {
    const errors = validateFile(join(REFERENCES_DIR, name));
    if (errors.length > 0)
      failures.push({ file: `workspace/references/${name}`, errors });
  }

  if (failures.length > 0) {
    console.error(
      "\n[check-references] FAIL: reference file(s) violate the frontmatter schema:\n"
    );
    for (const { file, errors } of failures) {
      console.error(`  ${file}`);
      for (const e of errors) console.error(`    - ${e}`);
    }
    console.error("\nSee workspace/references/README.md for the schema.\n");
    process.exit(1);
  }

  console.log(
    `[check-references] OK: ${mdFiles.length} reference file(s) all valid.`
  );
  process.exit(0);
}

main();
