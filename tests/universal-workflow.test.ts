import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { analyzeBlueprint } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/compatibility-graph.ts";
import { generateBlueprint } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts";

const ruleText = await readFile(new URL("../plugins/blueprint-architect-plugin/skills/blueprint-architect/references/capability-rules.yaml", import.meta.url), "utf8");
async function input(name: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(new URL(`./fixtures/blueprints/${name}`, import.meta.url), "utf8"));
}

async function generatedFiles(root: string, files: string[]): Promise<Map<string, string>> {
  return new Map(await Promise.all(files.map(async (file) => [file, await readFile(join(root, ...file.split("/")), "utf8")] as const)));
}

test("analyzes and generates materially different stacks end to end", async () => {
  const output = await mkdtemp(join(tmpdir(), "universal-workflow-"));
  try {
    const web = analyzeBlueprint(await input("nextjs-ai-saas.json"), ruleText);
    const service = analyzeBlueprint(await input("container-realtime-service.json"), ruleText);
    const unknown = analyzeBlueprint(await input("unfamiliar-stack.json"), ruleText);
    assert.deepEqual(web.report.uncoveredEdges, []);
    assert.deepEqual(service.report.uncoveredEdges, []);
    assert.deepEqual(unknown.report.uncoveredEdges, []);
    assert.equal(new Set(web.report.findings.map((finding) => finding.edgeId)).size, web.report.findings.length);
    assert.ok(web.report.findings.some((finding) => finding.edgeId === "edge-tech-prisma-deploy-deploy-vercel" && finding.status === "conditional"));
    assert.ok(web.report.findings.filter((finding) => finding.status === "verified_compatible").every((finding) => finding.evidenceIds.length > 0));
    assert.ok(unknown.report.findings.some((finding) => finding.status === "unverified" && finding.affectedIds.includes("tech-novel")));
    const webResult = await generateBlueprint(web.spec, output);
    const serviceResult = await generateBlueprint(service.spec, output);
    assert.notDeepEqual(webResult.manifest, serviceResult.manifest);
    assert.ok(webResult.manifest.includes("src/domain/conversations/README.md"));
    assert.ok(serviceResult.manifest.includes("packages/presence-protocol/README.md"));
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("capability conflicts are detected independently of vendor names", async () => {
  const spec = await input("container-realtime-service.json");
  spec.technologies.find((technology: any) => technology.id === "tech-redis").capabilities["state-location"] = "process-memory";
  const analysis = analyzeBlueprint(spec, ruleText);
  assert.ok(analysis.report.findings.some((finding) => finding.id === "finding-process-memory-multi-instance" && finding.status === "conflict"));
});

test("identical analyzed input produces byte-identical files", async () => {
  const firstRoot = await mkdtemp(join(tmpdir(), "universal-deterministic-a-"));
  const secondRoot = await mkdtemp(join(tmpdir(), "universal-deterministic-b-"));
  try {
    const source = await input("nextjs-ai-saas.json");
    const first = await generateBlueprint(analyzeBlueprint(structuredClone(source), ruleText).spec, firstRoot);
    const second = await generateBlueprint(analyzeBlueprint(structuredClone(source), ruleText).spec, secondRoot);
    assert.deepEqual(first.manifest, second.manifest);
    assert.deepEqual(await generatedFiles(first.targetDir, first.manifest), await generatedFiles(second.targetDir, second.manifest));
  } finally {
    await rm(firstRoot, { recursive: true, force: true });
    await rm(secondRoot, { recursive: true, force: true });
  }
});

test("invalid input creates no project target", async () => {
  const output = await mkdtemp(join(tmpdir(), "universal-invalid-"));
  try {
    const invalid = await input("nextjs-ai-saas.json");
    invalid.modules[0].path = "../escape";
    assert.throws(() => analyzeBlueprint(invalid, ruleText), /modules\[0\]\.path/);
    await assert.rejects(readFile(join(output, "ai-support-saas", "README.md")), /ENOENT/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
