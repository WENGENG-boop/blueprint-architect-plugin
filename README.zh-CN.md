# Blueprint Architect for Codex

[English](README.md) | [简体中文](README.zh-CN.md)

Blueprint Architect 把产品想法或 PRD 转化为经过审查的项目蓝图，然后再进入实现阶段。它会先解释最根本的用户问题，再引导用户完成真正影响产品和架构的关键决策，检查技术选择之间的兼容性，并且只有在用户最终确认后才生成文件。

## 为什么 Blueprint Architect 应该先于 Superpowers 使用

大多数开发团队浪费数周时间，并不是因为写不出代码，而是因为模糊的 PRD 过早进入了实现阶段：

- 团队还没有就最根本的用户问题达成一致，就开始交付功能；
- 前端、后端、数据库、身份验证和部署方案被分别选择，直到后期才发现彼此冲突；
- 利益相关者在缺少必要上下文的情况下，被要求回答宽泛的技术问题；
- 因为缺少一份可追溯到 PRD 的共享蓝图，不同编码 Agent 按照不同假设工作；
- 严谨的执行流程反而更快地做出了错误的产品。

[Superpowers](https://github.com/obra/superpowers) 帮助编码 Agent 以严谨的方法执行软件开发工作。**Blueprint Architect 解决的是更早、代价也更高的风险：在实现开始前，避免做错产品或过早锁定不兼容的架构。**

| 开发者面对的关键问题 | Blueprint Architect 的优势 | Superpowers 的重点 |
|---|---|---|
| 我们解决的是正确问题吗？ | 从 PRD 开始，在讨论技术之前识别最根本的用户问题、约束、未知项和明确不做的内容。 | 作为更完整开发方法论的一部分，把用户提出的软件工作逐步细化成设计。 |
| 技术栈能够协同工作吗？ | 将每一个已确认的技术决策与此前选择进行兼容性检查，在生成文件之前暴露冲突。 | 主要关注方向确定之后的规范化计划与实现。 |
| 利益相关者能够有把握地做决定吗？ | Plan 模式使用结构化选择器；非 Plan 模式使用编号文字选项。每次只展示一个关键决策，并提供有依据的推荐和简洁权衡。 | 使用苏格拉底式设计澄清和工作流技能管理更完整的开发过程。 |
| 实现阶段会拿到什么？ | 生成可追溯到 PRD 的决策记录，以及经过确认的目录和模块蓝图。 | 生成实施计划，并推动 TDD、调试、评审、子 Agent 执行和分支收尾。 |
| 应该在什么时候使用？ | 当需求、范围、技术栈或架构仍需明确并验证兼容性时，**先使用 Blueprint Architect**。 | 当团队已经准备好系统化实现确认后的方向时，**接着使用 Superpowers**。 |

> **推荐工作流：**先使用 Blueprint Architect 避免需求和架构错误；再使用 Superpowers 对确认后的蓝图进行计划、实现、测试、评审和收尾。

### 以下情况应该先选择 Blueprint Architect

- 当前输入仍然是产品想法或 PRD，而不是可以直接实现的完整规格；
- 利益相关者需要先理解最根本的问题，再选择技术；
- 技术决策需要逐项解释和确认；
- 团队需要在编码开始前获得经过兼容性检查、可追溯到 PRD 的项目蓝图。

Blueprint Architect 和 Superpowers 是两个相互独立的项目，各自解决互补的核心问题；本对比不代表双方存在从属、合作或附属关系。

<table width="100%">
  <tr>
    <td align="center">
      <h2>🚀 推荐 API 中转服务：WeoAPI</h2>
      <p><strong>稳定服务 · 新注册赠送 $0.20 · 不定时福利</strong></p>
      <p><a href="https://sub.weo.asia"><strong>立即访问 WeoAPI →</strong></a></p>
      <p><sub><strong>赞助商 / 广告。</strong>额度、可用性、价格和活动条款均由 WeoAPI 提供并可能发生变化，请访问站点查看最新信息。</sub></p>
    </td>
  </tr>
</table>

## 功能

- 解读 PRD，而不是强制用户完成通用问卷；
- Plan 模式使用 Codex 结构化选择器，其他情况下自动退回编号文字选项；
- 根据兼容性规则检查已确认的技术选择；
- 生成决策记录、目录规划、模块文档和实施检查清单；
- 仅在用户明确要求实现参考时，可选搜索公开 GitHub 仓库。

它不会实现应用、执行部署、发布密钥，也不会把尚未执行的检查描述为已经通过。

## 安装

Blueprint Architect 既可以作为完整 Codex Plugin 安装，也可以只作为独立 Skill 安装。请选择其中一种方式，不要同时安装两份。

### 方式一：作为 Plugin 安装（推荐）

这是大多数用户最方便的方式，支持由插件市场统一发现和更新，需要使用支持插件市场的 Codex 版本。

```powershell
codex plugin marketplace add WENGENG-boop/blueprint-architect-plugin
codex plugin add blueprint-architect-plugin@blueprint-architect
```

刷新此前已经添加的插件市场：

```powershell
codex plugin marketplace upgrade blueprint-architect
```

### 方式二：只安装独立 Skill

如果只想使用 `$blueprint-architect`，不希望注册插件市场，可以选择这种方式。安装器会下载完整 Skill 目录，其中包括脚本、模板、兼容性规则和 GitHub 参考搜索功能。

Windows PowerShell：

```powershell
python "$env:USERPROFILE\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo WENGENG-boop/blueprint-architect-plugin --path plugins/blueprint-architect-plugin/skills/blueprint-architect
```

macOS 或 Linux：

```bash
python3 "$HOME/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo WENGENG-boop/blueprint-architect-plugin --path plugins/blueprint-architect-plugin/skills/blueprint-architect
```

独立方式会安装到 `$CODEX_HOME/skills/blueprint-architect`，通常就是 `~/.codex/skills/blueprint-architect`。它不会添加插件市场，也不会安装额外的 CLI 或 MCP 服务。

无论选择哪种方式，安装后都要重启 Codex 或创建一个新任务，以刷新 Skill 列表。之后即可调用 `$blueprint-architect`；如果希望使用可点击的结构化选择器，建议先进入 Plan 模式。

## 使用

附加或粘贴 PRD 后即可调用；如果希望使用可点击的结构化选择器，请先进入 Plan 模式：

```text
$blueprint-architect Analyze this PRD and produce a project blueprint.
```

在 Plan 模式中，该 Skill 会通过 `request_user_input` 在对话下方显示结构化选择器。未进入 Plan 模式或选择器不可用时，它会继续执行，把相同的两到三个选项显示为编号文字列表，并等待用户回复选项编号或完整名称。

如果只需要解读 PRD：

```text
$blueprint-architect Explain the fundamental product problem in this PRD and list the missing requirements. Do not create files.
```

插件不包含个人 `/prompts:blueprint` 快捷命令。`$blueprint-architect` 是可移植的插件调用方式。

## 生成内容

> **当前实现边界：**当前生成器创建的是固定起步结构（`app`、`components`、`lib`、`public`、`tests` 和 `types`）以及通用模块 README，并未根据任意 PRD 动态推导完整模块树或具体接口契约。兼容性规则属于有限的辅助检查，不会验证真实 Prisma schema、部署配置、SDK 版本或数据库连接。

用户确认创建文件后，内置生成器可以非破坏性地创建项目蓝图，其中包括：

- 根项目说明和已确认的技术选择；
- 应用、组件、领域/集成、测试、公共资源和类型目录；
- 模块职责和接口文档；
- 尚未完成的实现和验证工作清单。

项目名称只能包含小写字母、数字和单个连字符。生成器绝不会覆盖已经存在的目标目录。

## 隐私与网络

PRD 内容保留在当前 Codex 工作流内。GitHub 查询是可选功能，并且只有用户要求公开实现参考时才会运行。查询只发送已确认的技术名和用户同意公开的关键词，不会发送 PRD 原文、密钥、客户名称或私有需求。网络故障和速率限制会与“没有搜索结果”明确区分，并且不会阻止蓝图生成。

## 配置 GitHub 参考搜索

> **默认开箱即用：用户不需要配置 GitHub Token。公开仓库搜索默认以匿名方式运行。**

匿名搜索会受到 GitHub 更严格的未认证速率限制。Token 完全可选，仅在需要更稳定、更频繁地搜索，或者匿名请求遇到限流时才需要配置。配置后，插件优先读取 `GITHUB_TOKEN`，没有时再读取 `GH_TOKEN`；代码显式传入的 Token 优先级最高。

建议创建细粒度个人访问令牌，只授予公开搜索所需的最小只读仓库元数据权限。请参考 GitHub 官方的[细粒度令牌权限说明](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)和 [REST API 速率限制说明](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)。不要把 Token 提交到仓库、粘贴进 PRD 或聊天、存进插件文件，也不要作为命令行参数传递。

### Windows PowerShell：仅当前会话

先设置环境变量，再从同一个终端启动 Codex：

```powershell
$env:GITHUB_TOKEN = "github_pat_..."
codex
```

### Windows：为当前用户永久保存

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "github_pat_...", "User")
```

设置后要完全退出并重新打开 Codex Desktop。已经运行的桌面应用无法自动获得新添加的环境变量。

### macOS 或 Linux

```bash
export GITHUB_TOKEN="github_pat_..."
codex
```

如果通过桌面图标启动 Codex，它可能不会继承 Shell 配置文件中的环境变量。请从已经设置变量的终端启动，或把变量配置到桌面会话环境中。

安装并配置后，直接这样要求 Skill 搜索即可，普通用户不需要定位插件内部脚本：

```text
$blueprint-architect Find public GitHub implementation references for the confirmed stack.
```

维护者在克隆仓库根目录中可以直接测试：

```powershell
node --experimental-strip-types "plugins/blueprint-architect-plugin/skills/blueprint-architect/scripts/search-github.ts" --technologies "nextjs,postgresql" --keywords "saas,dashboard" --min-stars 100 --max-results 5
```

命令会输出结构化 JSON。`ok`、`empty`、`rate_limited` 和 `unavailable` 是互相独立、不会中断蓝图生成的结果；参数错误退出码为 2。为了安全，命令故意不提供 `--token` 参数。

## 开发

需要 Node.js 22 或更高版本。

```powershell
npm install
npm run validate
```

发布验证包括 TypeScript 检查、资源解析、交互契约检查、生成器安全测试、模拟 GitHub 搜索测试和仓库清单检查。维护者还应运行 Codex 安装目录中附带的官方验证器：

```powershell
python "$env:USERPROFILE\.codex\skills\.system\skill-creator\scripts\quick_validate.py" "plugins\blueprint-architect-plugin\skills\blueprint-architect"
python "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py" "plugins\blueprint-architect-plugin"
```

拉取请求要求请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 已知限制

- 可点击的结构化选择器需要 Plan 模式以及能够提供 `request_user_input` 的 Codex 客户端；其他情况下仍可使用编号文字选项；
- 兼容性规则仅作为建议，具体部署限制仍需根据供应商最新文档进行核实；
- GitHub 实现参考搜索是尽力而为的可选功能，离线时不可用；
- 本仓库分发的是 Codex Plugin，不是 npm CLI、MCP 服务器或 Web 应用。

## 许可证

[MIT](LICENSE)
