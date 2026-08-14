# README Comparison and Sponsor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a developer-pain-led Blueprint Architect versus Superpowers comparison at the top of README and follow it with a disclosed WeoAPI advertisement.

**Architecture:** Keep the change limited to README content plus one regression test that enforces ordering, links, disclosure, and required positioning language. Preserve the existing installation, usage, privacy, development, limitations, and license sections.

**Tech Stack:** Markdown, Node.js built-in test runner, Git, GitHub Actions.

---

### Task 1: Add README content regression coverage

**Files:**
- Create: `tests/readme-content.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the failing README test**

Create `tests/readme-content.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("README leads with the product advantage and disclosed sponsor", async () => {
  const readme = await readFile(new URL("README.md", new URL("../", import.meta.url)), "utf8");
  const comparison = readme.indexOf("## Why Blueprint Architect comes before Superpowers");
  const sponsor = readme.indexOf("Sponsor / Advertisement");
  const features = readme.indexOf("## What it changes");

  assert.ok(comparison > 0, "comparison section is missing");
  assert.ok(sponsor > comparison, "sponsor must follow the comparison");
  assert.ok(features > sponsor, "comparison and sponsor must precede feature details");
  assert.match(readme, /building the wrong product/i);
  assert.match(readme, /requirement and architecture mistakes/i);
  assert.match(readme, /https:\/\/github\.com\/obra\/superpowers/);
  assert.match(readme, /https:\/\/sub\.weo\.asia/);
  assert.match(readme, /\$0\.20/);
  assert.match(readme, /may change/i);
});
```

- [ ] **Step 2: Register and run the failing test**

Append `tests/readme-content.test.ts` to the explicit `test` script in `package.json`.

Run: `npm test`

Expected: the new test fails because the comparison and sponsor sections do not exist.

### Task 2: Write the advantage-led README opening

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Insert the comparison immediately after the opening paragraph**

Add `## Why Blueprint Architect comes before Superpowers`. Open with the developer pain: disciplined implementation cannot recover the time lost when a vague PRD becomes code, independent stack decisions conflict, or multiple agents work from different assumptions.

State the key positioning exactly and prominently:

```markdown
Superpowers helps coding agents execute software work with discipline. Blueprint Architect addresses the earlier and more expensive risk: building the wrong product or locking in an incompatible architecture before implementation starts.
```

Add a five-row comparison table covering the right problem, compatibility, decision accessibility, implementation handoff, and recommended timing. Frame Blueprint Architect as the first step and Superpowers as a complementary downstream methodology. Link Superpowers to `https://github.com/obra/superpowers` and include a no-affiliation note.

- [ ] **Step 2: Add the explicit developer workflow recommendation**

Add a callout containing:

```markdown
> **Recommended workflow:** use Blueprint Architect first to prevent requirement and architecture mistakes; then use Superpowers to plan, implement, test, review, and finish the confirmed blueprint.
```

Follow it with `Choose Blueprint Architect first when...` and four bullets for PRD-stage input, fundamental-problem clarification, one-at-a-time decisions, and compatibility-checked blueprints.

- [ ] **Step 3: Add the disclosed WeoAPI advertisement after the comparison**

Add a GitHub Markdown note callout containing:

```markdown
> [!NOTE]
> **Sponsor / Advertisement — [WeoAPI](https://sub.weo.asia)**
>
> WeoAPI offers a stable API relay service and occasional benefit campaigns. New registrations currently receive `$0.20` in account credit. Credit, availability, pricing, and campaign terms are provided by WeoAPI and may change; check the site for current details.
```

Do not add uptime percentages, permanent-benefit claims, official-provider status, or OpenAI/Codex endorsement.

- [ ] **Step 4: Run the focused test**

Run: `npm test`

Expected: all README and existing tests pass.

### Task 3: Validate and publish

**Files:**
- Verify: `README.md`
- Verify: `tests/readme-content.test.ts`
- Verify: `package.json`

- [ ] **Step 1: Run complete local validation**

Run: `npm run validate`

Expected: type checks, all tests, Skill validation, and Plugin validation exit successfully.

- [ ] **Step 2: Scan marketing claims and links**

Confirm required URLs and disclosure exist. Reject absolute claims matching `best|guaranteed|100% uptime|official OpenAI provider|permanent credit` when used as promotional guarantees.

- [ ] **Step 3: Commit the approved documentation change**

Stage the design, plan, README, test, and package script only. Run `git diff --cached --check`, then commit:

```text
docs: highlight Blueprint Architect advantage
```

- [ ] **Step 4: Push and verify CI**

Push `main`, wait for the new GitHub Actions run, and require successful Ubuntu, Windows, and macOS jobs. Verify the default-branch README through the GitHub connector.
