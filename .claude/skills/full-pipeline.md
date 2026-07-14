---
name: full-pipeline
description: 全自动开发流水线：需求分析 → 方案设计 → 代码实现 → PR 创建 → CI 监控 → 自动合入 → 部署
---

# Full Pipeline — 全自动开发流水线

从一句需求描述到部署上线的端到端自动化流程。

## ⛔ 人工审批门

整个流程有两个审批门，其余全自动：

| 阶段 | 审批 | 原因 |
|------|:---:|------|
| 方案设计 → 代码实现 | **需确认** | 架构决策必须人来拍板 |
| CI 通过 → 合并到 main | **需确认** | 合入主干有风险 |
| 合并 → 部署 | **自动** | CI 已通过 = 可部署（非生产环境） |

---

## 流程

### 阶段 0: 收集需求

1. 如果用户提到 Issue 编号，执行 `gh issue view <number>` 读取需求
2. 如果用户直接描述需求，以此为输入
3. 确认 base 分支（默认 `main`）
4. 用 slugify 将需求浓缩为 feature-slug（如 `add-division-support`）

### 阶段 1: 需求分析

派 `requirement-analyst` Agent：

```
Agent(
  subagent_type="requirement-analyst",
  model="opus",
  prompt="分析以下需求，生成结构化规格说明：

需求：[用户的需求描述]

当前项目：[简要描述项目]
- 输出 spec 到 .claude/plans/spec-<feature-slug>.md
- 包含：验收标准、边界情况、技术设计、任务拆解、测试计划"
)
```

读取生成的 spec，检查 `NEEDS_CLARIFICATION`：
- 有疑问 → 带着问题向用户确认，暂停流程
- 无疑问 → 进入阶段 2

### 阶段 2: 方案设计

1. 将 spec 内容展示给用户
2. 派 Plan Agent 生成实现计划：

```
Agent(
  subagent_type="Plan",
  model="sonnet",
  prompt="根据以下 spec 生成实现计划：

[粘贴 spec 的关键内容]

生成 plan.md 到 .claude/plans/plan-<feature-slug>.md
包含：要修改的文件列表、任务顺序、依赖关系、风险点"
)
```

3. ⛔ **询问用户确认计划**，展示：
   - 要修改的文件
   - 任务列表
   - 关键技术决策
   
   用户可以要求修改，直到满意。

### 阶段 3: 代码实现

用户确认后，自动执行实现流水线：

```
Workflow(
  name="implementation-pipeline",
  args={
    tasks: [从 spec 中提取的任务列表],
    baseBranch: "main"
  }
)
```

内部流程（每个任务）：
1. 创建 feature 分支
2. 派 `implementer` Agent 实现 → 测试 → 提交
3. 派 `code-reviewer` Agent 审查
4. 有 Critical/Important 问题 → 修复 → 再审查
5. 通过 → 下一任务

### 阶段 4: 创建 Pull Request

所有任务通过后：

1. 生成 PR 描述：

```
Agent(
  model="sonnet",
  prompt="根据 .claude/plans/spec-<slug>.md 和 
   git log main..HEAD --oneline 的输出，
   生成一份结构化的 PR 描述。

   格式：
   ## Summary
   ## Changes
   ## Testing
   ## Screenshots (if UI changes)"
)
```

2. Push 并创建 PR：

```bash
git push -u origin HEAD
gh pr create \
  --title "feat: <feature summary>" \
  --body "<PR description>" \
  --base main
```

3. 通知用户 PR 链接

### 阶段 5: CI 监控 + 自动修复

PR 创建后，监控 CI：

```
Workflow(
  name="ci-watcher",
  args={
    prNumber: <PR_NUMBER>,
    maxRetries: 5
  }
)
```

- CI pending → 持续轮询（每轮约 30-60 秒）
- CI fail → 自动分析失败原因 → 尝试修复 → push → 重新等待
- 无法自动修复 → 报告用户，暂停
- CI pass → 进入审批门

### 阶段 6: 审查 + 合入

CI 通过后，⛔ **询问用户**：

"PR #N 的 CI 已全部通过。以下是最终变更摘要：
- [文件变更列表]
- [测试结果]

是否合并到 main？[合并 / 查看详情 / 拒绝]"

用户确认合并后：

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
git checkout main
git pull
```

### 阶段 7: 部署

合并到 main 后，GitHub Actions 自动触发部署（`cicd.yml` 中的 deploy job）。

验证部署：

```bash
# 等待部署完成
gh run list --workflow=cicd.yml --limit=1 --json status,conclusion

# 如果部署成功，健康检查
curl -s -o /dev/null -w "%{http_code}" <deployment-url>
```

通知用户部署结果。

---

## 使用方式

```
# 完整流程
用 full-pipeline，需求是：计算器增加除法运算，要处理除零错误

# 从 Issue 开始
用 full-pipeline 实现 #3

# 只做部分阶段
用 full-pipeline 从阶段 3 开始（spec 已有）
用 full-pipeline 只跑 CI 监控和合并
```

---

## 文件结构

```
.claude/
├── skills/full-pipeline.md          ← 本文件（总调度 Skill）
├── workflows/
│   ├── ci-watcher.js                ← CI 监控 + 自动修复
│   └── implementation-pipeline.js   ← 多任务实现流水线
├── agents/
│   ├── requirement-analyst.md       ← 需求分析 Agent
│   ├── implementer.md               ← 代码实现 Agent
│   └── code-reviewer.md             ← 代码审查 Agent
└── plans/                           ← 自动生成的 spec/plan/review 文件
    ├── spec-<slug>.md
    ├── plan-<slug>.md
    └── review-<task-id>.diff
```
