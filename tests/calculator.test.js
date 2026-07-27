import test from 'node:test';
import assert from 'node:assert/strict';
import {
  add, subtract, multiply, divide, modulo,
  power, sqrt, cbrt, log10, ln, square, reciprocal, factorial,
  sin, cos, tan,
  convertBase
} from '../src/calculator.js';

// ========== 基础运算 ==========

test('add: 2 + 3 应等于 5', () => assert.equal(add(2, 3), 5));
test('subtract: 8 - 3 应等于 5', () => assert.equal(subtract(8, 3), 5));
test('multiply: 3 × 4 应等于 12', () => assert.equal(multiply(3, 4), 12));
test('divide: 8 / 2 应等于 4', () => assert.equal(divide(8, 2), 4));
test('divide: 0 / 5 应等于 0', () => assert.equal(divide(0, 5), 0));
test('divide: 8 / 0 应抛出错误', () => assert.throws(() => divide(8, 0), /除数不能为零/));
test('divide: 负数除法 -6 / 3 应等于 -2', () => assert.equal(divide(-6, 3), -2));
test('divide: 浮点数除法 1 / 3', () => assert.equal(divide(1, 3), 1 / 3));
test('modulo: 10 % 3 应等于 1', () => assert.equal(modulo(10, 3), 1));
test('modulo: 15 % 5 应等于 0', () => assert.equal(modulo(15, 5), 0));
test('modulo: 0 % 7 应等于 0', () => assert.equal(modulo(0, 7), 0));
test('modulo: 7 % 0 应抛出错误', () => assert.throws(() => modulo(7, 0), /除数不能为零/));
test('modulo: 负数取余 -10 % 3 应等于 -1', () => assert.equal(modulo(-10, 3), -1));

// ========== 高级运算 ==========

test('power: 2^3 应等于 8', () => assert.equal(power(2, 3), 8));
test('power: 5^0 应等于 1', () => assert.equal(power(5, 0), 1));
test('power: 2^(-1) 应等于 0.5', () => assert.equal(power(2, -1), 0.5));

test('sqrt: √16 应等于 4', () => assert.equal(sqrt(16), 4));
test('sqrt: √0 应等于 0', () => assert.equal(sqrt(0), 0));
test('sqrt: √(-1) 应抛出错误', () => assert.throws(() => sqrt(-1), /不能对负数开平方根/));

test('cbrt: ³√27 应等于 3', () => assert.equal(cbrt(27), 3));
test('cbrt: ³√(-8) 应等于 -2', () => assert.equal(cbrt(-8), -2));

test('log10: log₁₀(100) 应等于 2', () => assert.equal(log10(100), 2));
test('log10: log₁₀(1) 应等于 0', () => assert.equal(log10(1), 0));
test('log10: log₁₀(0) 应抛出错误', () => assert.throws(() => log10(0), /对数参数必须大于 0/));
test('log10: log₁₀(-5) 应抛出错误', () => assert.throws(() => log10(-5), /对数参数必须大于 0/));

test('ln: ln(e) 应接近 1', () => assert.ok(Math.abs(ln(Math.E) - 1) < 1e-10));
test('ln: ln(1) 应等于 0', () => assert.equal(ln(1), 0));
test('ln: ln(0) 应抛出错误', () => assert.throws(() => ln(0), /对数参数必须大于 0/));

test('square: 5² 应等于 25', () => assert.equal(square(5), 25));
test('square: (-3)² 应等于 9', () => assert.equal(square(-3), 9));

test('reciprocal: 1/4 应等于 0.25', () => assert.equal(reciprocal(4), 0.25));
test('reciprocal: 1/(-2) 应等于 -0.5', () => assert.equal(reciprocal(-2), -0.5));
test('reciprocal: 1/0 应抛出错误', () => assert.throws(() => reciprocal(0), /不能除以零/));

test('factorial: 0! 应等于 1', () => assert.equal(factorial(0), 1));
test('factorial: 1! 应等于 1', () => assert.equal(factorial(1), 1));
test('factorial: 5! 应等于 120', () => assert.equal(factorial(5), 120));
test('factorial: 10! 应等于 3628800', () => assert.equal(factorial(10), 3628800));
test('factorial: (-1)! 应抛出错误', () => assert.throws(() => factorial(-1), /阶乘只支持非负整数/));
test('factorial: 3.5! 应抛出错误', () => assert.throws(() => factorial(3.5), /阶乘只支持非负整数/));

test('sin: sin(0°) 应等于 0', () => assert.ok(Math.abs(sin(0)) < 1e-10));
test('sin: sin(90°) 应等于 1', () => assert.ok(Math.abs(sin(90) - 1) < 1e-10));
test('sin: sin(30°) 应等于 0.5', () => assert.ok(Math.abs(sin(30) - 0.5) < 1e-10));

test('cos: cos(0°) 应等于 1', () => assert.ok(Math.abs(cos(0) - 1) < 1e-10));
test('cos: cos(60°) 应等于 0.5', () => assert.ok(Math.abs(cos(60) - 0.5) < 1e-10));
test('cos: cos(90°) 应接近 0', () => assert.ok(Math.abs(cos(90)) < 1e-10));

test('tan: tan(0°) 应等于 0', () => assert.ok(Math.abs(tan(0)) < 1e-10));
test('tan: tan(45°) 应接近 1', () => assert.ok(Math.abs(tan(45) - 1) < 1e-10));
test('tan: tan(90°) 应抛出错误', () => assert.throws(() => tan(90), /tan 在该角度无定义/));

// ========== 进制转换 ==========

test('convertBase: 十进制 255 → 十六进制 FF', () => assert.equal(convertBase(255, 10, 16), 'FF'));
test('convertBase: 二进制 1010 → 十进制 10', () => assert.equal(convertBase('1010', 2, 10), '10'));
test('convertBase: 十六进制 FF → 二进制', () => assert.equal(convertBase('FF', 16, 2), '11111111'));
test('convertBase: 八进制 77 → 十进制 63', () => assert.equal(convertBase('77', 8, 10), '63'));
test('convertBase: 同进制转换 十进制 42 → 42', () => assert.equal(convertBase(42, 10, 10), '42'));
test('convertBase: 零值转换', () => {
  assert.equal(convertBase(0, 10, 2), '0');
  assert.equal(convertBase('0', 2, 16), '0');
});
test('convertBase: 大数值 十六进制 → 十进制', () => assert.equal(convertBase('DEADBEEF', 16, 10), '3735928559'));
test('convertBase: 36进制边界测试', () => {
  assert.equal(convertBase('Z', 36, 10), '35');
  assert.equal(convertBase(35, 10, 36), 'Z');
});
test('convertBase: 源进制非法（<2）应抛出错误', () => assert.throws(() => convertBase(10, 1, 10), /源进制必须在 2-36 之间/));
test('convertBase: 源进制非法（>36）应抛出错误', () => assert.throws(() => convertBase(10, 37, 10), /源进制必须在 2-36 之间/));
test('convertBase: 目标进制非法（<2）应抛出错误', () => assert.throws(() => convertBase(10, 10, 0), /目标进制必须在 2-36 之间/));
test('convertBase: 目标进制非法（>36）应抛出错误', () => assert.throws(() => convertBase(10, 10, 40), /目标进制必须在 2-36 之间/));
test('convertBase: 非整数进制应抛出错误', () => assert.throws(() => convertBase(10, 10.5, 16), /源进制必须在 2-36 之间/));
test('convertBase: 无效的源进制数值', () => assert.throws(() => convertBase('GHI', 16, 10), /不是有效的 16 进制数/));
test('convertBase: 二进制含非法字符', () => assert.throws(() => convertBase('102', 2, 10), /不是有效的 2 进制数/));
test('convertBase: 字符串形式的十进制数值', () => assert.equal(convertBase('100', 10, 2), '1100100'));
test('convertBase: 负数转换', () => assert.equal(convertBase(-10, 10, 16), '-A'));
