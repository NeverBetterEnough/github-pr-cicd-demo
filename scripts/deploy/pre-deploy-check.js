// Pre-deployment checklist — run before triggering deployment
// Verifies: tests pass, build succeeds, no uncommitted changes, branch is main

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, status: 'pass', detail: result });
    console.log(`  ✅ ${name}`);
  } catch (err) {
    checks.push({ name, status: 'fail', detail: err.message });
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

console.log('🔍 Pre-Deployment Checklist\n');

// 1. On main branch
check('On main branch', () => {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (branch !== 'main') throw new Error(`Current branch is "${branch}", expected "main"`);
  return branch;
});

// 2. Working tree clean
check('Working tree clean', () => {
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (status) throw new Error('Uncommitted changes present:\n' + status);
  return 'clean';
});

// 3. Synced with remote
check('Synced with remote', () => {
  execSync('git fetch origin main', { encoding: 'utf8' });
  const local = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const remote = execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
  if (local !== remote) throw new Error('Local main differs from origin/main');
  return local.slice(0, 7);
});

// 4. Tests pass
check('Tests pass', () => {
  execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
  return 'all passing';
});

// 5. Build succeeds
check('Build succeeds', () => {
  execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  return 'dist/ generated';
});

// 6. Dist not empty
check('Build output non-empty', () => {
  const files = readdirSync('dist');
  if (files.length === 0) throw new Error('dist/ is empty');
  return `${files.length} files`;
});

// 7. Last CI run on main was successful
check('Last CI run passed', () => {
  try {
    const result = execSync(
      'gh run list --workflow=cicd.yml --branch=main --limit=1 --json conclusion --jq ".[0].conclusion"',
      { encoding: 'utf8' }
    ).trim();
    if (result !== 'success') throw new Error(`Last CI conclusion: ${result}`);
    return result;
  } catch (err) {
    if (err.message && err.message.includes('gh:')) throw new Error('gh CLI not available — skip this check in local dev');
    throw err;
  }
});

// Summary
console.log('');
const failed = checks.filter(c => c.status === 'fail');
if (failed.length > 0) {
  console.log(`❌ ${failed.length}/${checks.length} checks FAILED`);
  console.log('Fix the issues above before deploying.');
  process.exit(1);
} else {
  console.log(`✅ All ${checks.length} checks passed — ready to deploy!`);
}
