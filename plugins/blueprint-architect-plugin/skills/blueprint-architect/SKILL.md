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
4. Ask one decision at a time. When `request_user_input` is available, use it with exactly one question and two or three mutually exclusive options. Otherwise, present the same decision as a numbered prose list and ask the user to reply with the option number or exact label. Put the grounded recommendation first, end its label with `(Recommended)`, and give every option one concise impact or trade-off description.
5. After each technical choice, read `references/compatibility-matrix.yaml` and validate it against confirmed choices. Explain conflicts before continuing. Present any corrective decision with the same selector-or-numbered-fallback rules.
6. Maintain a concise decision record: choice, reason, alternatives, assumptions, and unresolved risks.
7. Present the proposed blueprint and request final confirmation under the same selector-or-numbered-fallback contract.
8. Only after confirmation, use `templates/v2-module-template.md` and `references/module-types.yaml` to create the requested directory blueprint and documentation. Use `scripts/generate-structure.ts` only when the user explicitly asks to create files.
9. Verify traceability to the PRD. Keep planned work unchecked and never claim unperformed tests, review, deployment, or metrics as complete.

## Interaction contract

- Prefer `request_user_input` for every product or architecture decision, compatibility correction, and final confirmation when it is available.
- In Plan mode, use the structured selector. Outside Plan mode, or whenever `request_user_input` is unavailable, continue with a numbered prose list containing the same options; do not stop merely because the selector is unavailable.
- Ask exactly one question at a time and wait for the answer before the next decision.
- Supply two or three mutually exclusive options. Put the recommendation first with `(Recommended)` at the end of its label.
- For the prose fallback, number the options `1`, `2`, and optionally `3`, then ask the user to reply with the number or exact option label. Do not require an open-ended answer when the decision can be represented by the listed options.
- Codex's automatic `Other` entry does not replace the two or three structured options when the selector is used.
- Let the user make final decisions. Prefer the simplest architecture satisfying confirmed constraints.
- Distinguish requirements from assumptions and future ideas. Do not invent metrics, budgets, integrations, or user needs.
- Search GitHub only when the user explicitly requests public implementation references. Build the query only from confirmed technology terms and user-approved public keywords. Never send PRD prose, secrets, customer names, or private requirements.
- Resolve `scripts/search-github.ts` relative to this `SKILL.md`, then run `node --experimental-strip-types "<skill-directory>/scripts/search-github.ts" --technologies "<comma-separated-confirmed-technologies>" --keywords "<comma-separated-user-approved-keywords>"`. Parse its JSON output.
- Treat `ok`, `empty`, `rate_limited`, and `unavailable` as distinct outcomes. Disclose the outcome and continue without enrichment when references are unavailable. If rate limited, explain that anonymous lookup remains optional and the user may configure `GITHUB_TOKEN` or `GH_TOKEN` for authenticated requests.

## Output

Provide the fundamental-problem interpretation, clarified requirements, decision record, compatibility findings, confirmed stack, directory/module blueprint, and implementation checklist as appropriate. For a PRD-only request, stop after interpretation and clarification.
