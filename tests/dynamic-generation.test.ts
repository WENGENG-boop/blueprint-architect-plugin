import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateBlueprint } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts";
import { validateBlueprintSpec } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts";

async function fixture(name: string): Promise<any> {
  return validateBlueprintSpec(JSON.parse(await readFile(new URL(`./fixtures/blueprints/${name}`, import.meta.url), "utf8")));
}

test("different PRDs generate different declared module and interface trees", async () => {
  const output = await mkdtemp(join(tmpdir(), "blueprint-dynamic-"));
  try {
    const webResult = await generateBlueprint(await fixture("nextjs-ai-saas.json"), output);
    const serviceResult = await generateBlueprint(await fixture("container-realtime-service.json"), output);
    assert.notDeepEqual(webResult.manifest, serviceResult.manifest);
    assert.ok(webResult.manifest.includes("src/ai-orchestration/README.md"));
    assert.ok(serviceResult.manifest.includes("services/presence-gateway/README.md"));
    assert.ok(!serviceResult.manifest.includes("components/README.md"));
    assert.ok(!serviceResult.manifest.includes("app/README.md"));
    const chatContract = await readFile(join(webResult.targetDir, "interfaces", "if-chat.md"), "utf8");
    assert.match(chatContract, /POST/);
    assert.match(chatContract, /\/api\/chat/);
    assert.match(chatContract, /TenantMismatch|tenant mismatch/i);
    const moduleDoc = await readFile(join(serviceResult.targetDir, "services", "presence-gateway", "README.md"), "utf8");
    assert.match(moduleDoc, /Authenticate realtime connections/);
    assert.match(moduleDoc, /test-gateway-e2e/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("manifest and traceability documents contain only declared artifacts", async () => {
  const output = await mkdtemp(join(tmpdir(), "blueprint-manifest-"));
  try {
    const result = await generateBlueprint(await fixture("container-realtime-service.json"), output);
    const manifest = JSON.parse(await readFile(join(result.targetDir, "blueprint.manifest.json"), "utf8"));
    assert.deepEqual(manifest.files, result.manifest);
    const traceability = await readFile(join(result.targetDir, "architecture", "traceability.md"), "utf8");
    assert.match(traceability, /req-presence/);
    assert.match(traceability, /mod-gateway/);
    assert.match(traceability, /test-gateway-e2e/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
