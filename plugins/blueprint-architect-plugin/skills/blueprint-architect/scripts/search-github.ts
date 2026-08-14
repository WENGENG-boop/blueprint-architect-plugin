import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface GitHubRepo {
  fullName: string;
  description: string;
  stars: number;
  url: string;
  language: string | null;
  topics: string[];
}

export interface GitHubSearchQuery {
  technologies: string[];
  keywords?: string[];
}

export type GitHubSearchStatus = "ok" | "empty" | "rate_limited" | "unavailable";

export interface GitHubSearchResult {
  status: GitHubSearchStatus;
  repos: GitHubRepo[];
  message: string;
}

export interface GitHubSearchOptions {
  minStars?: number;
  maxResults?: number;
  timeoutMs?: number;
  token?: string;
  env?: Readonly<Record<string, string | undefined>>;
  fetchImpl?: typeof fetch;
}

export interface GitHubSearchCliConfig {
  help: boolean;
  query: GitHubSearchQuery;
  options: Pick<GitHubSearchOptions, "minStars" | "maxResults" | "timeoutMs">;
}

const USAGE = `Usage:
  node --experimental-strip-types search-github.ts --technologies <comma-separated> [options]

Options:
  --technologies <list>  Required. Confirmed technology terms.
  --keywords <list>      Optional public search keywords.
  --min-stars <number>   Minimum stars (default: 100).
  --max-results <number> Results to return, 1-10 (default: 5).
  --timeout-ms <number>  Request timeout in milliseconds (default: 8000).
  --help                 Show this help.

Authentication:
  Set GITHUB_TOKEN or GH_TOKEN in the environment. Do not pass tokens as arguments.`;

function normalizeTerms(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => /^[a-zA-Z0-9._+#-]{1,40}$/.test(value));
}

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseInteger(value: string, flag: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${flag} must be an integer.`);
  return Number(value);
}

export function githubSearchUsage(): string {
  return USAGE;
}

export function parseCliArgs(args: string[]): GitHubSearchCliConfig {
  let help = false;
  let technologies: string[] = [];
  let keywords: string[] = [];
  let minStars = 100;
  let maxResults = 5;
  let timeoutMs = 8_000;

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--help") {
      help = true;
      continue;
    }
    if (flag === "--token") {
      throw new Error("Do not pass tokens on the command line. Set GITHUB_TOKEN or GH_TOKEN.");
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
    index += 1;
    switch (flag) {
      case "--technologies":
        technologies = splitList(value);
        break;
      case "--keywords":
        keywords = splitList(value);
        break;
      case "--min-stars":
        minStars = parseInteger(value, flag);
        break;
      case "--max-results":
        maxResults = parseInteger(value, flag);
        break;
      case "--timeout-ms":
        timeoutMs = parseInteger(value, flag);
        break;
      default:
        throw new Error(`Unknown option: ${flag}`);
    }
  }

  if (!help && technologies.length === 0) throw new Error("--technologies is required.");
  if (maxResults < 1 || maxResults > 10) throw new Error("--max-results must be between 1 and 10.");
  if (timeoutMs < 1) throw new Error("--timeout-ms must be positive.");

  return { help, query: { technologies, keywords }, options: { minStars, maxResults, timeoutMs } };
}

export async function searchGitHub(
  query: GitHubSearchQuery,
  options: GitHubSearchOptions = {},
): Promise<GitHubSearchResult> {
  const technologies = normalizeTerms(query.technologies);
  const keywords = normalizeTerms(query.keywords ?? []);
  if (technologies.length === 0) {
    return { status: "unavailable", repos: [], message: "GitHub search needs at least one explicit technology term." };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxResults = Math.min(Math.max(options.maxResults ?? 5, 1), 10);
  const minStars = Math.max(options.minStars ?? 100, 0);
  const env = options.env ?? process.env;
  const token = options.token ?? env.GITHUB_TOKEN ?? env.GH_TOKEN;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const search = `${[...technologies, ...keywords].join(" ")} stars:>=${minStars}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "blueprint-architect-plugin/0.1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetchImpl(
      `https://api.github.com/search/repositories?${new URLSearchParams({ q: search, sort: "stars", order: "desc", per_page: String(maxResults) })}`,
      { headers, signal: controller.signal },
    );
    if (response.status === 403 || response.status === 429) {
      return { status: "rate_limited", repos: [], message: "GitHub search is rate limited; blueprint generation can continue without references." };
    }
    if (!response.ok) {
      return { status: "unavailable", repos: [], message: `GitHub search is unavailable (HTTP ${response.status}); continuing without references.` };
    }
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !Array.isArray((body as { items?: unknown }).items)) {
      return { status: "unavailable", repos: [], message: "GitHub returned an unexpected response; continuing without references." };
    }
    const repos = (body as { items: Array<Record<string, unknown>> }).items.slice(0, maxResults).map((repo) => ({
      fullName: String(repo.full_name ?? ""),
      description: typeof repo.description === "string" ? repo.description : "",
      stars: Number(repo.stargazers_count ?? 0),
      url: String(repo.html_url ?? ""),
      language: typeof repo.language === "string" ? repo.language : null,
      topics: Array.isArray(repo.topics) ? repo.topics.map(String) : [],
    }));
    if (repos.length === 0) return { status: "empty", repos: [], message: "No matching public repositories were found." };
    return { status: "ok", repos, message: `Found ${repos.length} public reference repositories.` };
  } catch {
    return { status: "unavailable", repos: [], message: "GitHub search could not be reached; continuing without references." };
  } finally {
    clearTimeout(timeout);
  }
}

async function runCli(): Promise<void> {
  try {
    const config = parseCliArgs(process.argv.slice(2));
    if (config.help) {
      process.stdout.write(`${githubSearchUsage()}\n`);
      return;
    }
    const result = await searchGitHub(config.query, config.options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid GitHub search configuration.";
    process.stderr.write(`GitHub search configuration error: ${message}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCli();
}
