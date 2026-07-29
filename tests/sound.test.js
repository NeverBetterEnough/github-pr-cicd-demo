import test from 'node:test';
import assert from 'node:assert/strict';
import { playClickSound } from '../src/sound.js';

// ========== 模块导出 ==========

test('playClickSound: 应导出为函数', () => {
  assert.equal(typeof playClickSound, 'function');
});

// ========== 静默降级 ==========

test('playClickSound: 在无 AudioContext 环境（Node.js）调用不抛错', () => {
  assert.doesNotThrow(() => playClickSound());
});

test('playClickSound: 多次调用不抛错', () => {
  for (let i = 0; i < 10; i++) {
    assert.doesNotThrow(() => playClickSound());
  }
});

test('playClickSound: 返回 undefined（无 AudioContext 时）', () => {
  assert.equal(playClickSound(), undefined);
});
