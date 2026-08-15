import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const languageNavigation = "[English](README.md) | [简体中文](README.zh-CN.md)";

test("README leads with the product advantage and disclosed sponsor", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
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
  assert.match(readme, /<table width="100%">/);
  assert.match(readme, /<h2>🚀 Recommended API Relay: WeoAPI<\/h2>/);
  assert.match(readme, /Visit WeoAPI →/);
});

test("READMEs state that anonymous GitHub search needs no token", async () => {
  const [english, chinese] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8"),
  ]);

  assert.match(english, /users do not need to configure a GitHub token/i);
  assert.match(english, /runs anonymously by default/i);
  assert.match(chinese, /用户不需要配置 GitHub Token/);
  assert.match(chinese, /默认以匿名方式运行/);
  assert.match(chinese, /Token 完全可选/);
});

test("READMEs document both Plugin and standalone Skill installation", async () => {
  const [english, chinese] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8"),
  ]);
  const sharedInstallDetails = [
    "--repo WENGENG-boop/blueprint-architect-plugin",
    "--path plugins/blueprint-architect-plugin/skills/blueprint-architect",
    "$CODEX_HOME/skills/blueprint-architect",
  ];

  for (const required of sharedInstallDetails) {
    assert.ok(english.includes(required), `English README is missing standalone install detail: ${required}`);
    assert.ok(chinese.includes(required), `Chinese README is missing standalone install detail: ${required}`);
  }
  assert.match(english, /install as a Plugin \(recommended\)/i);
  assert.match(english, /install only the standalone Skill/i);
  assert.match(chinese, /作为 Plugin 安装（推荐）/);
  assert.match(chinese, /只安装独立 Skill/);
  assert.match(chinese, /不要同时安装两份/);
});

test("READMEs document selector use in Plan mode and prose fallback elsewhere", async () => {
  const [english, chinese] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8"),
  ]);

  assert.match(english, /In Plan mode[\s\S]*structured selector/);
  assert.match(english, /Outside Plan mode[\s\S]*numbered prose list/);
  assert.match(chinese, /在 Plan 模式中[\s\S]*结构化选择器/);
  assert.match(chinese, /未进入 Plan 模式或选择器不可用时[\s\S]*编号文字列表/);
});

test("READMEs do not describe the legacy generator as fully dynamic", async () => {
  const [english, chinese] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8"),
  ]);
  assert.match(english, /current generator creates a fixed starter scaffold/i);
  assert.match(english, /compatibility rules are advisory and intentionally limited/i);
  assert.match(chinese, /当前生成器创建的是固定起步结构/);
  assert.match(chinese, /兼容性规则属于有限的辅助检查/);
});

test("English and Chinese READMEs provide reciprocal navigation and equivalent essentials", async () => {
  const [english, chinese] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8"),
  ]);

  assert.match(english, new RegExp(`^# Blueprint Architect for Codex\\r?\\n\\r?\\n${languageNavigation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(chinese, new RegExp(`^# Blueprint Architect for Codex\\r?\\n\\r?\\n${languageNavigation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

  for (const required of [
    "https://github.com/obra/superpowers",
    "https://sub.weo.asia",
    "$0.20",
    "codex plugin marketplace add WENGENG-boop/blueprint-architect-plugin",
    "codex plugin add blueprint-architect-plugin@blueprint-architect",
    "$blueprint-architect",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens",
    "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
    "Find public GitHub implementation references for the confirmed stack",
  ]) {
    assert.ok(english.includes(required), `English README is missing ${required}`);
    assert.ok(chinese.includes(required), `Chinese README is missing ${required}`);
  }

  for (const requiredChinese of [
    "为什么 Blueprint Architect 应该先于 Superpowers 使用",
    "推荐工作流",
    "赞助商 / 广告",
    "推荐 API 中转服务：WeoAPI",
    "立即访问 WeoAPI →",
    "Plan 模式",
    "两个相互独立的项目",
    "配置 GitHub 参考搜索",
    "完全退出并重新打开 Codex Desktop",
  ]) {
    assert.ok(chinese.includes(requiredChinese), `Chinese README is missing ${requiredChinese}`);
  }

  const headingOrders = [
    [english, ["## Why Blueprint Architect comes before Superpowers", "## What it changes", "## Install", "## Use", "## Generated output", "## Privacy and networking", "## Configure GitHub reference search", "## Development", "## Known limitations", "## License"]],
    [chinese, ["## 为什么 Blueprint Architect 应该先于 Superpowers 使用", "## 功能", "## 安装", "## 使用", "## 生成内容", "## 隐私与网络", "## 配置 GitHub 参考搜索", "## 开发", "## 已知限制", "## 许可证"]],
  ] as const;

  for (const [content, headings] of headingOrders) {
    let previous = -1;
    for (const heading of headings) {
      const position = content.indexOf(heading);
      assert.ok(position > previous, `README heading is missing or out of order: ${heading}`);
      previous = position;
    }
  }
});
