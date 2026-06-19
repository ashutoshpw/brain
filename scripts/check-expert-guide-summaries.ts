#!/usr/bin/env bun
/**
 * check-expert-guide-summaries.ts
 *
 * Validates staged expert-guide video summaries:
 *   workspace/resources/expert-guide/youtube/<videoId>/SUMMARY.md
 *
 * Each SUMMARY.md must start with YAML frontmatter containing mandatory fields:
 *   title, date, tags, videoId
 *
 * The frontmatter videoId must match the parent directory name.
 *
 * Copied nearly verbatim from control-pane's check-expert-guide-summaries.ts.
 * The path convention is identical in brain (workspace/resources/ is unchanged).
 *
 * Exit codes:
 *   0 — all staged summaries pass (or none staged)
 *   1 — one or more violations
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const SUMMARY_PATH_RE =
  /^workspace\/resources\/expert-guide\/youtube\/([^/]+)\/SUMMARY\.md$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

const MANDATORY_FIELDS = ["title", "date", "tags", "videoId"] as const;

type MandatoryField = (typeof MANDATORY_FIELDS)[number];

interface ParsedFrontmatter {
  fields: Partial<Record<MandatoryField, string>>;
  tags: string[];
}

function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf8",
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    console.log(
      "[check-expert-guide-summaries] NOTICE: Could not run git diff — skipping check."
    );
    process.exit(0);
  }
}

function parseFrontmatter(content: string): ParsedFrontmatter | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const block = match[1] ?? "";
  const fields: Partial<Record<MandatoryField, string>> = {};
  const tags: string[] = [];

  const lines = block.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Inline array: tags: [a, b]
    const inlineArray = line.match(/^tags:\s*\[(.*)\]\s*$/);
    if (inlineArray) {
      const raw = inlineArray[1] ?? "";
      for (const part of raw.split(",")) {
        const tag = part.trim().replace(/^['"]|['"]$/g, "");
        if (tag) tags.push(tag);
      }
      i += 1;
      continue;
    }

    // Block list: tags:\n  - a\n  - b
    if (line.match(/^tags:\s*$/)) {
      i += 1;
      while (i < lines.length) {
        const listLine = lines[i] ?? "";
        const listMatch = listLine.match(/^\s*-\s+(.+?)\s*$/);
        if (!listMatch) break;
        const tag = (listMatch[1] ?? "").replace(/^['"]|['"]$/g, "").trim();
        if (tag) tags.push(tag);
        i += 1;
      }
      continue;
    }

    const kv = line.match(/^([a-zA-Z]+):\s*(.+?)\s*$/);
    if (kv) {
      const key = kv[1] as MandatoryField;
      const value = (kv[2] ?? "").replace(/^['"]|['"]$/g, "").trim();
      if ((MANDATORY_FIELDS as readonly string[]).includes(key)) {
        fields[key] = value;
      }
    }

    i += 1;
  }

  return { fields, tags };
}

function validateSummary(filePath: string): string[] {
  const pathMatch = filePath.match(SUMMARY_PATH_RE);
  if (!pathMatch) return [];

  const dirVideoId = pathMatch[1] ?? "";
  const absPath = join(ROOT, filePath);
  const errors: string[] = [];

  let content: string;
  try {
    content = readFileSync(absPath, "utf8");
  } catch {
    return [`${filePath}: could not read file`];
  }

  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return [
      `${filePath}: missing YAML frontmatter block (must start with --- and include title, date, tags, videoId)`,
    ];
  }

  for (const field of MANDATORY_FIELDS) {
    if (field === "tags") continue;
    const value = parsed.fields[field];
    if (!value || value.length === 0) {
      errors.push(`${filePath}: frontmatter missing mandatory field "${field}"`);
    }
  }

  if (parsed.tags.length === 0) {
    errors.push(`${filePath}: frontmatter "tags" must contain at least one tag`);
  }

  const videoId = parsed.fields.videoId;
  if (videoId && !VIDEO_ID_RE.test(videoId)) {
    errors.push(`${filePath}: frontmatter "videoId" has invalid format`);
  }

  if (videoId && videoId !== dirVideoId) {
    errors.push(
      `${filePath}: frontmatter videoId "${videoId}" must match directory "${dirVideoId}"`
    );
  }

  const date = parsed.fields.date;
  if (date && !DATE_RE.test(date)) {
    errors.push(`${filePath}: frontmatter "date" must be YYYY-MM-DD (got "${date}")`);
  }

  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
  if (body.length === 0) {
    errors.push(`${filePath}: summary body is empty after frontmatter`);
  }

  return errors;
}

function main() {
  const staged = getStagedFiles();
  const summaryFiles = staged.filter((file) => SUMMARY_PATH_RE.test(file));

  if (summaryFiles.length === 0) {
    process.exit(0);
  }

  const errors: string[] = [];
  for (const file of summaryFiles) {
    errors.push(...validateSummary(file));
  }

  if (errors.length > 0) {
    console.error("\n[check-expert-guide-summaries] FAIL:\n");
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    console.error(
      "\nHint: store video learnings at workspace/resources/expert-guide/youtube/<videoId>/SUMMARY.md " +
        "with frontmatter fields: title, date, tags, videoId.\n"
    );
    process.exit(1);
  }

  console.log(
    `[check-expert-guide-summaries] OK: ${summaryFiles.length} staged summary file(s) validated.`
  );
  process.exit(0);
}

main();
