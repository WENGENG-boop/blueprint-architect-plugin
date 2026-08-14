# Contributing

Contributions that improve PRD interpretation, compatibility guidance, safe generation, documentation, or cross-platform behavior are welcome.

## Setup

1. Fork and clone the repository.
2. Install Node.js 22 or newer.
3. Run `npm install`.
4. Run `npm run validate` before opening a pull request.

## Pull requests

- Keep each pull request focused and explain the user-visible effect.
- Add deterministic tests for changed scripts or interaction rules.
- Mock GitHub network calls; CI must not require tokens or live access.
- Keep YAML files machine-parseable and free of Markdown fences.
- Keep decisions, compatibility corrections, and final confirmation to one question with two or three mutually exclusive options. Prefer the structured selector; when it is unavailable, use the equivalent numbered prose fallback and wait for the user's reply.
- Do not add real credentials, private PRDs, personal absolute paths, or generated user projects to fixtures.
- Do not mark planned tests, review, deployment, or metrics as complete without evidence.

Use conventional commit messages where practical, for example `fix: reject unsafe project names`.
