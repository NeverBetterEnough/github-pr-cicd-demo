# GitHub PR + CI/CD 体验项目

这是一个无第三方运行时依赖的迷你计算器，用来练习：

- feature 分支开发
- Pull Request
- GitHub Actions 自动测试和构建
- main 分支保护
- 合并后自动发布到 GitHub Pages
- 🤖 Claude Code 全自动开发流水线

## 本地运行

```bash
npm install
npm test
npm run build
npm run check          # test + build 一起跑
```

直接用浏览器打开 `src/index.html` 即可体验页面。

---

## 🤖 全自动开发流水线

本项目配置了 Claude Code 全自动流水线，从需求到部署一键完成：

```
需求描述 → 需求分析 → 方案设计 → 代码实现 → 创建PR → CI监控 → 合并 → 部署
```

### 快速使用

```bash
# 在 Claude Code 对话中说：
用 full-pipeline，需求是：计算器增加除法运算，处理除零错误
```

流水线会：
1. **需求分析** — 自动生成结构化 spec，识别边界情况
2. **方案设计** — 生成实现计划，**需要你确认架构决策**
3. **代码实现** — 自动创建分支、编写代码、运行测试、提交
4. **代码审查** — 自动审查每一处修改，发现问题自动修复
5. **创建 PR** — 自动生成 PR 描述，推送到 GitHub
6. **CI 监控** — 自动等待 CI 完成，失败时自动分析并修复
7. **合并部署** — CI 通过后**询问你确认**，然后自动合并和部署

### 审批门

| 阶段 | 谁决定 |
|------|--------|
| 方案设计 → 代码实现 | 👤 你确认计划 |
| CI 通过 → 合并 | 👤 你确认合并 |
| 合并 → 部署 | 🤖 自动（GitHub Actions） |

### 流水线组件

```
.claude/
├── skills/full-pipeline.md          ← 总调度 Skill
├── workflows/
│   ├── ci-watcher.js                ← CI 监控 + 自动修复
│   └── implementation-pipeline.js   ← 多任务实现流水线
├── agents/
│   ├── requirement-analyst.md       ← 需求分析 Agent
│   ├── implementer.md               ← 代码实现 Agent
│   └── code-reviewer.md             ← 代码审查 Agent
└── plans/                           ← 自动生成的 spec/plan

.github/workflows/
├── cicd.yml                         ← CI/CD 流水线（测试→构建→部署）
└── auto-approve.yml                 ← PR 评论触发自动合入

scripts/deploy/
├── verify.sh                        ← 部署后健康检查
└── pre-deploy-check.js              ← 部署前检查清单
```

### CI/CD 流程

```
PR 创建 → GitHub Actions 自动运行测试和构建
         → CI 评论到 PR（测试结果 + 构建产物链接）
         → 评论 "merge" 触发自动合入
         → 合并到 main → 自动部署到 GitHub Pages
         → 部署后健康检查
```

### 可用的 npm scripts

```bash
npm test              # 运行测试
npm run build         # 构建站点
npm run check         # test + build
npm run predeploy     # 部署前检查清单
npm run deploy:verify # 部署后健康检查
```
