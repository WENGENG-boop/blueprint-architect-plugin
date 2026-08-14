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

test("skill prefers the selector and defines a numbered fallback for every decision path", async () => {
  const skill = await readFile(join(skillRoot, "SKILL.md"), "utf8");
  for (const phrase of ["request_user_input", "one question at a time", "two or three mutually exclusive options", "(Recommended)", "compatibility correction", "final confirmation", "numbered prose list", "do not stop merely because the selector is unavailable"]) {
    assert.ok(skill.includes(phrase), `missing interaction phrase: ${phrase}`);
  }

  const agentPrompt = await readFile(join(skillRoot, "agents", "openai.yaml"), "utf8");
  for (const phrase of ["Prefer request_user_input", "Outside Plan mode", "numbered prose list", "number or exact label"]) {
    assert.ok(agentPrompt.includes(phrase), `agent prompt is missing fallback phrase: ${phrase}`);
  }
});

test("bundled material contains no stale stop-on-missing-selector rule", async () => {
  for (const file of await proseFiles(skillRoot)) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /show no prose choices/i, file);
    assert.doesNotMatch(content, /stop before asking or proceeding/i, file);
    assert.doesNotMatch(content, /stop and direct me to \/plan/i, file);
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
