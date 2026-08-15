import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateBlueprint, resolveProjectTarget, validateProjectName } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts";
import { validateBlueprintSpec } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts";

async function fixture(): Promise<any> {
  return JSON.parse(await readFile(new URL("./fixtures/blueprints/nextjs-ai-saas.json", import.meta.url), "utf8"));
}

test("project-name validation rejects traversal and platform-specific paths", () => {
  for (const name of ["", ".", "..", "../escape", "a/b", "a\\b", "C:\\escape", "UpperCase", "double--dash"]) assert.throws(() => validateProjectName(name), /lowercase letters/);
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

test("generator creates deterministic declared output and refuses overwrite", async () => {
  const output = await mkdtemp(join(tmpdir(), "blueprint-generate-"));
  try {
    const spec = validateBlueprintSpec(await fixture());
    const result = await generateBlueprint(spec, output);
    assert.equal(result.targetDir, join(output, "ai-support-saas"));
    assert.deepEqual(result.manifest, [...result.manifest].sort());
    assert.ok(result.manifest.includes("src/ai-orchestration/README.md"));
    assert.ok(result.manifest.includes("interfaces/if-chat.md"));
    assert.ok(result.manifest.includes("blueprint.spec.json"));
    const readme = await readFile(join(result.targetDir, "README.md"), "utf8");
    assert.doesNotMatch(readme, /All tests pass|Deployed to|✅/);
    await assert.rejects(generateBlueprint(spec, output), /Target already exists/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
