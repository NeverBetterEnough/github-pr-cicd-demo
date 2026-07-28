import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MATH_SYMBOLS,
  DEFAULT_PARTICLE_COUNT,
  GRID_SPACING,
  createParticle,
  createParticles,
  updateParticle,
} from '../src/background.js';

// ========== 配置常量 ==========

test('MATH_SYMBOLS 应包含常见数学符号', () => {
  assert.ok(Array.isArray(MATH_SYMBOLS));
  assert.ok(MATH_SYMBOLS.includes('+'));
  assert.ok(MATH_SYMBOLS.includes('π'));
  assert.ok(MATH_SYMBOLS.includes('∑'));
  assert.ok(MATH_SYMBOLS.includes('∫'));
  assert.ok(MATH_SYMBOLS.includes('∞'));
  assert.ok(MATH_SYMBOLS.includes('√'));
});

test('MATH_SYMBOLS 应包含至少 20 个符号', () => {
  assert.ok(MATH_SYMBOLS.length >= 20);
});

test('DEFAULT_PARTICLE_COUNT 应为正整数', () => {
  assert.ok(Number.isInteger(DEFAULT_PARTICLE_COUNT));
  assert.ok(DEFAULT_PARTICLE_COUNT > 0);
});

test('GRID_SPACING 应为正整数', () => {
  assert.ok(Number.isInteger(GRID_SPACING));
  assert.ok(GRID_SPACING > 0);
});

// ========== createParticle ==========

test('createParticle: 生成的粒子应包含所有必需字段', () => {
  const p = createParticle(800, 600);
  assert.ok(typeof p.symbol === 'string');
  assert.ok(MATH_SYMBOLS.includes(p.symbol));
  assert.ok(typeof p.x === 'number');
  assert.ok(typeof p.y === 'number');
  assert.ok(typeof p.vx === 'number');
  assert.ok(typeof p.vy === 'number');
  assert.ok(typeof p.size === 'number');
  assert.ok(typeof p.opacity === 'number');
  assert.ok(typeof p.rotation === 'number');
  assert.ok(typeof p.rotationSpeed === 'number');
  assert.ok(typeof p.switchTimer === 'number');
  assert.ok(typeof p.switchCounter === 'number');
});

test('createParticle: 粒子位置应在画布范围内', () => {
  for (let i = 0; i < 20; i++) {
    const p = createParticle(800, 600);
    assert.ok(p.x >= 0 && p.x <= 800, `x=${p.x} 超出 [0, 800]`);
    assert.ok(p.y >= 0 && p.y <= 600, `y=${p.y} 超出 [0, 600]`);
  }
});

test('createParticle: 粒子速度应在合理范围内', () => {
  for (let i = 0; i < 20; i++) {
    const p = createParticle(800, 600);
    assert.ok(p.vx >= -0.15 && p.vx <= 0.15, `vx=${p.vx} 超出 [-0.15, 0.15]`);
    assert.ok(p.vy >= -0.15 && p.vy <= 0.15, `vy=${p.vy} 超出 [-0.15, 0.15]`);
  }
});

test('createParticle: 字号应在 14–34 之间', () => {
  for (let i = 0; i < 20; i++) {
    const p = createParticle(800, 600);
    assert.ok(p.size >= 14 && p.size <= 34, `size=${p.size} 超出 [14, 34]`);
  }
});

test('createParticle: 透明度应在 0.04–0.10 之间', () => {
  for (let i = 0; i < 20; i++) {
    const p = createParticle(800, 600);
    assert.ok(p.opacity >= 0.04 && p.opacity <= 0.10, `opacity=${p.opacity} 超出 [0.04, 0.10]`);
  }
});

test('createParticle: 每个粒子的符号应来自 MATH_SYMBOLS', () => {
  for (let i = 0; i < 30; i++) {
    const p = createParticle(1024, 768);
    assert.ok(MATH_SYMBOLS.includes(p.symbol), `"${p.symbol}" 不在符号池中`);
  }
});

// ========== createParticles ==========

test('createParticles: 应生成指定数量的粒子', () => {
  assert.equal(createParticles(10, 800, 600).length, 10);
  assert.equal(createParticles(0, 800, 600).length, 0);
  assert.equal(createParticles(50, 800, 600).length, 50);
});

test('createParticles: 默认数量应为 DEFAULT_PARTICLE_COUNT', () => {
  const particles = createParticles(undefined, 800, 600);
  assert.equal(particles.length, DEFAULT_PARTICLE_COUNT);
});

// ========== updateParticle ==========

test('updateParticle: 粒子的 x, y 应随速度变化', () => {
  const p = createParticle(800, 600);
  const oldX = p.x;
  const oldY = p.y;
  // 固定速度以便测试
  p.vx = 0.5;
  p.vy = 0.5;
  updateParticle(p, 800, 600);
  assert.equal(p.x, oldX + 0.5);
  assert.equal(p.y, oldY + 0.5);
});

test('updateParticle: 粒子碰到左边界应反弹', () => {
  const p = createParticle(800, 600);
  p.x = 2;
  p.vx = -5;  // 向左移动
  updateParticle(p, 800, 600);
  assert.ok(p.vx > 0, '碰到左边界后 vx 应为正（向右反弹）');
  assert.ok(p.x >= 0, 'x 不应为负');
});

test('updateParticle: 粒子碰到右边界应反弹', () => {
  const p = createParticle(800, 600);
  p.x = 798;
  p.vx = 5;  // 向右移动
  updateParticle(p, 800, 600);
  assert.ok(p.vx < 0, '碰到右边界后 vx 应为负（向左反弹）');
  assert.ok(p.x <= 800, 'x 不应超过宽度');
});

test('updateParticle: 粒子碰到上边界应反弹', () => {
  const p = createParticle(800, 600);
  p.y = 2;
  p.vy = -5;
  updateParticle(p, 800, 600);
  assert.ok(p.vy > 0, '碰到上边界后 vy 应为正（向下反弹）');
  assert.ok(p.y >= 0, 'y 不应为负');
});

test('updateParticle: 粒子碰到下边界应反弹', () => {
  const p = createParticle(800, 600);
  p.y = 598;
  p.vy = 5;
  updateParticle(p, 800, 600);
  assert.ok(p.vy < 0, '碰到下边界后 vy 应为负（向上反弹）');
  assert.ok(p.y <= 600, 'y 不应超过高度');
});

test('updateParticle: 旋转角度应随 rotationSpeed 变化', () => {
  const p = createParticle(800, 600);
  const oldRotation = p.rotation;
  p.rotationSpeed = 0.01;
  updateParticle(p, 800, 600);
  assert.equal(p.rotation, oldRotation + 0.01);
});

test('updateParticle: switchCounter 应递增', () => {
  const p = createParticle(800, 600);
  const oldCounter = p.switchCounter;
  updateParticle(p, 800, 600);
  assert.equal(p.switchCounter, oldCounter + 1);
});

test('updateParticle: switchCounter 达到阈值时应切换符号并重置', () => {
  const p = createParticle(800, 600);
  p.switchCounter = 999;
  p.switchTimer = 5;
  const oldSymbol = p.symbol;

  // 多次更新，某次应该触发切换
  let switched = false;
  for (let i = 0; i < 10; i++) {
    updateParticle(p, 800, 600);
    if (p.symbol !== oldSymbol) {
      switched = true;
      break;
    }
  }
  assert.ok(switched, '符号应在 switchCounter 超过阈值后切换');
});

test('updateParticle: 切换后的符号应仍在 MATH_SYMBOLS 中', () => {
  const p = createParticle(800, 600);
  p.switchCounter = 999;
  p.switchTimer = 1;
  updateParticle(p, 800, 600); // 触发切换
  assert.ok(MATH_SYMBOLS.includes(p.symbol));
});
