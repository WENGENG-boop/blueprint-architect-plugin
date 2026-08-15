import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { capabilityContext, evaluateCapabilityRules, parseCapabilityRules } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/capability-engine.ts";

const rulesUrl = new URL("../plugins/blueprint-architect-plugin/skills/blueprint-architect/references/capability-rules.yaml", import.meta.url);
const rules = parseCapabilityRules(await readFile(rulesUrl, "utf8"));

test("matches ephemeral runtime and persistent connection capabilities", () => {
  const context = capabilityContext({
    deployment: { "instance-lifecycle": "ephemeral" },
    "technology:database-client": { "connection-lifecycle": "persistent" },
  });
  const findings = evaluateCapabilityRules(context, rules);
  assert.equal(findings[0].ruleId, "ephemeral-runtime-persistent-connections");
  assert.equal(findings[0].status, "conditional");
});

test("preserves the original SEO, realtime, and session scenarios as capabilities", () => {
  const seo = evaluateCapabilityRules(capabilityContext({
    "technology:web-framework": { rendering: ["client-only"] },
    requirement: { seo: "critical" },
  }), rules);
  assert.ok(seo.some((finding) => finding.ruleId === "client-only-rendering-seo"));

  const realtime = evaluateCapabilityRules(capabilityContext({
    deployment: { delivery: "static" },
    requirement: { realtime: true },
  }), rules);
  assert.ok(realtime.some((finding) => finding.ruleId === "static-delivery-realtime-channel"));

  const session = evaluateCapabilityRules(capabilityContext({
    "technology:session-store": { "state-location": "process-memory" },
    deployment: { scale: "multi-instance" },
  }), rules);
  assert.equal(session.find((finding) => finding.ruleId === "process-memory-multi-instance")?.status, "conflict");
});

test("no rule match produces no finding rather than verified compatibility", () => {
  assert.deepEqual(evaluateCapabilityRules(capabilityContext({ "technology:runtime": { "module-system": "esm" } }), rules), []);
});

test("rejects malformed rule operators and verified claims", () => {
  const base = { version: 1, rules: [{ id: "bad", severity: "warning", all: [{ selector: "x", capability: "y", operator: "maybe", value: true }], any: [], result: { status: "conditional", issue: "Issue", impact: "Impact", corrections: [] } }] };
  assert.throws(() => parseCapabilityRules(JSON.stringify(base)), /operator is not supported/);
  base.rules[0].all[0].operator = "exists";
  base.rules[0].result.status = "verified_compatible";
  assert.throws(() => parseCapabilityRules(JSON.stringify(base)), /cannot claim verified compatibility/);
});
