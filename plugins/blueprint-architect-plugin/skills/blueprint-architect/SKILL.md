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
4. Ask one decision at a time with `request_user_input`. Each call must contain exactly one question and two or three mutually exclusive options. Put the grounded recommendation first, end its label with `(Recommended)`, and give every option one concise impact or trade-off description.
5. After each technical choice, read `references/compatibility-matrix.yaml` and validate it against confirmed choices. Explain conflicts before continuing. Present any corrective decision with the same structured-selector rules.
6. Maintain a concise decision record: choice, reason, alternatives, assumptions, and unresolved risks.
7. Present the proposed blueprint and request final confirmation with `request_user_input` under the same one-question, two-or-three-option selector contract.
8. Only after confirmation, use `templates/v2-module-template.md` and `references/module-types.yaml` to create the requested directory blueprint and documentation. Use `scripts/generate-structure.ts` only when the user explicitly asks to create files.
9. Verify traceability to the PRD. Keep planned work unchecked and never claim unperformed tests, review, deployment, or metrics as complete.

## Interaction contract

- Use `request_user_input` for every product or architecture decision, compatibility correction, and final confirmation.
- Ask exactly one question per tool call and wait for the answer before the next decision.
- Supply two or three mutually exclusive options. Put the recommendation first with `(Recommended)` at the end of its label.
- Never ask the user to type A/B/C, an option label, or free text as the decision mechanism. Codex's automatic `Other` entry does not replace the structured options.
- If `request_user_input` is unavailable, show no prose choices and stop before asking or proceeding. Say: "The structured selector requires Plan mode. Enter `/plan`, then reinvoke `$blueprint-architect`."
- Let the user make final decisions. Prefer the simplest architecture satisfying confirmed constraints.
- Distinguish requirements from assumptions and future ideas. Do not invent metrics, budgets, integrations, or user needs.
- Search GitHub only when the user requests implementation references. Use `scripts/search-github.ts` with a minimized explicit query; disclose failures and continue without enrichment.

## Output

Provide the fundamental-problem interpretation, clarified requirements, decision record, compatibility findings, confirmed stack, directory/module blueprint, and implementation checklist as appropriate. For a PRD-only request, stop after interpretation and clarification.
