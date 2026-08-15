# Universal Compatibility Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed scaffold and four-rule advisory matrix with a versioned, evidence-aware compatibility engine and a PRD-driven dynamic blueprint generator.

**Architecture:** The Skill converts a reviewed PRD into a versioned `BlueprintSpec`. Focused deterministic modules validate that contract, normalize capability data, build and evaluate compatibility edges, enforce evidence requirements, and generate an atomic project tree directly from declared modules. Unknown or version-sensitive combinations remain explicit instead of being silently treated as compatible.

**Tech Stack:** TypeScript on Node.js 22, Node test runner, YAML rule resources, JSON fixtures, existing Codex Skill and Plugin manifests.

---

## File Map

Create these focused implementation units:

- `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/blueprint-types.ts` — canonical `BlueprintSpec`, finding, evidence, module, interface, and generation types.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts` — structural, reference, path, and honesty validation.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/capability-engine.ts` — capability-rule parsing and deterministic matching.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/compatibility-graph.ts` — edge construction, evidence policy, finding status, and correction ordering.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/capability-rules.yaml` — extensible capability-based rules replacing the named four-rule matrix.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/evidence-policy.md` — primary-source, version, freshness, privacy, and confidence requirements used by the Skill.
- `tests/fixtures/blueprints/nextjs-ai-saas.json` — serverless web/AI fixture.
- `tests/fixtures/blueprints/container-realtime-service.json` — containerized realtime fixture with a materially different module tree.
- `tests/fixtures/blueprints/unfamiliar-stack.json` — unknown-technology fixture proving safe `unverified` behavior.
- `tests/blueprint-spec.test.ts` — contract and reference validation.
- `tests/capability-engine.test.ts` — general rule evaluation.
- `tests/compatibility-graph.test.ts` — full edge coverage, evidence, statuses, and correction ordering.
- `tests/dynamic-generation.test.ts` — distinct dynamic trees and concrete documents.

Modify these existing units:

- `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts` — replace `ProjectConfig` and fixed directories with validated `BlueprintSpec` generation.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/SKILL.md` — construct, evaluate, review, and generate from `BlueprintSpec`.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/templates/v2-module-template.md` — require concrete module fields and machine-checkable traceability.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/module-types.yaml` — convert defaults into optional capability-driven examples rather than fixed directories.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/compatibility-matrix.yaml` — remove after its four scenarios have migrated to capability rules and regression tests.
- `plugins/blueprint-architect-plugin/skills/blueprint-architect/agents/openai.yaml` — enforce evidence-aware statuses and dynamic generation.
- `tests/generate-structure.test.ts`, `tests/interaction-contract.test.ts`, `tests/resources.test.ts`, `tests/readme-content.test.ts` — migrate and extend contracts.
- `package.json` — register all test files and set version `0.2.0`.
- `plugins/blueprint-architect-plugin/.codex-plugin/plugin.json` — set version `0.2.0` and truthful capability text.
- `README.md`, `README.zh-CN.md`, `CHANGELOG.md`, `CONTRIBUTING.md` — describe implemented behavior, migration, evidence policy, and extension rules.

### Task 1: Make Current Public Claims Match Current Behavior

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `tests/readme-content.test.ts`

- [ ] **Step 1: Write a failing honesty regression test**

Add a test that requires both READMEs to say that the current release uses a fixed starter scaffold and a limited advisory rule set until version 0.2.0 is implemented:

```ts
test("READMEs do not describe the legacy generator as fully dynamic", async () => {
  const [english, chinese] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8"),
  ]);
  assert.match(english, /current generator creates a fixed starter scaffold/i);
  assert.match(english, /compatibility rules are advisory and intentionally limited/i);
  assert.match(chinese, /当前生成器创建的是固定起步结构/);
  assert.match(chinese, /兼容性规则属于有限的辅助检查/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --experimental-strip-types --test tests/readme-content.test.ts`

Expected: FAIL because the four required honesty phrases are missing.

- [ ] **Step 3: Correct the capability sections in both READMEs**

State the existing fixed directories, generic module READMEs, four advisory scenarios, and the absence of live schema/deployment/version verification. Keep the future universal engine out of the feature list until its acceptance tests pass.

- [ ] **Step 4: Run the focused test and verify success**

Run: `node --experimental-strip-types --test tests/readme-content.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the honesty correction**

```powershell
git add README.md README.zh-CN.md tests/readme-content.test.ts
git commit -m "docs: align capabilities with current implementation"
```

### Task 2: Define and Validate BlueprintSpec

**Files:**
- Create: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/blueprint-types.ts`
- Create: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts`
- Create: `tests/blueprint-spec.test.ts`
- Create: `tests/fixtures/blueprints/nextjs-ai-saas.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing contract tests**

Cover a valid fixture and rejection of traversal paths, duplicate IDs, dangling requirement/module/interface references, empty responsibilities, secrets in generated configuration, and `verified_compatible` findings without evidence:

```ts
const spec = await loadFixture("nextjs-ai-saas.json");
assert.equal(validateBlueprintSpec(spec).project.id, "ai-support-saas");
assert.throws(() => validateBlueprintSpec(withModulePath(spec, "../escape")), /modules\[0\]\.path/);
assert.throws(() => validateBlueprintSpec(withDuplicateModuleId(spec)), /duplicate module id/);
assert.throws(() => validateBlueprintSpec(withDanglingRequirement(spec)), /unknown requirement/);
assert.throws(() => validateBlueprintSpec(withVerifiedFindingWithoutEvidence(spec)), /requires primary evidence/);
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --experimental-strip-types --test tests/blueprint-spec.test.ts`

Expected: FAIL with module-not-found for `validate-blueprint.ts`.

- [ ] **Step 3: Add canonical types**

Define literal unions and interfaces with these exact top-level fields:

```ts
export interface BlueprintSpec {
  schemaVersion: 1;
  project: ProjectDefinition;
  requirements: RequirementDefinition[];
  technologies: TechnologyDefinition[];
  deployments: DeploymentDefinition[];
  modules: ModuleDefinition[];
  interfaces: InterfaceDefinition[];
  dataFlows: DataFlowDefinition[];
  evidence: EvidenceRecord[];
  findings: CompatibilityFinding[];
  unresolved: UnresolvedItem[];
}

export type FindingStatus =
  | "verified_compatible"
  | "conditional"
  | "conflict"
  | "insufficient_input"
  | "unverified";
```

Represent capabilities as `Record<string, string | number | boolean | string[]>`. Every requirement, technology, deployment, module, interface, flow, evidence record, finding, and unresolved item has a stable `id`.

- [ ] **Step 4: Implement fail-closed validation**

Implement `validateBlueprintSpec(input: unknown): BlueprintSpec`. Accumulate precise JSON-style paths, then throw one `BlueprintValidationError` containing all issues. Validate direct relative module paths with `/` separators, allowed segments, Windows reserved names, global ID uniqueness within each collection, all cross-references, nonempty confirmed content, evidence status requirements, and absence of environment values matching token/password/private-key field names.

- [ ] **Step 5: Add the complete Next.js/AI fixture**

The fixture must include concrete requirements, versions for Next.js, Prisma, MySQL, Vercel AI SDK and deployment, at least five PRD-derived modules, two public interfaces, two data flows, evidence records, and findings. Do not use generic placeholder text.

- [ ] **Step 6: Run the test and type checks**

Run:

```powershell
node --experimental-strip-types --test tests/blueprint-spec.test.ts
node --experimental-strip-types --check plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/blueprint-types.ts
node --experimental-strip-types --check plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts
```

Expected: all commands exit 0.

- [ ] **Step 7: Register the test and commit**

Add `tests/blueprint-spec.test.ts` to the explicit `npm test` command, then commit:

```powershell
git add package.json plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/blueprint-types.ts plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/validate-blueprint.ts tests/blueprint-spec.test.ts tests/fixtures/blueprints/nextjs-ai-saas.json
git commit -m "feat: add validated blueprint specification"
```

### Task 3: Replace Named Rules with a Capability Engine

**Files:**
- Create: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/capability-engine.ts`
- Create: `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/capability-rules.yaml`
- Create: `tests/capability-engine.test.ts`
- Modify: `tests/resources.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing general-rule tests**

Test rule parsing and matching without relying on vendor names:

```ts
const context = capabilityContext({
  runtime: { "instance-lifecycle": "ephemeral", "network-model": "outbound" },
  databaseClient: { "connection-lifecycle": "persistent" },
});
const findings = evaluateCapabilityRules(context, rules);
assert.equal(findings[0].ruleId, "ephemeral-runtime-persistent-connections");
assert.equal(findings[0].status, "conditional");
```

Also prove no match returns no finding rather than `verified_compatible`, malformed operators are rejected, and all original four scenarios still match after translation to capabilities.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `node --experimental-strip-types --test tests/capability-engine.test.ts tests/resources.test.ts`

Expected: FAIL because the capability engine and resource do not exist.

- [ ] **Step 3: Define the rule resource contract**

Use versioned YAML with `all` and `any` clause arrays. Each clause contains `selector`, `capability`, `operator`, and `value`. Supported operators are exactly `equals`, `not_equals`, `includes`, `exists`, `less_than`, and `greater_than_or_equal`.

Each rule result defines `status`, `issue`, `impact`, and ordered corrections with `kind` set to `configuration`, `adapter`, `version`, `isolation`, or `replacement`.

- [ ] **Step 4: Implement rule parsing and evaluation**

Export:

```ts
export function parseCapabilityRules(input: string): CapabilityRuleSet;
export function evaluateCapabilityRules(
  context: CapabilityContext,
  rules: CapabilityRuleSet,
): RuleFinding[];
```

Reject unknown operators and missing correction fields. Sort matches by severity, then rule ID for deterministic output.

- [ ] **Step 5: Migrate and generalize the four rules**

Translate serverless connection exhaustion, SPA/SEO, static/realtime, and process-memory/multi-instance cases. Add category coverage rules for runtime/framework, ORM/database, rendering/deployment, session/deployment, streaming/transport, module-system/build-tool, AI SDK/provider protocol, and cache/state ownership. Coverage rules create `insufficient_input` or `unverified` findings; they never assert compatibility.

- [ ] **Step 6: Run focused tests and commit**

Run: `node --experimental-strip-types --test tests/capability-engine.test.ts tests/resources.test.ts`

Expected: PASS.

```powershell
git add package.json plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/capability-engine.ts plugins/blueprint-architect-plugin/skills/blueprint-architect/references/capability-rules.yaml tests/capability-engine.test.ts tests/resources.test.ts
git commit -m "feat: evaluate capability-based compatibility rules"
```

### Task 4: Build the Evidence-Aware Compatibility Graph

**Files:**
- Create: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/compatibility-graph.ts`
- Create: `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/evidence-policy.md`
- Create: `tests/compatibility-graph.test.ts`
- Create: `tests/fixtures/blueprints/unfamiliar-stack.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing graph and evidence tests**

Require every declared technology dependency and deployment relationship to have one finding. Prove that version-sensitive edges cannot become verified without primary evidence, contradictory evidence downgrades the result, unknown technologies become `unverified`, and corrections are ordered by minimum disruption:

```ts
const report = evaluateCompatibility(spec, rules);
assert.deepEqual(report.uncoveredEdges, []);
assert.equal(report.findingsByEdge.get("orm->database")?.status, "verified_compatible");
assert.equal(evaluateCompatibility(withoutEvidence(spec), rules).findingsByEdge.get("orm->database")?.status, "unverified");
assert.deepEqual(report.findings[0].corrections.map((item) => item.kind), ["configuration", "adapter", "version"]);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --experimental-strip-types --test tests/compatibility-graph.test.ts`

Expected: FAIL with module-not-found for `compatibility-graph.ts`.

- [ ] **Step 3: Implement graph construction**

Create stable edge IDs from sorted source, relationship, and target IDs. Include technology dependencies, technology-to-runtime, technology-to-deployment, module-to-technology, interface transport, persistence, session, streaming, and data-flow edges.

- [ ] **Step 4: Implement evidence and status policy**

Export `evaluateCompatibility(spec, rules): CompatibilityReport`. Merge explicit spec findings with deterministic rule findings. A verified result requires a matching primary evidence record when the edge contains an exact version or a capability marked `version-sensitive`. Missing coverage produces `unverified`; missing required decisions produce `insufficient_input`.

Order corrections as configuration, adapter, version, isolation, replacement. Never manufacture a replacement name; accept only corrections from a rule, evidence record, or confirmed user decision.

- [ ] **Step 5: Add the evidence policy and unfamiliar fixture**

Document primary sources, version ranges, retrieval dates, contradictory sources, minimized lookup terms, and prohibited PRD/private content. The unfamiliar fixture must contain a fictional technology name with declared provisional capabilities and an `unverified` result, demonstrating that unknown names do not crash or become verified.

- [ ] **Step 6: Run tests and commit**

Run: `node --experimental-strip-types --test tests/compatibility-graph.test.ts`

Expected: PASS.

```powershell
git add package.json plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/compatibility-graph.ts plugins/blueprint-architect-plugin/skills/blueprint-architect/references/evidence-policy.md tests/compatibility-graph.test.ts tests/fixtures/blueprints/unfamiliar-stack.json
git commit -m "feat: add evidence-aware compatibility graph"
```

### Task 5: Replace the Fixed Generator with BlueprintSpec Generation

**Files:**
- Rewrite: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts`
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/templates/v2-module-template.md`
- Create: `tests/fixtures/blueprints/container-realtime-service.json`
- Create: `tests/dynamic-generation.test.ts`
- Modify: `tests/generate-structure.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing dynamic generation tests**

Generate from the Next.js/AI and container/realtime fixtures into separate temporary roots. Assert their manifests and trees differ, every declared module path exists, every public interface has a document, concrete responsibilities and interface names appear, traceability IDs resolve, and fixed `app/components/lib` directories appear only when declared.

```ts
assert.notDeepEqual(webResult.manifest, serviceResult.manifest);
assert.ok(webResult.manifest.includes("src/ai-orchestration/README.md"));
assert.ok(serviceResult.manifest.includes("services/presence-gateway/README.md"));
assert.ok(!serviceResult.manifest.includes("components/README.md"));
assert.match(await readGenerated(webResult, "interfaces/chat-stream.md"), /POST \/api\/chat/);
```

- [ ] **Step 2: Run generation tests and verify failure**

Run: `node --experimental-strip-types --test tests/generate-structure.test.ts tests/dynamic-generation.test.ts`

Expected: FAIL because the legacy generator emits the same fixed tree.

- [ ] **Step 3: Change the generator API and CLI**

Export:

```ts
export async function generateBlueprint(
  spec: BlueprintSpec,
  outputDir: string,
): Promise<GenerationResult>;
```

CLI usage becomes `generate-structure.ts <blueprint-spec.json> [output-directory]`. If the first argument is not an existing JSON file, throw: `Legacy generator arguments are no longer supported; provide a BlueprintSpec JSON file.`

- [ ] **Step 4: Generate the root documents and machine-readable artifacts**

Write `README.md`, `architecture/decisions.md`, `architecture/compatibility.md`, `architecture/evidence.md`, `architecture/traceability.md`, `architecture/deployment.md`, `blueprint.spec.json`, and `blueprint.manifest.json` from validated data. Sort IDs and paths before rendering.

- [ ] **Step 5: Generate declared modules and interfaces**

For every module, create its declared path and render responsibilities, owned data, interfaces, dependencies, flows, failure modes, security, privacy, configuration names, requirement IDs, and tests. For every public interface, create `interfaces/<safe-id>.md` with transport, request, response, errors, authentication, idempotency, versioning, and consumers.

Reject generic text such as `Document public contracts before implementation.` when an interface is declared. Render unresolved items only in an explicit `Unresolved inputs` section.

- [ ] **Step 6: Preserve atomic and non-destructive behavior**

Validate before creating the staging directory. Create all files in a confined staging directory, verify manifest/spec agreement, rename atomically, and remove staging on failure. Refuse existing target directories and symlinked parent escape paths.

- [ ] **Step 7: Run generation and security tests**

Run:

```powershell
node --experimental-strip-types --test tests/generate-structure.test.ts tests/dynamic-generation.test.ts tests/blueprint-spec.test.ts
node --experimental-strip-types --check plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts
```

Expected: PASS with no leftover `.blueprint-staging-*` directory.

- [ ] **Step 8: Commit the dynamic generator**

```powershell
git add package.json plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/generate-structure.ts plugins/blueprint-architect-plugin/skills/blueprint-architect/templates/v2-module-template.md tests/generate-structure.test.ts tests/dynamic-generation.test.ts tests/fixtures/blueprints/container-realtime-service.json
git commit -m "feat: generate dynamic PRD-driven blueprints"
```

### Task 6: Integrate the Engine into the Skill Workflow

**Files:**
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/SKILL.md`
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/agents/openai.yaml`
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/module-types.yaml`
- Delete: `plugins/blueprint-architect-plugin/skills/blueprint-architect/references/compatibility-matrix.yaml`
- Modify: `tests/interaction-contract.test.ts`
- Modify: `tests/resources.test.ts`

- [ ] **Step 1: Write failing workflow-contract tests**

Require the Skill and agent prompt to mention `BlueprintSpec`, capability normalization, evidence policy, all five statuses, complete edge coverage, reevaluation after every material decision, dynamic module paths, and no-lookup fallback. Assert no file references the deleted compatibility matrix.

- [ ] **Step 2: Run the contract tests and verify failure**

Run: `node --experimental-strip-types --test tests/interaction-contract.test.ts tests/resources.test.ts`

Expected: FAIL with missing universal-engine phrases.

- [ ] **Step 3: Rewrite the Skill workflow**

Instruct the Skill to:

1. interpret and clarify the PRD;
2. assign stable requirement IDs;
3. confirm technology names and version bounds;
4. normalize capabilities using documented facts;
5. consult `capability-rules.yaml` and `evidence-policy.md`;
6. run compatibility evaluation after every material decision;
7. resolve conflicts through the existing selector-or-numbered fallback;
8. construct complete modules, interfaces, flows, tests, and traceability;
9. validate the full `BlueprintSpec` and compatibility report;
10. show the proposed tree and findings before final confirmation;
11. invoke the dynamic generator only after confirmation.

State explicitly that unknown technology is allowed, no rule match is not compatibility, official lookup uses minimized public terms, and lookup failure produces `unverified` rather than stopping.

- [ ] **Step 4: Convert module types into optional examples**

Remove fixed default directories. Keep only capability-oriented documentation requirements, such as entrypoint, domain, adapter, persistence, background worker, interface, and test-support module roles. The Skill derives actual paths from the project.

- [ ] **Step 5: Remove the legacy matrix and pass tests**

Delete `compatibility-matrix.yaml` only after the capability resource and regression tests cover its four scenarios.

Run: `node --experimental-strip-types --test tests/interaction-contract.test.ts tests/resources.test.ts tests/capability-engine.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Skill integration**

```powershell
git add plugins/blueprint-architect-plugin/skills/blueprint-architect tests/interaction-contract.test.ts tests/resources.test.ts
git commit -m "feat: integrate universal compatibility workflow"
```

### Task 7: Prove Cross-Stack Behavior End to End

**Files:**
- Modify: `tests/dynamic-generation.test.ts`
- Modify: `tests/compatibility-graph.test.ts`
- Create: `tests/universal-workflow.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing workflow matrix test**

Run validation, capability rules, graph evaluation, and generation for all three fixtures. Assert:

- different PRDs produce different module trees;
- every technology edge receives exactly one final status;
- serverless/persistent-connection and multi-instance/process-memory conflicts are detected by capabilities;
- exact-version verified claims have primary evidence;
- unfamiliar technology survives with `unverified` findings;
- identical input produces byte-identical generated files after excluding target-root paths;
- invalid input writes no target directory.

- [ ] **Step 2: Run the end-to-end test and verify failure**

Run: `node --experimental-strip-types --test tests/universal-workflow.test.ts`

Expected: FAIL until the modules expose one composed `analyzeBlueprint` pipeline.

- [ ] **Step 3: Add the composed pipeline**

Export from `compatibility-graph.ts`:

```ts
export function analyzeBlueprint(
  input: unknown,
  ruleText: string,
): { spec: BlueprintSpec; report: CompatibilityReport };
```

It validates input, parses rules, evaluates capability findings, builds all edges, applies evidence policy, replaces `spec.findings` with the deterministically sorted final report findings, and returns that validated specification with the report. Generation receives the returned `spec`, preserving the `generateBlueprint(spec, outputDir)` signature from Task 5.

- [ ] **Step 4: Run all repository tests**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 5: Commit end-to-end coverage**

```powershell
git add package.json plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/compatibility-graph.ts tests/universal-workflow.test.ts tests/dynamic-generation.test.ts tests/compatibility-graph.test.ts
git commit -m "test: verify universal compatibility workflow"
```

### Task 8: Publish Truthful Versioned Documentation

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CHANGELOG.md`
- Modify: `CONTRIBUTING.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `plugins/blueprint-architect-plugin/.codex-plugin/plugin.json`
- Modify: `tests/readme-content.test.ts`

- [ ] **Step 1: Write failing release-documentation tests**

Require version `0.2.0`, all five finding statuses, dynamic PRD-derived modules, primary-evidence requirements, unknown-technology behavior, legacy CLI migration text, and matching English/Chinese essentials. Remove the temporary legacy-limit phrases introduced in Task 1 only after the dynamic tests pass.

- [ ] **Step 2: Run documentation tests and verify failure**

Run: `node --experimental-strip-types --test tests/readme-content.test.ts`

Expected: FAIL because version and universal-engine documentation are missing.

- [ ] **Step 3: Update manifests and lockfile**

Set repository and plugin versions to `0.2.0`. Run `npm install --package-lock-only` to synchronize `package-lock.json`. Update plugin descriptions to say evidence-aware compatibility analysis and PRD-driven generation without claiming that every combination is compatible.

- [ ] **Step 4: Rewrite both README capability sections**

Document the data flow from PRD to decisions, `BlueprintSpec`, compatibility report, confirmation, and dynamic output. Explain all statuses, evidence privacy, offline behavior, migration from the legacy generator CLI, and the distinction between “analyzable” and “compatible.” Preserve installation, selector fallback, GitHub configuration, comparison, and sponsor content.

- [ ] **Step 5: Update changelog and contributor rules**

Record the breaking generator contract and migration. Require new capability rules to include focused fixtures, corrections, category ownership, and evidence semantics. Prohibit vendor-specific duplication of a general capability rule.

- [ ] **Step 6: Run documentation tests and commit**

Run: `node --experimental-strip-types --test tests/readme-content.test.ts`

Expected: PASS.

```powershell
git add README.md README.zh-CN.md CHANGELOG.md CONTRIBUTING.md package.json package-lock.json plugins/blueprint-architect-plugin/.codex-plugin/plugin.json tests/readme-content.test.ts
git commit -m "docs: release universal compatibility engine"
```

### Task 9: Final Security, Validation, and Release Audit

**Files:**
- Modify only files required by failures found in this task.

- [ ] **Step 1: Run complete repository validation**

Run: `npm run validate`

Expected: type checks, all tests, Skill validation, and Plugin validation pass with zero failures.

- [ ] **Step 2: Run official validators**

```powershell
python "$env:USERPROFILE\.codex\skills\.system\skill-creator\scripts\quick_validate.py" "plugins\blueprint-architect-plugin\skills\blueprint-architect"
python "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py" "plugins\blueprint-architect-plugin"
```

Expected: `Skill is valid!` and `Plugin validation passed`.

- [ ] **Step 3: Audit requirements and stale claims**

Run:

```powershell
rg -n "fixed starter scaffold|compatibility rules are advisory and intentionally limited|No technology choices were supplied|Document public contracts before implementation|compatibility-matrix.yaml" README.md README.zh-CN.md plugins tests
rg -n "verified_compatible" plugins tests
git diff --check
```

Expected: the first search has no hits; every production `verified_compatible` path is guarded by evidence policy; `git diff --check` exits 0.

- [ ] **Step 4: Run a clean-install test**

Create a verified temporary directory under the system temp root, install the standalone Skill from the current repository contents, verify that `SKILL.md`, the five deterministic scripts (`blueprint-types.ts`, `validate-blueprint.ts`, `capability-engine.ts`, `compatibility-graph.ts`, and `generate-structure.ts`), `capability-rules.yaml`, `evidence-policy.md`, `module-types.yaml`, and the module template exist, then remove only that verified temporary target.

Expected: the installed Skill is self-contained and no temporary directory remains.

- [ ] **Step 5: Review the final diff against the design spec**

Check every acceptance criterion in `docs/superpowers/specs/2026-08-15-universal-compatibility-engine-design.md` against a named test or validation output. Correct gaps before proceeding.

- [ ] **Step 6: Commit audit corrections if needed**

If this task changes files:

```powershell
git add <only-the-corrected-files>
git commit -m "fix: complete universal engine audit"
```

If no files change, do not create an empty commit.

- [ ] **Step 7: Push and monitor CI**

Run:

```powershell
git push origin main
gh run list --branch main --limit 1 --json databaseId,headSha,status,url
gh run watch <database-id> --exit-status
```

Expected: the run for the pushed head succeeds on Windows, Ubuntu, and macOS. Do not tag or create a GitHub Release unless the user separately requests it.
