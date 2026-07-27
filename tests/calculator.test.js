import test from 'node:test';
import assert from 'node:assert/strict';
import {
  add,
  subtract,
  multiply,
  divide,
  modulo,
  convertBase
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

test('modulo: 10 % 3 应等于 1', () => {
  assert.equal(modulo(10, 3), 1);
});

test('modulo: 15 % 5 应等于 0', () => {
  assert.equal(modulo(15, 5), 0);
});

test('modulo: 0 % 7 应等于 0', () => {
  assert.equal(modulo(0, 7), 0);
});

test('modulo: 7 % 0 应抛出错误', () => {
  assert.throws(() => modulo(7, 0), /除数不能为零/);
});

test('modulo: 负数取余 -10 % 3 应等于 -1', () => {
  assert.equal(modulo(-10, 3), -1);
});

// ========== 进制转换测试 ==========

test('convertBase: 十进制 255 → 十六进制 FF', () => {
  assert.equal(convertBase(255, 10, 16), 'FF');
});

test('convertBase: 二进制 1010 → 十进制 10', () => {
  assert.equal(convertBase('1010', 2, 10), '10');
});

test('convertBase: 十六进制 FF → 二进制', () => {
  assert.equal(convertBase('FF', 16, 2), '11111111');
});

test('convertBase: 八进制 77 → 十进制 63', () => {
  assert.equal(convertBase('77', 8, 10), '63');
});

test('convertBase: 同进制转换 十进制 42 → 42', () => {
  assert.equal(convertBase(42, 10, 10), '42');
});

test('convertBase: 零值转换', () => {
  assert.equal(convertBase(0, 10, 2), '0');
  assert.equal(convertBase('0', 2, 16), '0');
});

test('convertBase: 大数值 十六进制 → 十进制', () => {
  assert.equal(convertBase('DEADBEEF', 16, 10), '3735928559');
});

test('convertBase: 36进制边界测试', () => {
  assert.equal(convertBase('Z', 36, 10), '35');
  assert.equal(convertBase(35, 10, 36), 'Z');
});

test('convertBase: 源进制非法（<2）应抛出错误', () => {
  assert.throws(
    () => convertBase(10, 1, 10),
    /源进制必须在 2-36 之间/
  );
});

test('convertBase: 源进制非法（>36）应抛出错误', () => {
  assert.throws(
    () => convertBase(10, 37, 10),
    /源进制必须在 2-36 之间/
  );
});

test('convertBase: 目标进制非法（<2）应抛出错误', () => {
  assert.throws(
    () => convertBase(10, 10, 0),
    /目标进制必须在 2-36 之间/
  );
});

test('convertBase: 目标进制非法（>36）应抛出错误', () => {
  assert.throws(
    () => convertBase(10, 10, 40),
    /目标进制必须在 2-36 之间/
  );
});

test('convertBase: 非整数进制应抛出错误', () => {
  assert.throws(
    () => convertBase(10, 10.5, 16),
    /源进制必须在 2-36 之间/
  );
});

test('convertBase: 无效的源进制数值', () => {
  assert.throws(
    () => convertBase('GHI', 16, 10),
    /不是有效的 16 进制数/
  );
});

test('convertBase: 二进制含非法字符', () => {
  assert.throws(
    () => convertBase('102', 2, 10),
    /不是有效的 2 进制数/
  );
});

test('convertBase: 字符串形式的十进制数值', () => {
  assert.equal(convertBase('100', 10, 2), '1100100');
});

test('convertBase: 负数转换', () => {
  assert.equal(convertBase(-10, 10, 16), '-A');
});
