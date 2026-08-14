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
  fetchImpl?: typeof fetch;
}

function normalizeTerms(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => /^[a-zA-Z0-9._+#-]{1,40}$/.test(value));
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const search = `${[...technologies, ...keywords].join(" ")} stars:>=${minStars}`;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

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
