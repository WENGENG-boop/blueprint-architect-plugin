# GitHub Search Configuration Design

**Date:** 2026-08-14
**Status:** Approved for direct implementation

## Goal

Turn the bundled GitHub repository search from an unconnected library function into an optional, documented feature that installed users can configure and that Blueprint Architect can invoke safely.

## Current defect

`search-github.ts` currently accepts `options.token` only from another TypeScript caller. It does not read environment variables, provide a command-line entry point, or have an actual caller. `SKILL.md` says to use the script but does not define how to invoke it. The READMEs mention token support without giving users a working configuration path.

## Configuration model

GitHub search remains optional and works in two modes:

- Anonymous mode: search public repositories without configuration, subject to GitHub's stricter unauthenticated search limits.
- Authenticated mode: read `GITHUB_TOKEN`, then fall back to `GH_TOKEN`, for higher authenticated limits.

An explicitly supplied programmatic token continues to take priority for tests and library callers. Do not accept a `--token` CLI flag because command-line arguments can be exposed through process inspection and shell history. Do not load `.env` files or store tokens in the plugin directory.

The request must send a descriptive `User-Agent`, the GitHub JSON `Accept` header, and a supported API-version header. Never log or return the token.

## CLI contract

Make the script directly executable with Node's TypeScript stripping:

```powershell
node --experimental-strip-types search-github.ts --technologies nextjs,postgresql --keywords saas,dashboard --min-stars 100 --max-results 5
```

Supported flags:

- `--technologies`: required comma-separated technology terms;
- `--keywords`: optional comma-separated contextual terms;
- `--min-stars`: optional non-negative integer, default `100`;
- `--max-results`: optional integer from `1` to `10`, default `5`;
- `--timeout-ms`: optional positive integer, default `8000`;
- `--help`: print usage without contacting GitHub.

Print one JSON result to standard output with status `ok`, `empty`, `rate_limited`, or `unavailable`. Treat all four operational statuses as valid command completion so Blueprint Architect can parse the result and continue without enrichment. Invalid CLI arguments print a safe error to standard error and set exit code `2`.

## Skill integration

Update `SKILL.md` so the workflow:

1. Searches only after the user explicitly asks for implementation references.
2. Builds a minimized query from confirmed technology choices and user-supplied keywords; never includes PRD prose, secrets, customer names, or private requirements.
3. Resolves `scripts/search-github.ts` relative to the directory containing `SKILL.md`.
4. Runs the CLI with Node and parses the JSON result.
5. Shows repository name, description, stars, language, and URL only when status is `ok`.
6. Clearly distinguishes `empty`, `rate_limited`, and `unavailable` and continues blueprint generation.
7. Explains that setting `GITHUB_TOKEN` or `GH_TOKEN` is optional when a rate limit is encountered.

## User documentation

Add a dedicated `GitHub reference search` section to both READMEs after `Privacy and networking`.

Document:

- no Token is required for low-volume public searches;
- authenticated search uses `GITHUB_TOKEN`, with `GH_TOKEN` as fallback;
- use a fine-grained, read-only token limited to the minimum repository metadata access needed for public repository search;
- link GitHub's official token-permission and REST rate-limit documentation;
- configure the environment before launching Codex, then fully restart Codex Desktop or start the CLI from that environment;
- never commit the Token, paste it into a PRD, store it in this repository, or pass it as a CLI argument.

Windows PowerShell current-session example:

```powershell
$env:GITHUB_TOKEN = "github_pat_..."
codex
```

Windows per-user example:

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "github_pat_...", "User")
```

Tell Desktop users to quit all Codex processes and reopen the app after setting a per-user variable.

macOS/Linux current-shell example:

```bash
export GITHUB_TOKEN="github_pat_..."
codex
```

Explain that graphical applications may not inherit shell-profile variables; the variable must exist in the environment that launches Codex.

Include a user prompt example:

```text
$blueprint-architect Find public GitHub implementation references for the confirmed stack.
```

Also include a direct script example for maintainers and troubleshooting, run from the cloned repository root with the exact repository-relative script path.

## Tests

Extend automated coverage for:

- explicit token priority over environment variables;
- `GITHUB_TOKEN` priority over `GH_TOKEN`;
- fallback to `GH_TOKEN`;
- anonymous requests without an Authorization header;
- required GitHub headers;
- CLI argument parsing and validation;
- help output without a network request;
- CLI JSON output for success and nonfatal failure statuses;
- no token value in results, errors, or formatted output;
- Skill instructions containing the exact invocation and privacy constraints;
- English and Chinese README configuration parity.

Use mocked fetch implementations; CI must not contact GitHub or require secrets.

## Compatibility and release handling

Keep the existing exported `searchGitHub()` API compatible. The generator and PRD analysis workflow remain unchanged. Publish the fix to `main` without rewriting `v0.1.0`; include it in a later functional release unless a new release is explicitly requested.
