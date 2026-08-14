# GitHub Search Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make installed Blueprint Architect plugins able to run optional GitHub repository search through documented environment variables and a safe CLI.

**Architecture:** Preserve `searchGitHub()` as the core library function, add deterministic token resolution and CLI parsing in the same focused script, and connect the Skill to the CLI. Document anonymous and authenticated modes in both READMEs and verify all behavior with mocked network tests.

**Tech Stack:** TypeScript with Node.js built-in type stripping, GitHub REST Search API, Node built-in test runner, Markdown.

---

### Task 1: Add token and request-header regression tests

**Files:**
- Modify: `tests/search-github.test.ts`
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/search-github.ts`

- [ ] **Step 1: Add failing tests**

Add tests that capture `RequestInit.headers` and assert:

- explicit `options.token` wins over `GITHUB_TOKEN` and `GH_TOKEN`;
- `GITHUB_TOKEN` wins over `GH_TOKEN`;
- `GH_TOKEN` is used when `GITHUB_TOKEN` is absent;
- anonymous mode omits `Authorization`;
- every request includes `Accept`, `User-Agent`, and `X-GitHub-Api-Version`;
- result messages never contain the token.

Inject environment values through `options.env` rather than mutating process-wide environment variables in concurrent tests.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --experimental-strip-types --test tests/search-github.test.ts`

Expected: failures because `env`, token fallback, and required headers are not implemented.

- [ ] **Step 3: Implement deterministic token resolution**

Extend `GitHubSearchOptions` with:

```ts
env?: Readonly<Record<string, string | undefined>>;
```

Resolve the Token with:

```ts
const env = options.env ?? process.env;
const token = options.token ?? env.GITHUB_TOKEN ?? env.GH_TOKEN;
```

Set `Authorization` only when `token` is non-empty. Add `User-Agent: blueprint-architect-plugin/0.1.0` and `X-GitHub-Api-Version: 2022-11-28`.

- [ ] **Step 4: Run focused tests**

Run: `node --experimental-strip-types --test tests/search-github.test.ts`

Expected: all search library tests pass.

### Task 2: Add a safe command-line interface

**Files:**
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/search-github.ts`
- Modify: `tests/search-github.test.ts`

- [ ] **Step 1: Add failing parser tests**

Export `parseCliArgs(args: string[])` and test required technologies, comma-separated normalization, numeric bounds, defaults, `--help`, unknown flags, missing values, and rejection of `--token`.

- [ ] **Step 2: Implement parser and usage output**

Return this shape:

```ts
interface GitHubSearchCliConfig {
  help: boolean;
  query: GitHubSearchQuery;
  options: Pick<GitHubSearchOptions, "minStars" | "maxResults" | "timeoutMs">;
}
```

Support `--technologies`, `--keywords`, `--min-stars`, `--max-results`, `--timeout-ms`, and `--help`. Throw safe errors for invalid arguments.

- [ ] **Step 3: Add the direct-execution boundary**

Use `pathToFileURL(resolve(process.argv[1]))` to detect direct execution. Print help without network access. Otherwise call `searchGitHub()` and print exactly one formatted JSON result. On invalid arguments, print a safe error and set `process.exitCode = 2`; never print environment variables or authorization headers.

- [ ] **Step 4: Run CLI smoke checks**

Run the script with `--help` and with an invalid `--token` argument. Expected: help exits `0`; `--token` exits `2` and directs users to environment variables without echoing a token.

### Task 3: Connect the Skill and document configuration

**Files:**
- Modify: `plugins/blueprint-architect-plugin/skills/blueprint-architect/SKILL.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `tests/interaction-contract.test.ts`
- Modify: `tests/readme-content.test.ts`

- [ ] **Step 1: Add failing documentation-contract assertions**

Require the Skill to contain the Node invocation, minimized-query privacy rule, relative script resolution, JSON status handling, and optional `GITHUB_TOKEN`/`GH_TOKEN` guidance. Require both READMEs to contain configuration, current-session commands, Desktop restart guidance, official GitHub permission/rate-limit links, anonymous behavior, and the user prompt example.

- [ ] **Step 2: Update the Skill workflow**

Specify the exact command pattern and behavior for `ok`, `empty`, `rate_limited`, and `unavailable`. Prohibit PRD prose and secrets in queries. Continue blueprint generation for all non-`ok` results.

- [ ] **Step 3: Add matching English and Chinese README sections**

Place `GitHub reference search` / `GitHub 参考仓库搜索` after privacy. Explain optional anonymous mode, `GITHUB_TOKEN` then `GH_TOKEN`, minimum read-only repository metadata permission, environment setup before Codex launch, complete Desktop restart, security rules, Skill prompt example, and repository-root troubleshooting command.

Link:

```text
https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
```

- [ ] **Step 4: Run documentation and interaction tests**

Run: `npm test`

Expected: all tests pass without contacting GitHub.

### Task 4: Validate and publish

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full validation**

Run `npm run validate`, the official Skill validator, and the official Plugin validator. Expected: all exit successfully.

- [ ] **Step 2: Run secret and documentation scans**

Reject committed token-shaped values, `.env` files, `--token` usage examples, missing bilingual configuration, and misleading claims that authentication is mandatory.

- [ ] **Step 3: Commit and push**

Stage the design, plan, script, Skill, tests, and READMEs only. Run `git diff --cached --check`, commit with `fix: connect GitHub reference search`, and push `main` as explicitly requested.

- [ ] **Step 4: Verify remote delivery**

Wait for Ubuntu, Windows, and macOS GitHub Actions jobs to pass. Fetch the published script, Skill, and both README configuration sections through the GitHub connector.
