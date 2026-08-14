# Bilingual README Design

**Date:** 2026-08-14
**Status:** Approved direction, pending written-spec review

## Goal

Provide complete English and Simplified Chinese repository documentation with an obvious one-click language switch at the top of both files.

## File structure

- Keep `README.md` as the default English document rendered by GitHub.
- Add `README.zh-CN.md` as the complete Simplified Chinese translation.
- Do not place both full languages in one file and do not replace the root README with a language-only landing page.

## Language navigation

Put this navigation directly below the title in `README.md`:

```markdown
[English](README.md) | [简体中文](README.zh-CN.md)
```

Put the same navigation directly below the title in `README.zh-CN.md`. Keep both links active so the current language and alternate language behave consistently.

Use relative repository links so navigation works on the GitHub default branch, tags, forks, and local Markdown viewers.

## Translation contract

The Chinese file must be a complete translation rather than a summary. Preserve the same section order and meaning:

1. Product introduction
2. Blueprint Architect versus Superpowers developer-pain comparison
3. Recommended Blueprint-first workflow
4. Situations where Blueprint Architect should be used first
5. Independence/no-affiliation statement
6. WeoAPI sponsor disclosure and `$0.20` registration credit
7. Product capabilities and boundaries
8. Installation and upgrade commands
9. Usage examples and Plan-mode requirement
10. Generated output
11. Privacy and networking
12. Development and validation
13. Known limitations
14. License

Keep commands, filenames, Skill invocation, URLs, version identifiers, environment variables, and code blocks unchanged. Translate explanatory prose and headings into natural Simplified Chinese.

## Product positioning

The Chinese translation must preserve the strong top-of-page positioning already approved:

- developers lose time when vague PRDs become implementation too early;
- independently selected technologies can conflict later;
- stakeholders need one contextual decision at a time;
- multiple coding agents need a shared, PRD-traceable blueprint;
- Blueprint Architect should be used before Superpowers when requirements and architecture are not yet confirmed.

Do not weaken the Blueprint Architect advantage into a generic feature list. Do not add claims of universal superiority or capabilities absent from the plugin.

## Sponsor translation

Translate the disclosed WeoAPI block without changing its claims:

- label it `赞助商 / 广告`;
- link `WeoAPI` to <https://sub.weo.asia>;
- state that WeoAPI describes the API relay service as stable and offers occasional benefit campaigns;
- state that new registrations currently receive `$0.20` account credit;
- state that credit, availability, pricing, and campaign terms are controlled by WeoAPI and may change.

Do not convert the provider-supplied positioning into an independently verified uptime guarantee or official OpenAI/Codex endorsement.

## Verification

Add regression coverage that checks:

- both README files exist;
- both files contain reciprocal relative language links immediately after their titles;
- the English README links to `README.zh-CN.md`;
- the Chinese README links to `README.md`;
- both contain the Superpowers and WeoAPI destinations;
- both contain `$0.20`, the Plan-mode requirement, install commands, and the no-affiliation meaning;
- the major headings appear in the same logical order;
- no absolute guarantee or official-provider claim is introduced.

Run the full local validation suite, push only after it succeeds, and require the Ubuntu, Windows, and macOS GitHub Actions jobs to pass. Verify both published files through the GitHub connector.

## Release handling

Publish the bilingual documentation on `main`. Do not move or rewrite the existing `v0.1.0` tag. Include the bilingual README work in a future functional release rather than creating a documentation-only release unless explicitly requested.
