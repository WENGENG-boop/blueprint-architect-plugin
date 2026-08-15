import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateBlueprintSpec } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts";

async function fixture(): Promise<Record<string, any>> {
  return JSON.parse(await readFile(new URL("./fixtures/blueprints/nextjs-ai-saas.json", import.meta.url), "utf8"));
}

test("validates a complete BlueprintSpec", async () => {
  const spec = validateBlueprintSpec(await fixture());
  assert.equal(spec.project.id, "ai-support-saas");
  assert.equal(spec.modules.length, 5);
  assert.equal(spec.interfaces.length, 2);
});

test("rejects unsafe module paths and duplicate identifiers", async () => {
  const unsafe = await fixture();
  unsafe.modules[0].path = "../escape";
  assert.throws(() => validateBlueprintSpec(unsafe), /modules\[0\]\.path/);

  const duplicate = await fixture();
  duplicate.modules[1].id = duplicate.modules[0].id;
  assert.throws(() => validateBlueprintSpec(duplicate), /duplicate id/);
});

test("rejects dangling references and empty confirmed responsibilities", async () => {
  const dangling = await fixture();
  dangling.modules[0].requirementIds = ["req-missing"];
  assert.throws(() => validateBlueprintSpec(dangling), /unknown requirement/);

  const empty = await fixture();
  empty.modules[0].responsibilities = [];
  assert.throws(() => validateBlueprintSpec(empty), /responsibilities must contain at least one value/);
});

test("rejects verified findings without primary evidence", async () => {
  const spec = await fixture();
  spec.findings[0].evidenceIds = [];
  assert.throws(() => validateBlueprintSpec(spec), /verified_compatible requires primary evidence/);
});

test("rejects embedded secret fields", async () => {
  const spec = await fixture();
  spec.project.token = "actual-secret-value";
  assert.throws(() => validateBlueprintSpec(spec), /project\.token must contain a configuration name/);
});
