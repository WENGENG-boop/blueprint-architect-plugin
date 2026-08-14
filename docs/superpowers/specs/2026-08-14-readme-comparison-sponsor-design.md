# README Comparison and Sponsor Design

**Date:** 2026-08-14
**Status:** Proposed for review

## Goal

Improve the public README by explaining how Blueprint Architect relates to Superpowers and by adding a clearly disclosed WeoAPI advertisement without weakening the repository's technical credibility.

## Placement

Place the comparison immediately after the opening product introduction. It is the first substantive README section and must establish Blueprint Architect's advantage before installation or feature details.

Place the WeoAPI sponsor block immediately after the comparison and before `## What it changes`. The sponsor keeps strong early-page visibility without displacing the product-positioning argument.

## Sponsor block

Use a Markdown callout headed `Sponsor / Advertisement`. Include only the information supplied by the repository owner:

- Brand: WeoAPI
- Site: <https://sub.weo.asia>
- Registration benefit: `$0.20` account credit
- Positioning: stable API relay service with occasional benefit campaigns

Qualify the service description as provider-supplied marketing language. State that credit, campaign terms, availability, pricing, and service conditions are controlled by WeoAPI and may change. Do not claim measured uptime, official partnership with OpenAI, guaranteed savings, or endorsement by Codex/OpenAI.

Proposed copy:

> **Sponsor / Advertisement — [WeoAPI](https://sub.weo.asia)**
> WeoAPI offers a stable API relay service and occasional benefit campaigns. New registrations currently receive `$0.20` in account credit. Credit, availability, pricing, and campaign terms are provided by WeoAPI and may change; check the site for current details.

## Superpowers comparison

Title the section `Why Blueprint Architect comes before Superpowers`. Lead with this positioning:

> Superpowers helps coding agents execute software work with discipline. Blueprint Architect addresses the earlier and more expensive risk: building the wrong product or locking in an incompatible architecture before implementation starts.

Emphasize Blueprint Architect's product-definition advantage without claiming Superpowers cannot perform adjacent work. The section should make Blueprint Architect the recommended first step and Superpowers a compatible downstream execution system.

Use an advantage-led table with these rows:

| Critical question | Blueprint Architect advantage | Superpowers focus |
|---|---|---|
| Are we solving the right problem? | Starts from the PRD, identifies the fundamental user problem, constraints, unknowns, and non-goals before discussing technology. | Starts a broader software-development methodology and refines the requested work into a design. |
| Are architecture choices compatible? | Checks each confirmed technical decision against earlier choices and exposes conflicts before files are generated. | Concentrates on disciplined planning and implementation after design direction is established. |
| Can non-experts make decisions confidently? | Presents one material decision at a time through structured Plan-mode selectors, with a grounded recommendation and concise trade-offs. | Uses Socratic design refinement and workflow skills intended to govern the full development process. |
| What is handed to implementation? | Produces a PRD-traceable decision record plus a confirmed directory and module blueprint. | Produces implementation plans and drives TDD, debugging, reviews, subagent execution, and branch completion. |
| When should it be used? | Use first when requirements, scope, stack, or architecture still need to be made explicit and compatible. | Use next when the team is ready to implement the confirmed direction systematically. |

Follow the table with a compatibility note:

> **Recommended workflow:** use Blueprint Architect first to prevent requirement and architecture mistakes; then use Superpowers to plan, implement, test, review, and finish the confirmed blueprint.

Add a short `Choose Blueprint Architect first when...` list with these points:

- the input is still a product idea or PRD rather than an implementation-ready specification;
- stakeholders need to understand the fundamental problem before selecting technologies;
- technical decisions must be explained to a user one at a time;
- stack compatibility and a PRD-traceable project blueprint are required before coding.

Link `Superpowers` to its canonical GitHub repository at <https://github.com/obra/superpowers>. State that the comparison is based on each project's stated primary purpose and does not imply affiliation.

## Verification

After editing README:

1. Run the existing repository validation suite.
2. Check Markdown links for the WeoAPI and Superpowers destinations.
3. Confirm the advertisement is explicitly disclosed.
4. Scan for unverifiable guarantees such as uptime percentages, permanent credits, official-provider status, or absolute superiority claims.
5. Commit and push the README change only after validation succeeds.

## Release handling

Publish this as a documentation update on `main`. Do not retag or rewrite `v0.1.0`. The existing release remains immutable; the updated README appears on the repository default branch. A later functional release can include the documentation change in its changelog.
