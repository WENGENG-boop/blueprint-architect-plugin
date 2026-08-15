import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCapabilityRules } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/capability-engine.ts";
import { evaluateCompatibility } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/compatibility-graph.ts";
import { validateBlueprintSpec } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts";

const rules = parseCapabilityRules(await readFile(new URL("../plugins/blueprint-architect-plugin/skills/blueprint-architect/references/capability-rules.yaml", import.meta.url), "utf8"));
async function load(name: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(new URL(`./fixtures/blueprints/${name}`, import.meta.url), "utf8"));
}

test("covers every declared edge and preserves primary-evidence verification", async () => {
  const report = evaluateCompatibility(validateBlueprintSpec(await load("nextjs-ai-saas.json")), rules);
  assert.deepEqual(report.uncoveredEdges, []);
  assert.equal(report.findingsByEdge.get("edge-tech-prisma-depends-tech-mysql")?.status, "verified_compatible");
  assert.ok(report.edges.length > 15);
});

test("missing or contradictory evidence cannot remain verified", async () => {
  const missing = await load("nextjs-ai-saas.json");
  missing.evidence = missing.evidence.filter((item: any) => item.id !== "ev-prisma-mysql");
  missing.findings[0].evidenceIds = [];
  missing.findings[0].status = "unverified";
  assert.equal(evaluateCompatibility(validateBlueprintSpec(missing), rules).findingsByEdge.get("edge-tech-prisma-depends-tech-mysql")?.status, "unverified");

  const contradictory = await load("nextjs-ai-saas.json");
  contradictory.evidence.push({ id: "ev-contradiction", sourceType: "official_docs", url: "https://example.com/official", subject: "Conflicting version note", versionRange: "selected versions", retrievedAt: "2026-08-15", claim: "Selected versions require an unavailable adapter.", supports: [], contradicts: ["edge-tech-prisma-depends-tech-mysql"] });
  assert.equal(evaluateCompatibility(validateBlueprintSpec(contradictory), rules).findingsByEdge.get("edge-tech-prisma-depends-tech-mysql")?.status, "conditional");
});

test("unknown technology produces explicit unverified findings", async () => {
  const report = evaluateCompatibility(validateBlueprintSpec(await load("unfamiliar-stack.json")), rules);
  assert.deepEqual(report.uncoveredEdges, []);
  assert.ok(report.findings.some((finding) => finding.status === "unverified" && finding.affectedIds.includes("tech-novel")));
  assert.ok(report.findings.every((finding) => finding.status !== "verified_compatible"));
});

test("rule corrections are ordered from least disruptive", async () => {
  const report = evaluateCompatibility(validateBlueprintSpec(await load("nextjs-ai-saas.json")), rules);
  const finding = report.findingsByEdge.get("edge-tech-prisma-deploy-deploy-vercel");
  assert.equal(finding?.status, "conditional");
  assert.deepEqual(finding?.corrections.slice(0, 2).map((item) => item.kind), ["configuration", "adapter"]);
});
