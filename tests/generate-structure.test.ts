import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateProjectStructure, resolveProjectTarget, validateProjectName } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts";

test("project-name validation rejects traversal and platform-specific paths", () => {
  for (const name of ["", ".", "..", "../escape", "a/b", "a\\b", "C:\\escape", "UpperCase", "double--dash"]) {
    assert.throws(() => validateProjectName(name), /lowercase letters/);
  }
  assert.equal(validateProjectName("safe-project-2"), "safe-project-2");
});

test("resolved target is a direct output child", async () => {
  const output = await mkdtemp(join(tmpdir(), "blueprint-target-"));
  try {
    assert.equal(resolveProjectTarget(output, "safe-project"), join(output, "safe-project"));
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("generator creates truthful deterministic output and refuses overwrite", async () => {
  const output = await mkdtemp(join(tmpdir(), "blueprint-generate-"));
  try {
    const config = { name: "safe-project", description: "A confirmed project blueprint.", techStack: { frontend: "nextjs", database: "postgresql" }, outputDir: output };
    const result = await generateProjectStructure(config);
    assert.equal(result.targetDir, join(output, "safe-project"));
    assert.deepEqual(result.manifest, [...result.manifest].sort());
    assert.ok(result.manifest.includes("README.md"));
    assert.ok(result.manifest.includes("package.json"));
    const packageJson = JSON.parse(await readFile(join(result.targetDir, "package.json"), "utf8"));
    assert.equal(packageJson.name, "safe-project");
    const readme = await readFile(join(result.targetDir, "README.md"), "utf8");
    assert.doesNotMatch(readme, /All tests pass|Deployed to|✅/);
    await assert.rejects(generateProjectStructure(config), /Target already exists/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
