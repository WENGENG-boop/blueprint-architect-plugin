import assert from "node:assert/strict";
import test from "node:test";
import { githubSearchUsage, parseCliArgs, searchGitHub } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/search-github.ts";

const query = { technologies: ["nextjs", "postgresql"] };

async function captureHeaders(options: Record<string, unknown> = {}): Promise<Headers> {
  let headers = new Headers();
  await searchGitHub(query, {
    ...options,
    fetchImpl: async (_input, init) => {
      headers = new Headers(init?.headers);
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    },
  });
  return headers;
}

test("GitHub search distinguishes success and empty results", async () => {
  const ok = await searchGitHub(query, { fetchImpl: async () => new Response(JSON.stringify({ items: [{ full_name: "owner/repo", description: "Example", stargazers_count: 42, html_url: "https://github.com/owner/repo", language: "TypeScript", topics: ["nextjs"] }] }), { status: 200 }) });
  assert.equal(ok.status, "ok");
  assert.equal(ok.repos[0].fullName, "owner/repo");
  const empty = await searchGitHub(query, { fetchImpl: async () => new Response(JSON.stringify({ items: [] }), { status: 200 }) });
  assert.equal(empty.status, "empty");
});

test("GitHub search reports rate limits and malformed responses", async () => {
  const limited = await searchGitHub(query, { fetchImpl: async () => new Response("", { status: 403 }) });
  assert.equal(limited.status, "rate_limited");
  const malformed = await searchGitHub(query, { fetchImpl: async () => new Response(JSON.stringify({ unexpected: true }), { status: 200 }) });
  assert.equal(malformed.status, "unavailable");
});

test("GitHub search reports network failure without exposing its token", async () => {
  const secret = "never-print-this-token";
  const failed = await searchGitHub(query, { token: secret, fetchImpl: async () => { throw new Error(`network failure ${secret}`); } });
  assert.equal(failed.status, "unavailable");
  assert.ok(!failed.message.includes(secret));
});

test("GitHub search times out as unavailable", async () => {
  const fetchImpl = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
  });
  const result = await searchGitHub(query, { timeoutMs: 5, fetchImpl });
  assert.equal(result.status, "unavailable");
});

test("explicit token takes priority over configured environment tokens", async () => {
  const headers = await captureHeaders({ token: "explicit-token", env: { GITHUB_TOKEN: "github-token", GH_TOKEN: "gh-token" } });
  assert.equal(headers.get("Authorization"), "Bearer explicit-token");
});

test("GITHUB_TOKEN takes priority over GH_TOKEN", async () => {
  const headers = await captureHeaders({ env: { GITHUB_TOKEN: "github-token", GH_TOKEN: "gh-token" } });
  assert.equal(headers.get("Authorization"), "Bearer github-token");
});

test("GH_TOKEN is used as fallback and anonymous mode sends no authorization", async () => {
  const fallback = await captureHeaders({ env: { GH_TOKEN: "gh-token" } });
  assert.equal(fallback.get("Authorization"), "Bearer gh-token");
  const anonymous = await captureHeaders({ env: {} });
  assert.equal(anonymous.get("Authorization"), null);
});

test("GitHub requests send stable API headers", async () => {
  const headers = await captureHeaders({ env: {} });
  assert.equal(headers.get("Accept"), "application/vnd.github+json");
  assert.equal(headers.get("User-Agent"), "blueprint-architect-plugin/0.1.0");
  assert.equal(headers.get("X-GitHub-Api-Version"), "2022-11-28");
});

test("CLI parses lists and applies safe defaults", () => {
  const parsed = parseCliArgs(["--technologies", "nextjs, postgresql", "--keywords", "saas,dashboard"]);
  assert.deepEqual(parsed.query, { technologies: ["nextjs", "postgresql"], keywords: ["saas", "dashboard"] });
  assert.deepEqual(parsed.options, { minStars: 100, maxResults: 5, timeoutMs: 8_000 });
});

test("CLI help does not require a query", () => {
  assert.equal(parseCliArgs(["--help"]).help, true);
  assert.match(githubSearchUsage(), /GITHUB_TOKEN or GH_TOKEN/);
});

test("CLI rejects unsafe or invalid arguments", () => {
  assert.throws(() => parseCliArgs([]), /--technologies is required/);
  assert.throws(() => parseCliArgs(["--technologies", "nextjs", "--max-results", "11"]), /between 1 and 10/);
  assert.throws(() => parseCliArgs(["--technologies", "nextjs", "--timeout-ms", "0"]), /must be positive/);
  assert.throws(() => parseCliArgs(["--technologies", "nextjs", "--token", "secret-value"]), /Do not pass tokens/);
  assert.throws(() => parseCliArgs(["--technologies", "nextjs", "--unknown", "value"]), /Unknown option/);
});
