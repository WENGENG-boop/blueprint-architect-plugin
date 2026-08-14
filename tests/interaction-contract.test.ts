import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const skillRoot = join(root, "plugins", "blueprint-architect-plugin", "skills", "blueprint-architect");

async function proseFiles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await proseFiles(path)));
    else if (/\.(md|yaml|yml)$/.test(entry.name)) result.push(path);
  }
  return result;
}

test("skill mandates the structured selector for every decision path", async () => {
  const skill = await readFile(join(skillRoot, "SKILL.md"), "utf8");
  for (const phrase of ["request_user_input", "exactly one question", "two or three mutually exclusive options", "(Recommended)", "compatibility correction", "final confirmation", "Enter `/plan`"]) {
    assert.ok(skill.includes(phrase), `missing interaction phrase: ${phrase}`);
  }
});

test("bundled material contains no stale typed-choice prompt", async () => {
  for (const file of await proseFiles(skillRoot)) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /Your choice\s*:/i, file);
    assert.doesNotMatch(content, /Proceed[^\n]*\(Y\/N\)/i, file);
    assert.doesNotMatch(content, /Reply with (?:A|B|C)/i, file);
  }
});

test("skill defines a safe and executable GitHub lookup contract", async () => {
  const skill = await readFile(join(skillRoot, "SKILL.md"), "utf8");
  for (const phrase of [
    "explicitly requests public implementation references",
    "node --experimental-strip-types",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "PRD prose, secrets, customer names, or private requirements",
    "rate_limited",
  ]) {
    assert.ok(skill.includes(phrase), `missing GitHub lookup contract: ${phrase}`);
  }
});
