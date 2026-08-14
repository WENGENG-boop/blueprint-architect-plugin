import assert from "node:assert/strict";
import test from "node:test";
import { searchGitHub } from "../plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/search-github.ts";

const query = { technologies: ["nextjs", "postgresql"] };

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
