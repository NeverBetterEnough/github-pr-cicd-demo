---
name: full-pipeline
description: 全自动开发流水线：需求分析 → 方案设计 → 代码实现 → PR 创建 → CI 监控 → 自动合入 → 部署
---

# Full Pipeline — 全自动开发流水线

从一句需求描述到部署上线的端到端自动化流程。**跨项目可复用**——所有项目特定细节从 `.github/pipeline.json` 读取。

## ⛔ 人工审批门

整个流程有两个审批门，其余全自动：

| 阶段 | 审批 | 原因 |
|------|:---:|------|
| 方案设计 → 代码实现 | **需确认** | 架构决策必须人来拍板 |
| CI 通过 → 合并到 main | **需确认** | 合入主干有风险 |
| 合并 → 部署 | **自动** | CI 已通过 = 可部署（非生产环境） |

---

## 阶段 -1: 加载项目配置

**在开始任何阶段之前，必须先读取配置：**

1. 检查 `.github/pipeline.json` 是否存在
   - 存在 → 读取并解析，存为 `CONFIG`
   - 不存在 → 使用内置 fallback 默认值（向后兼容）
2. 提取关键变量：

```
CONFIG.project.language          → "node" | "python" | "go" | ...
CONFIG.runtime.testCommand       → "npm test" | "pytest" | "go test ./..." | ...
CONFIG.runtime.buildCommand      → "npm run build" | "python -m build" | ...
CONFIG.runtime.installCommand    → "npm ci" | "pip install -e ." | ...
CONFIG.paths.plansDir            → ".claude/plans"
CONFIG.versionControl.baseBranch → "main" | "master" | ...
CONFIG.versionControl.featurePrefix → "feature/"
CONFIG.deploy.provider           → "github-pages" | "vercel" | "none" | ...
CONFIG.pipeline.maxCIFixRetries  → 5
CONFIG.pipeline.mergeMethod      → "squash" | "merge" | "rebase"
CONFIG.agents.*                  → 各 Agent 的 model 配置
```

3. **每个 Agent/Workflow 调用时，注入 Project Context：**

```
## Project Context
- Language: {language}
- Test command: `{testCommand}`
- Build command: `{buildCommand}`
- Install command: `{installCommand}`
- Lint command: `{lintCommand or 'not configured'}`
- Base branch: `{baseBranch}`
- Plans directory: `{plansDir}`

使用以上命令。不要假设 `npm test` 或任何其他工具。
```

---

## 流程

### 阶段 0: 收集需求

1. 如果用户提到 Issue 编号，执行 `gh issue view <number>` 读取需求
2. 如果用户直接描述需求，以此为输入
3. 确认 base 分支（从 CONFIG 读取，默认 `main`）
4. 用 slugify 将需求浓缩为 feature-slug（如 `add-division-support`）

### 阶段 1: 需求分析

派 Agent 做需求分析：

```
Agent(
  model="opus",
  prompt="[注入 Project Context]
  
  分析以下需求，生成结构化规格说明：

  需求：[用户的需求描述]
  
  - 输出 spec 到 {plansDir}/spec-<feature-slug>.md
  - 包含：验收标准、边界情况、技术设计、任务拆解、测试计划
  - 读取现有代码了解项目结构和风格"
)
```

读取生成的 spec，检查 `NEEDS_CLARIFICATION`：
- 有疑问 → 带着问题向用户确认，暂停流程
- 无疑问 → 进入阶段 2

### 阶段 2: 方案设计

1. 将 spec 内容展示给用户
2. 派 Plan Agent：

```
Agent(
  subagent_type="Plan",
  model="sonnet",
  prompt="[注入 Project Context]
  
  根据以下 spec 生成实现计划：
  [粘贴 spec 的关键内容]
  
  生成 plan.md 到 {plansDir}/plan-<feature-slug>.md
  包含：要修改的文件列表、任务顺序、依赖关系、风险点"
)
```

3. ⛔ **询问用户确认计划**，展示关键决策。用户可以要求修改。

### 阶段 3: 代码实现

用户确认后，触发实现流水线：

```
Workflow(
  name="implementation-pipeline",
  args={
    tasks: [从 spec 中提取的任务列表],
    baseBranch: CONFIG.versionControl.baseBranch,
    featureSlug: "<feature-slug>",
    config: {
      testCommand: CONFIG.runtime.testCommand,
      buildCommand: CONFIG.runtime.buildCommand,
      installCommand: CONFIG.runtime.installCommand,
      language: CONFIG.project.language,
      featurePrefix: CONFIG.versionControl.featurePrefix,
      plansDir: CONFIG.paths.plansDir
    }
  }
)
```

内部流程：每任务 → implementer → reviewer → fix loop → 通过。

### 阶段 4: 创建 Pull Request

所有任务通过后：

1. 生成 PR 描述（Agent + git log 范围）
2. Push 并创建 PR：

```bash
git push -u origin HEAD
gh pr create \
  --title "{CONFIG.pipeline.prTitlePrefix}: <feature summary>" \
  --body "<PR description>" \
  --base {CONFIG.versionControl.baseBranch}
```

3. 通知用户 PR 链接

### 阶段 5: CI 监控 + 自动修复

PR 创建后，触发 CI 监控 Workflow：

```
Workflow(
  name="ci-watcher",
  args={
    prNumber: <PR_NUMBER>,
    maxRetries: CONFIG.pipeline.maxCIFixRetries,
    config: {
      testCommand: CONFIG.runtime.testCommand,
      buildCommand: CONFIG.runtime.buildCommand,
      installCommand: CONFIG.runtime.installCommand,
      language: CONFIG.project.language,
      baseBranch: CONFIG.versionControl.baseBranch
    }
  }
)
```

- CI pending → 持续轮询
- CI fail → 自动分析 + 修复 + push + 重试
- 权限类 403 → 自动修 workflow permissions
- 不可自动修复 → 报告用户

### 阶段 6: 审查 + 合入

CI 通过后，⛔ **询问用户确认合并**。

确认后：

```bash
gh pr merge <PR_NUMBER> --{CONFIG.pipeline.mergeMethod} \
  {CONFIG.pipeline.deleteBranchAfterMerge ? "--delete-branch" : ""}
git checkout {CONFIG.versionControl.baseBranch}
git pull
```

### 阶段 7: 部署

合并后，GitHub Actions 自动触发部署。

验证部署：

```bash
gh run list --workflow=cicd.yml --limit=1 --json status,conclusion
```

如果 `CONFIG.deploy.healthCheck.enabled`：
- 执行健康检查（HTTP 200 或自定义验证命令）

通知用户部署结果。

---

## 可复用性设计

本 Skill 不包含任何项目特定的命令。所有 `npm test`、`npm run build` 等命令来自 `.github/pipeline.json`。在新项目中使用只需：

1. 复制 `.claude/` 目录
2. 运行 `pipeline-init` 自动检测并生成 config
3. 或手动编辑 `.github/pipeline.json`

### Fallback 机制

如果 `.github/pipeline.json` 不存在，使用以下默认值：
- testCommand: `npm test` | buildCommand: `npm run build`
- baseBranch: `main` | language: `node`
- plansDir: `.claude/plans` | deploy: `manual`

---

## 使用方式

```
# 完整流程
用 full-pipeline，需求是：计算器增加除法运算，要处理除零错误

# 从 Issue 开始
用 full-pipeline 实现 #3

# 只做部分阶段
用 full-pipeline 从阶段 3 开始（spec 已有）
```

## 配置文件

```
.github/pipeline.json                  ← 项目配置（单一真实来源）
.claude/
├── skills/full-pipeline.md            ← 本文件（总调度 Skill）
├── workflows/
│   ├── ci-watcher.js                  ← CI 监控 + 自动修复
│   └── implementation-pipeline.js     ← 多任务实现流水线
├── agents/
│   ├── requirement-analyst.md         ← 需求分析 Agent
│   ├── implementer.md                 ← 代码实现 Agent
│   └── code-reviewer.md               ← 代码审查 Agent
└── plans/                             ← 自动生成的 spec/plan
```
