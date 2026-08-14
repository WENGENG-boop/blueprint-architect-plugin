# Bilingual README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Simplified Chinese README and reciprocal language navigation while preserving the English README as GitHub's default document.

**Architecture:** Keep `README.md` in English and create `README.zh-CN.md` with the same section order, commands, links, positioning, sponsor disclosure, and limitations. Extend the existing README regression test to enforce reciprocal navigation and essential semantic parity.

**Tech Stack:** Markdown, Node.js built-in test runner, Git, GitHub Actions.

---

### Task 1: Add failing bilingual documentation tests

**Files:**
- Modify: `tests/readme-content.test.ts`

- [ ] **Step 1: Add bilingual navigation and parity assertions**

Read both `README.md` and `README.zh-CN.md`. Assert that both begin with the same reciprocal navigation directly after their title:

```markdown
[English](README.md) | [简体中文](README.zh-CN.md)
```

Assert that both files contain:

```text
https://github.com/obra/superpowers
https://sub.weo.asia
$0.20
codex plugin marketplace add WENGENG-boop/blueprint-architect-plugin
codex plugin add blueprint-architect-plugin@blueprint-architect
$blueprint-architect
```

Assert the Chinese file contains `为什么 Blueprint Architect 应该先于 Superpowers 使用`, `推荐工作流`, `赞助商 / 广告`, `Plan 模式`, and the independence statement `两个相互独立的项目`.

- [ ] **Step 2: Run the test and verify the missing Chinese file fails**

Run: `npm test`

Expected: failure with `ENOENT` for `README.zh-CN.md`.

### Task 2: Implement reciprocal navigation and full Chinese translation

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`

- [ ] **Step 1: Add navigation to the English README**

Directly below `# Blueprint Architect for Codex`, add:

```markdown
[English](README.md) | [简体中文](README.zh-CN.md)
```

- [ ] **Step 2: Create the complete Chinese README**

Use this title and navigation:

```markdown
# Blueprint Architect for Codex

[English](README.md) | [简体中文](README.zh-CN.md)
```

Translate all explanatory prose and headings naturally while preserving the English document's exact logical order. Keep commands, URLs, filenames, variables, `$blueprint-architect`, `$0.20`, version requirements, and code blocks unchanged.

Translate the comparison as a strong developer-pain argument: vague PRDs cause rework, independently selected stack pieces conflict, stakeholders lack decision context, and multiple agents need a shared PRD-traceable blueprint. Preserve the recommended order: Blueprint Architect first, Superpowers next.

Translate the WeoAPI block as `赞助商 / 广告`, preserve the provider-supplied stability framing, and state that credit, availability, pricing, and campaign terms may change.

- [ ] **Step 3: Run README tests**

Run: `npm test`

Expected: all tests pass.

### Task 3: Validate and publish

**Files:**
- Verify: `README.md`
- Verify: `README.zh-CN.md`
- Verify: `tests/readme-content.test.ts`

- [ ] **Step 1: Run complete validation**

Run: `npm run validate`

Expected: syntax checks, all tests, Skill validation, and Plugin validation succeed.

- [ ] **Step 2: Check translation parity and unsafe claims**

Verify reciprocal relative links, matching major-section order, required destinations, commands, sponsor disclosure, and absence of guaranteed uptime, permanent credit, or official OpenAI/Codex provider claims.

- [ ] **Step 3: Commit and push**

Stage only the bilingual design, plan, READMEs, and README test. Run `git diff --cached --check`, then commit with:

```text
docs: add bilingual README navigation
```

Push `main`, wait for successful Ubuntu, Windows, and macOS CI, and fetch both default-branch README files through the GitHub connector.
