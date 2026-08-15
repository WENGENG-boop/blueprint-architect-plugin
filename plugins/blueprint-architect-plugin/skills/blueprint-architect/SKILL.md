---
name: blueprint-architect
description: Analyze a PRD, explain its fundamental product problem, guide material technical decisions, validate compatibility, and generate an executable project blueprint. Use when Codex needs to interpret requirements, clarify a project idea, choose a compatible stack, plan architecture, or create a blueprint before coding.
---

# Blueprint Architect

Turn a product idea or PRD into a reviewed blueprint. Keep product clarification separate from implementation. Do not generate application code unless the user explicitly asks after the blueprint is confirmed.

## Workflow

1. Read the supplied PRD completely. Read `references/analyze-prd.md` when detailed extraction guidance is needed.
2. Explain the users' fundamental problem, desired outcome, constraints, unknowns, and non-goals in plain language before discussing technologies.
3. Identify only decisions that materially affect the product or architecture.
4. Assign stable IDs to requirements and acceptance criteria. Ask one material decision at a time. When `request_user_input` is available, use it with exactly one question and two or three mutually exclusive options. Otherwise, present the same decision as a numbered prose list and ask the user to reply with the option number or exact label. Put the grounded recommendation first, end its label with `(Recommended)`, and give every option one concise impact or trade-off description.
5. For every confirmed or provisional technology, record its category, exact or bounded version, runtime, deployment, dependencies, capabilities, source, and confidence in a version-1 `BlueprintSpec` using `scripts/blueprint-types.ts`.
6. Read `references/capability-rules.yaml` and `references/evidence-policy.md`. Normalize product names into capabilities, then evaluate every declared technology, runtime, deployment, module, interface, persistence, session, streaming, and data-flow edge. No rule match is not evidence of compatibility.
7. Use exactly these compatibility statuses: `verified_compatible`, `conditional`, `conflict`, `insufficient_input`, and `unverified`. A version-sensitive `verified_compatible` finding requires current primary evidence. When external lookup is unavailable, continue with deterministic rules and mark unsupported claims `unverified`.
8. Reevaluate compatibility after every material technical decision. Explain conflicts before continuing and present corrective decisions with the same selector-or-numbered-fallback rules. Prefer configuration, then adapter, version adjustment, isolation, and replacement.
9. Build PRD-derived modules, public interfaces, data flows, deployment topology, test obligations, and requirement traceability in `BlueprintSpec`. Read `references/module-types.yaml` for documentation roles, not fixed directories. Paths must come from the confirmed architecture.
10. Run `scripts/validate-blueprint.ts` and `scripts/compatibility-graph.ts` over the complete specification. Present the final findings, evidence confidence, unresolved items, and proposed directory tree. Request final confirmation under the same selector-or-numbered-fallback contract.
11. Only after confirmation, save the validated specification as JSON and run `node --experimental-strip-types "<skill-directory>/scripts/generate-structure.ts" "<blueprint-spec.json>" "<output-directory>"`. The generator creates the declared tree and complete module/interface documentation atomically and never overwrites an existing target.
12. Verify the generated manifest and PRD traceability. Keep planned work unchecked and never claim unperformed implementation, tests, review, deployment, or metrics as complete.

## Interaction contract

- Prefer `request_user_input` for every product or architecture decision, compatibility correction, and final confirmation when it is available.
- In Plan mode, use the structured selector. Outside Plan mode, or whenever `request_user_input` is unavailable, continue with a numbered prose list containing the same options; do not stop merely because the selector is unavailable.
- Ask exactly one question at a time and wait for the answer before the next decision.
- Supply two or three mutually exclusive options. Put the recommendation first with `(Recommended)` at the end of its label.
- For the prose fallback, number the options `1`, `2`, and optionally `3`, then ask the user to reply with the number or exact option label. Do not require an open-ended answer when the decision can be represented by the listed options.
- Codex's automatic `Other` entry does not replace the two or three structured options when the selector is used.
- Let the user make final decisions. Prefer the simplest architecture satisfying confirmed constraints.
- Distinguish requirements from assumptions and future ideas. Do not invent metrics, budgets, integrations, or user needs.
- Unknown technologies are allowed. Record provisional capabilities and request an authoritative version or source; never fabricate a compatibility result.
- For official compatibility evidence lookup, send only public technology names, versions, capability names, and generic questions. Never send PRD prose, secrets, customer names, proprietary module names, or private requirements.
- Search GitHub only when the user explicitly requests public implementation references. Build the query only from confirmed technology terms and user-approved public keywords. Never send PRD prose, secrets, customer names, or private requirements.
- Resolve `scripts/search-github.ts` relative to this `SKILL.md`, then run `node --experimental-strip-types "<skill-directory>/scripts/search-github.ts" --technologies "<comma-separated-confirmed-technologies>" --keywords "<comma-separated-user-approved-keywords>"`. Parse its JSON output.
- Treat `ok`, `empty`, `rate_limited`, and `unavailable` as distinct outcomes. Disclose the outcome and continue without enrichment when references are unavailable. If rate limited, explain that anonymous lookup remains optional and the user may configure `GITHUB_TOKEN` or `GH_TOKEN` for authenticated requests.

## Output

Provide the fundamental-problem interpretation, clarified requirements, decision record, complete edge-based compatibility findings, evidence index, confirmed stack, PRD-derived directory/module blueprint, interface contracts, data flows, deployment topology, traceability, and implementation checklist as appropriate. For a PRD-only request, stop after interpretation and clarification.
