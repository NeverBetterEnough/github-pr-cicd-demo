export const meta = {
  name: 'ci-watcher',
  description: 'Watch CI status for a PR — poll until pass/fail, auto-fix on failure, report status',
  phases: [
    { title: 'Check CI' },
    { title: 'Analyze failures' },
    { title: 'Apply fixes' },
    { title: 'Re-check' },
  ],
}

// args: { prNumber: string, maxRetries?: number }
const pr = args.prNumber
const maxRetries = args.maxRetries || 3
let retries = 0

async function checkCI() {
  const result = await agent(
    `Run this exact command and report the result:
     gh pr checks ${pr} --json name,state,bucket

     Parse the JSON. Return one word:
     - "pass" if ALL checks have state=COMPLETE and bucket=pass, AND there is at least one check
     - "fail" if ANY check has state=COMPLETE and bucket=fail
     - "pending" if ANY check has state=PENDING or IN_PROGRESS or QUEUED, and none are failed
     - "none" if there are zero checks`,
    { model: 'haiku', effort: 'low' }
  )
  return result.trim().toLowerCase()
}

// Main loop
while (retries <= maxRetries) {
  phase('Check CI')
  const status = await checkCI()

  if (status === 'pass') {
    log('✅ All CI checks passed!')
    return { outcome: 'pass', retries }
  }

  if (status === 'none') {
    log('⏳ No CI checks found yet — waiting for GitHub Actions to start...')
    retries++
    continue
  }

  if (status === 'pending') {
    log(`⏳ CI still running... (attempt ${retries + 1}/${maxRetries + 1})`)
    retries++
    continue
  }

  if (status === 'fail') {
    log(`❌ CI failed — analyzing failures (attempt ${retries + 1}/${maxRetries + 1})`)

    phase('Analyze failures')
    const analysis = await agent(
      `CI checks failed for PR #${pr}. Run these commands:

       1. gh pr checks ${pr} --json name,state,bucket,failureReason
       2. For each FAILED check, run: gh pr view ${pr} --json statusCheckRollup

       Analyze the failures and return a structured response with:
       - List of failed checks and their reasons
       - For each: can this be auto-fixed? (true/false)
       - For auto-fixable: the exact fix needed

       The project uses: npm test (Node.js built-in test runner), npm run build`,
      { model: 'sonnet', schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          failures: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                check: { type: 'string' },
                reason: { type: 'string' },
                autoFixable: { type: 'boolean' },
                fixDescription: { type: 'string' },
              },
              required: ['check', 'reason', 'autoFixable', 'fixDescription'],
            },
          },
        },
        required: ['summary', 'failures'],
      }})

    const fixable = analysis.failures.filter(f => f.autoFixable)
    const unfixable = analysis.failures.filter(f => !f.autoFixable)

    if (unfixable.length > 0) {
      log(`⚠️ ${unfixable.length} failures cannot be auto-fixed:`)
      for (const f of unfixable) {
        log(`  - ${f.check}: ${f.reason}`)
      }
    }

    if (fixable.length === 0) {
      log('❌ No auto-fixable failures — manual intervention required')
      return { outcome: 'fail', failures: analysis.failures, retries }
    }

    phase('Apply fixes')
    for (const f of fixable) {
      log(`🔧 Fixing: ${f.check}`)
      await agent(
        `A CI check "${f.check}" failed with reason: ${f.reason}

         Fix: ${f.fixDescription}

         After fixing:
         1. Run "npm test" to verify
         2. Run "npm run build" to verify
         3. git add -A
         4. git commit -m "fix: ${f.fixDescription}"
         5. git push

         Do NOT change any behavior — only fix what's needed for CI to pass.
         If the fix would change behavior, stop and report what's happening instead.`,
        { model: 'sonnet' }
      )
    }

    phase('Re-check')
    log('🔁 Fixes pushed — checking CI again...')
    retries++
    continue
  }

  // Unknown status
  log(`Unexpected CI status: ${status}`)
  return { outcome: 'unknown', status, retries }
}

// Exhausted retries
if (retries > maxRetries) {
  log(`⏰ Exhausted ${maxRetries + 1} check attempts — CI may still be running`)
  return { outcome: 'timeout', retries }
}
