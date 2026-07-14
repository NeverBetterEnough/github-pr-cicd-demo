import test from 'node:test';
import assert from 'node:assert/strict';
import { add, subtract } from '../src/calculator.js';

test('add: 2 + 3 应等于 5', () => {
  assert.equal(add(2, 3), 5);
});

test('subtract: 8 - 3 应等于 5', () => {
  assert.equal(subtract(8, 3), 5);
});
