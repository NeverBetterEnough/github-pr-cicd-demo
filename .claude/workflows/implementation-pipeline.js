export const meta = {
  name: 'implementation-pipeline',
  description: 'Run subagent-driven development for multiple tasks: implement → review → fix → re-review',
  phases: [
    { title: 'Setup' },
    { title: 'Implement' },
    { title: 'Review' },
    { title: 'Fix' },
    { title: 'Finalize' },
  ],
}

// args: { tasks: [{ id, title, description, files }], baseBranch: string, featureSlug?: string }
const tasks = args.tasks || []
const baseBranch = args.baseBranch || 'main'
const featureSlug = args.featureSlug || tasks.map(t => t.id).join('-')

if (tasks.length === 0) {
  log('No tasks to implement')
  return { results: [] }
}

phase('Setup')
// Generate branch name from task IDs (Date.now is unavailable in Workflow sandbox)
const branchName = `feature/${featureSlug}`
log(`Branch: ${branchName}`)

await agent(
  `Create and switch to a new branch:
   git checkout -b ${branchName}
   git push -u origin ${branchName}`,
  { model: 'haiku', effort: 'low' }
)

const results = []

for (const task of tasks) {
  phase('Implement')
  log(`📝 Task ${task.id}: ${task.title}`)

  const BASE = await agent(
    `Run: git rev-parse HEAD
     Return ONLY the commit hash.`,
    { model: 'haiku', effort: 'low' }
  )

  const impl = await agent(
    `You are an implementer. Your task:

     TASK: ${task.title}
     DESCRIPTION: ${task.description}
     FILES INVOLVED: ${task.files?.join(', ') || 'read the codebase to determine'}

     Process:
     1. Read the files you need to modify
     2. Write tests first
     3. Implement the changes
     4. Run "npm test" — all tests must pass
     5. Run "npm run build" to verify build
     6. Self-review your diff
     7. git add -A && git commit -m "feat: ${task.title}"
     8. git push

     IMPORTANT:
     - Follow the existing code style exactly
     - Do NOT change unrelated code
     - Every new function must handle edge cases
     - Use conventional commit format

     Return: status (DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED),
     commit hash, test summary, and any concerns.`,
    { model: 'sonnet', agentType: 'implementer' }
  )

  const implStatus = impl?.status || impl?.trim() || 'UNKNOWN'
  log(`  Status: ${implStatus}`)

  if (implStatus.includes('NEEDS_CONTEXT') || implStatus.includes('BLOCKED')) {
    results.push({ task: task.id, status: implStatus, detail: impl })
    log(`  ⚠️ Task ${task.id} needs attention — breaking pipeline`)
    break
  }

  phase('Review')
  log(`  🔍 Reviewing task ${task.id}...`)

  const HEAD = await agent(
    `Run: git rev-parse HEAD. Return ONLY the commit hash.`,
    { model: 'haiku', effort: 'low' }
  )

  // Generate review package
  const reviewPackage = await agent(
    `Run these commands:
     git diff ${BASE.trim()}..${HEAD.trim()} --stat
     git diff ${BASE.trim()}..${HEAD.trim()} -U10

     Write the FULL output to .claude/plans/review-${task.id}.diff

     Return: "written" if successful`,
    { model: 'haiku', effort: 'low' }
  )

  const review = await agent(
    `Review this task implementation.

     TASK: ${task.title}
     DESCRIPTION: ${task.description}

     Read the diff file at: .claude/plans/review-${task.id}.diff
     Read the full source files mentioned in the diff.

     Run "npm test" to verify tests pass.

     Return your review as a structured object with:
     - specCompliance: "PASS" or "FAIL" (with reasons)
     - codeQuality: "Approved" or "Needs Fixes" (with why)
     - findings: array of { file, line, severity, category, summary, detail, fix }`,
    { model: 'sonnet', agentType: 'code-reviewer', schema: {
      type: 'object',
      properties: {
        specCompliance: { type: 'string' },
        specComplianceReasons: { type: 'string' },
        codeQuality: { type: 'string' },
        codeQualityReasons: { type: 'string' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              severity: { type: 'string' },
              category: { type: 'string' },
              summary: { type: 'string' },
              detail: { type: 'string' },
              fix: { type: 'string' },
            },
          },
        },
      },
      required: ['specCompliance', 'codeQuality', 'findings'],
    }})

  log(`    Spec: ${review.specCompliance} | Quality: ${review.codeQuality}`)

  const criticalFindings = review.findings.filter(
    f => f.severity === 'critical' || f.severity === 'important'
  )

  if (criticalFindings.length > 0) {
    log(`    ⚠️ ${criticalFindings.length} critical/important findings — fixing...`)

    phase('Fix')
    const fixResult = await agent(
      `Fix the following review findings for task "${task.title}":

      ${criticalFindings.map((f, i) => `${i + 1}. [${f.severity}] ${f.file}:${f.line} — ${f.summary}\n   Fix: ${f.fix}`).join('\n')}

      After fixing ALL findings:
      1. Run "npm test" — must pass
      2. Run "npm run build" — must pass
      3. git add -A && git commit -m "fix: address review findings for ${task.title}"
      4. git push

      Return: status and commit hash.`,
      { model: 'sonnet' }
    )
    log(`    Fix status: ${fixResult?.trim() || 'done'}`)

    // Quick re-review of fixes
    const reReview = await agent(
      `Re-review ONLY the fix commit for task "${task.title}".
       Run: git diff HEAD~1..HEAD -U10
       Verify: are the critical/important findings actually fixed?
       Return: "PASS" if all fixed, or "FAIL: <remaining issues>" if not.`,
      { model: 'sonnet' }
    )
    log(`    Re-review: ${reReview?.trim() || 'done'}`)
  }

  results.push({
    task: task.id,
    title: task.title,
    status: 'DONE',
    specCompliance: review.specCompliance,
    codeQuality: review.codeQuality,
    findings: review.findings,
  })
  log(`  ✅ Task ${task.id} complete`)
}

phase('Finalize')
log(`\n📊 Pipeline complete: ${results.filter(r => r.status === 'DONE').length}/${tasks.length} tasks done`)

return {
  branch: branchName,
  results,
  summary: `${results.filter(r => r.status === 'DONE').length}/${tasks.length} tasks completed`,
}
