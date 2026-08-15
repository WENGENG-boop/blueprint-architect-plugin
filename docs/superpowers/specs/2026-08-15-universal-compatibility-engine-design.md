# Universal Compatibility Engine Design

## Objective

Upgrade Blueprint Architect from a fixed project scaffold with a small named-technology rule table into a general architecture-analysis system that can evaluate arbitrary technology stacks and generate a PRD-driven project blueprint.

“Universal compatibility” means every technology combination can enter the analysis workflow. It does not mean every combination is declared compatible. The system must distinguish verified compatibility, conditional compatibility, confirmed conflicts, insufficient input, and unverified claims. When a conflict can be resolved, it must propose an executable correction.

Financial-industry regulation is outside this scope. “All rules” refers to technical architecture and integration compatibility.

## Current Gap

The current generator accepts only a project name, description, flat technology map, and output directory. It creates a fixed set of directories and mostly generic README files. It cannot express PRD-derived modules, concrete interfaces, data flows, deployment constraints, or module-specific tests.

The current compatibility matrix contains four scenario rules. Those rules are useful examples, but a vendor-name matrix cannot scale to arbitrary technologies or version changes. The public README must not claim dynamic module or interface generation until this design is implemented and verified.

## Chosen Approach

Use a hybrid compatibility engine with three layers:

1. Deterministic capability rules cover stable architectural constraints.
2. Evidence resolution checks version-sensitive statements against primary documentation when lookup is available.
3. Model reasoning maps unfamiliar technologies to capabilities, identifies missing information, and proposes corrections without converting unsupported assumptions into facts.

This rejects two inadequate extremes:

- An exhaustive vendor matrix will always be incomplete and stale.
- Model-only compatibility judgments are flexible but cannot provide reliable, reproducible evidence.

## System Boundary

The Codex Skill owns PRD interpretation, decision dialogue, technology identification, evidence lookup, and construction of a structured blueprint specification.

Deterministic scripts own schema validation, capability-rule evaluation, path safety, output generation, manifest verification, and non-destructive file creation. Scripts do not interpret free-form PRDs or invent modules.

The generator consumes only validated structured input. It must never infer a generic Next.js-style directory tree when the specification describes another architecture.

## BlueprintSpec

Introduce a versioned `BlueprintSpec` as the contract between the Skill and deterministic scripts. It must contain:

- project identity, problem statement, goals, non-goals, assumptions, and constraints;
- requirements with stable identifiers and acceptance criteria;
- confirmed technologies with component category, exact or bounded version, runtime, capabilities, source, and confidence;
- deployment targets and operational constraints;
- business and infrastructure modules with stable identifiers and requested directory paths;
- each module's responsibilities, owned data, public interfaces, dependencies, data flows, failure modes, security requirements, and test obligations;
- compatibility findings, evidence, corrections, and unresolved questions;
- traceability links from requirements to modules, interfaces, findings, and tests.

The schema must reject unsafe paths, duplicate identifiers, dangling references, cycles that are not explicitly allowed, empty required sections, and findings that claim verification without evidence.

Large or sensitive specifications must be passed through a file, not a command-line JSON argument. Generated artifacts must not contain secrets.

## Capability Model

Technology names are normalized into capability declarations. The initial taxonomy must support extension without changing the evaluator and cover at least:

- language, runtime, module system, package manager, and build tool;
- UI framework, rendering mode, routing, SEO, caching, and hydration;
- API transport, streaming, realtime communication, background jobs, and messaging;
- persistence model, database, ORM or driver, connection lifecycle, migrations, and transactions;
- authentication, authorization, session storage, tenancy, and secret handling;
- file or object storage, cache, search, queues, and third-party integrations;
- server, container, serverless, edge, static, multi-region, and multi-instance deployment;
- AI SDK, model provider, tool calling, structured output, streaming protocol, and provider limits;
- observability, testing, accessibility, security, privacy, licensing, and operational ownership.

Rules target capabilities and constraints rather than product names wherever possible. Product adapters may declare capabilities and known version boundaries, but must not duplicate general rules.

## Compatibility Evaluation

The evaluator builds a graph whose nodes are requirements, technologies, runtimes, modules, interfaces, data stores, and deployment targets. Edges represent dependency, execution, communication, persistence, deployment, and version relationships.

Each finding uses one of these statuses:

- `verified_compatible`: supported by deterministic constraints and current primary evidence when version-sensitive;
- `conditional`: compatible only when stated versions, configuration, adapters, or operational conditions are satisfied;
- `conflict`: the confirmed choices cannot satisfy a requirement together;
- `insufficient_input`: a required product or architecture decision is missing;
- `unverified`: no reliable evidence is available.

Every finding contains affected nodes, issue, impact, evidence, confidence, correction options, and the decision required from the user. A finding may not use `verified_compatible` merely because no rule matched.

Evaluation runs after every material technical decision and once again over the complete confirmed specification before generation.

## Evidence Resolution

Version-sensitive claims must prefer primary sources: official product documentation, official compatibility or release notes, authoritative package metadata, and official repositories. Community examples may inform alternatives but cannot independently justify `verified_compatible`.

Each evidence record stores the source URL or local reference, subject, applicable version range, retrieval date, and the claim it supports. Contradictory evidence produces `conditional` or `unverified`, never silent selection of the convenient source.

External lookup sends only minimized public terms: technology names, versions, capability names, and generic compatibility questions. It must not send PRD prose, secrets, customer names, proprietary module names, or private requirements.

When browsing is unavailable, the engine continues with deterministic capability rules and marks version-sensitive conclusions `unverified` or `conditional` as appropriate.

## Conflict Resolution

Corrections are ordered by minimum disruption:

1. configuration or deployment constraint;
2. compatible adapter, proxy, pooler, protocol bridge, or persistence layer;
3. bounded version adjustment;
4. isolation of conflicting components behind a service boundary;
5. replacement technology.

Each correction states affected decisions, migration cost, operational ownership, risks, and which requirements it restores. The user must confirm material corrections through the existing selector-or-numbered-prose interaction contract.

## Dynamic Blueprint Generation

Refactor the generator to derive directories and documents entirely from validated `BlueprintSpec.modules`. No application framework or directory name is assumed.

Generated output includes:

- root architecture summary, decision record, compatibility report, evidence index, requirement traceability table, and implementation checklist;
- the exact requested module directory tree;
- a complete module document for every module;
- interface and data-contract documents for public boundaries;
- data-flow, dependency, failure-mode, security, privacy, configuration, and deployment documentation;
- test plans mapped to requirements and module boundaries;
- a machine-readable copy of the validated specification and generation manifest.

Module documents must contain actual specification content. Placeholder phrases such as “document interfaces later” are forbidden when the corresponding input is confirmed. Genuine missing inputs must remain explicit unresolved items and block only the affected claim or generation path.

Generation remains staged, atomic, path-confined, deterministic for identical input, and non-overwriting.

## Interaction Flow

1. Interpret the PRD and explain the fundamental product problem.
2. Extract requirements, constraints, uncertainties, and non-goals.
3. Ask only material decisions, one at a time.
4. Normalize every confirmed technology into capabilities and version constraints.
5. Evaluate compatibility after each decision; resolve conflicts before continuing.
6. Build modules, interfaces, data flows, deployment topology, and tests in `BlueprintSpec`.
7. Perform a complete compatibility and traceability review.
8. Present findings, evidence confidence, unresolved items, and the proposed directory tree.
9. Generate files only after final confirmation.

Plan mode uses structured selectors. Other modes use equivalent numbered prose choices and continue without requiring Plan mode.

## Failure Handling and Honesty

- Unknown technology: request a version or authoritative source, infer only provisional capabilities, and mark conclusions `unverified`.
- Conflicting documentation: show the conflict and avoid a verified claim.
- Missing version: use `insufficient_input` when the version changes compatibility; otherwise state a bounded assumption.
- Unsupported schema: fail validation before writing files and report exact JSON paths.
- Unsafe or duplicate output path: reject the complete generation transaction.
- External lookup failure: preserve deterministic findings and continue with explicit evidence gaps.
- Rule-engine failure: do not generate a “compatible” blueprint; surface the error without partial output.

## Testing Strategy

Unit tests cover schema validation, capability matching, version ranges, graph construction, status assignment, evidence requirements, correction ordering, traceability, and path safety.

Fixture-driven integration tests cover materially different stacks, including web applications, static sites, serverless APIs, containerized services, mobile backends, realtime systems, AI applications, monorepos, and stacks containing unfamiliar technologies.

Generator golden tests prove that different specifications create different directory trees and complete module/interface documents. Regression tests prove that fixed placeholder directories are not emitted unless requested.

Evidence tests use mocked primary-source records and prove that missing or contradictory evidence cannot produce `verified_compatible`.

Security tests cover traversal, absolute paths, reserved platform names, symlink risks, command-line secret exposure, unsafe external-query content, and partial-write cleanup.

## Documentation and Migration

Until the new engine is complete, README capability claims must describe the current fixed scaffold and limited advisory rules honestly. The release that enables this design must update both READMEs, the Skill workflow, contributor guidance, changelog, schema documentation, and examples together.

The existing four rules migrate into the capability-rule format and remain regression fixtures. Existing generator callers receive a clear migration error or an explicit compatibility adapter; silent conversion to a generic blueprint is not allowed.

## Acceptance Criteria

The design is complete when all of the following are demonstrated:

- two substantially different PRDs produce different, PRD-derived module trees;
- every generated module and public boundary has concrete documentation sourced from `BlueprintSpec`;
- compatibility results cover every declared technology edge and never treat “no matching rule” as verified;
- version-sensitive verified claims contain primary evidence;
- conflicts yield actionable corrections and require user confirmation;
- unfamiliar technology produces a safe provisional analysis rather than rejection or fabricated compatibility;
- identical validated input produces identical output;
- invalid or unsafe input creates no target directory;
- README claims match tested behavior;
- repository tests and official Skill and Plugin validators pass on Windows, macOS, and Linux.
