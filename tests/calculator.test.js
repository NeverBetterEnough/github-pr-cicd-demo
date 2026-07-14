import test from 'node:test';
import assert from 'node:assert/strict';
import {
  add,
  subtract,
  multiply,
  divide
} from '../src/calculator.js';

test('add: 2 + 3 应等于 5', () => {
  assert.equal(add(2, 3), 5);
});

test('subtract: 8 - 3 应等于 5', () => {
  assert.equal(subtract(8, 3), 5);
});

test('multiply: 3 × 4 应等于 12', () => {
  assert.equal(multiply(3, 4), 12);
});

test('divide: 8 / 2 应等于 4', () => {
  assert.equal(divide(8, 2), 4);
});

test('divide: 0 / 5 应等于 0', () => {
  assert.equal(divide(0, 5), 0);
});

test('divide: 8 / 0 应抛出错误', () => {
  assert.throws(() => divide(8, 0), /除数不能为零/);
});

test('divide: 负数除法 -6 / 3 应等于 -2', () => {
  assert.equal(divide(-6, 3), -2);
});

test('divide: 浮点数除法 1 / 3', () => {
  assert.equal(divide(1, 3), 1 / 3);
});


