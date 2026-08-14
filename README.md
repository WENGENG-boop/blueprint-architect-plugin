# Blueprint Architect for Codex

[English](README.md) | [简体中文](README.zh-CN.md)

Blueprint Architect turns a product idea or PRD into a reviewed project blueprint before implementation begins. It first explains the fundamental user problem, then guides only the material product and architecture decisions, checks compatibility, and generates files only after final confirmation.

## Why Blueprint Architect comes before Superpowers

Most development teams do not lose weeks because they cannot write code. They lose weeks because a vague PRD becomes implementation too early:

- the team ships features before agreeing on the fundamental user problem;
- frontend, backend, database, authentication, and deployment choices are made independently and conflict later;
- stakeholders are asked broad technical questions without enough context to choose confidently;
- coding agents work from different assumptions because no PRD-traceable blueprint exists;
- disciplined execution produces the wrong product faster.

[Superpowers](https://github.com/obra/superpowers) helps coding agents execute software work with discipline. **Blueprint Architect addresses the earlier and more expensive risk: building the wrong product or locking in an incompatible architecture before implementation starts.**

| Critical developer question | Blueprint Architect advantage | Superpowers focus |
|---|---|---|
| Are we solving the right problem? | Starts from the PRD and identifies the fundamental user problem, constraints, unknowns, and non-goals before discussing technology. | Refines requested software work into a design as part of a broader development methodology. |
| Will the stack work together? | Checks every confirmed technical decision against earlier choices and exposes conflicts before files are generated. | Focuses primarily on disciplined planning and implementation after a direction is established. |
| Can stakeholders make confident choices? | Presents one material decision at a time through structured Plan-mode selectors, with a grounded recommendation and concise trade-offs. | Uses Socratic design refinement and workflow skills to govern the wider development process. |
| What does implementation receive? | Produces a PRD-traceable decision record plus a confirmed directory and module blueprint. | Produces implementation plans and drives TDD, debugging, reviews, subagent execution, and branch completion. |
| When should it be used? | **Use first** while requirements, scope, stack, or architecture still need to become explicit and compatible. | **Use next** when the team is ready to implement the confirmed direction systematically. |

> **Recommended workflow:** use Blueprint Architect first to prevent requirement and architecture mistakes; then use Superpowers to plan, implement, test, review, and finish the confirmed blueprint.

### Choose Blueprint Architect first when...

- your input is still a product idea or PRD rather than an implementation-ready specification;
- stakeholders need to understand the fundamental problem before technologies are selected;
- technical decisions need to be explained and confirmed one at a time;
- the team needs a compatibility-checked, PRD-traceable project blueprint before coding begins.

Blueprint Architect and Superpowers are independent projects with complementary primary purposes; this comparison does not imply affiliation.

> [!NOTE]
> **Sponsor / Advertisement — [WeoAPI](https://sub.weo.asia)**
>
> WeoAPI describes its offering as a stable API relay service with occasional benefit campaigns. New registrations currently receive `$0.20` in account credit. Credit, availability, pricing, and campaign terms are provided by WeoAPI and may change; check the site for current details.

## What it changes

- Interprets PRDs without forcing a generic questionnaire.
- Uses Codex's structured selector for decisions instead of typed A/B/C replies.
- Checks confirmed technical choices against compatibility rules.
- Produces a decision record, directory plan, module documentation, and implementation checklist.
- Optionally searches public GitHub repositories when the user explicitly requests references.

It does not implement the application, deploy it, publish secrets, or claim planned checks have already passed.

## Install

Requires a Codex version with plugin marketplace support.

```powershell
codex plugin marketplace add WENGENG-boop/blueprint-architect-plugin
codex plugin add blueprint-architect-plugin@blueprint-architect
```

To refresh a previously added marketplace:

```powershell
codex plugin marketplace upgrade blueprint-architect
```

Restart or open a new Codex task after installation so the Skill catalog is refreshed.

## Use

Enter Plan mode, attach or paste a PRD, and invoke:

```text
$blueprint-architect Analyze this PRD and produce a project blueprint.
```

Plan mode is required when the workflow reaches a decision because the Skill uses `request_user_input` to render a structured selector below the conversation. It will stop instead of falling back to prose choices when that selector is unavailable.

For interpretation only:

```text
$blueprint-architect Explain the fundamental product problem in this PRD and list the missing requirements. Do not create files.
```

The personal `/prompts:blueprint` shortcut is not bundled. `$blueprint-architect` is the portable plugin invocation.

## Generated output

When the user confirms file creation, the bundled generator can create a non-destructive project blueprint containing:

- root project summary and confirmed technology choices;
- application, component, domain/integration, test, public, and type directories;
- module responsibility and interface documents;
- unchecked implementation and verification work.

Project names must contain lowercase letters, digits, and single hyphens. Existing target directories are never overwritten.

## Privacy and networking

PRD content stays in the active Codex workflow. GitHub lookup is optional and runs only when the user requests public implementation references. The lookup sends a minimized list of explicit technology/keyword terms, never the PRD itself. A token may be supplied programmatically for higher rate limits; it is not logged. Network and rate-limit failures are reported separately from an empty result and do not block blueprint generation.

## Development

Requires Node.js 22 or newer.

```powershell
npm install
npm run validate
```

Release validation includes TypeScript checks, resource parsing, interaction-contract checks, generator security tests, mocked GitHub-search tests, and repository manifest checks. Maintainers should additionally run the official validators bundled with their Codex installation:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\skill-creator\scripts\quick_validate.py" "plugins\blueprint-architect-plugin\skills\blueprint-architect"
python "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py" "plugins\blueprint-architect-plugin"
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for pull-request expectations.

## Known limitations

- Structured selector rendering requires Plan mode and a Codex client that exposes `request_user_input`.
- Compatibility rules are advisory; deployment-specific constraints still need verification against current provider documentation.
- GitHub reference search is best-effort and unavailable offline.
- This repository distributes a Codex Plugin, not an npm CLI, MCP server, or web application.

## License

[MIT](LICENSE)
