import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, '..', 'src', 'style.css'), 'utf8');

function extractRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 's');
  const match = css.match(re);
  if (!match) return null;
  return match[1];
}

function getProp(ruleText, property) {
  const re = new RegExp(`${property}\\s*:\\s*([^;]+);?`, 'i');
  const match = ruleText?.match(re);
  return match ? match[1].trim() : null;
}

function pxValue(value) {
  if (!value) return null;
  return parseFloat(value.replace('px', '').trim());
}

// ========== Calculator size tests ==========

test('calculator container should have minimum width of 400px', () => {
  const rule = extractRule('.calculator');
  const width = pxValue(getProp(rule, 'width'));
  assert.ok(width !== null, '.calculator should have a width property');
  assert.ok(width >= 400, `.calculator width should be >= 400px, got ${width}px`);
});

test('calculator container should have minimum padding of 18px', () => {
  const rule = extractRule('.calculator');
  const padding = pxValue(getProp(rule, 'padding'));
  assert.ok(padding !== null, '.calculator should have a padding property');
  assert.ok(padding >= 18, `.calculator padding should be >= 18px, got ${padding}px`);
});

test('display should have minimum font-size of 46px', () => {
  const rule = extractRule('.display');
  const fontSize = pxValue(getProp(rule, 'font-size'));
  assert.ok(fontSize !== null, '.display should have a font-size property');
  assert.ok(fontSize >= 46, `.display font-size should be >= 46px, got ${fontSize}px`);
});

test('buttons should have minimum height of 56px', () => {
  const rule = extractRule('.buttons button, .adv-buttons button');
  const height = pxValue(getProp(rule, 'height'));
  assert.ok(height !== null, 'buttons should have a height property');
  assert.ok(height >= 56, `button height should be >= 56px, got ${height}px`);
});

test('buttons should have minimum font-size of 22px', () => {
  const rule = extractRule('.buttons button, .adv-buttons button');
  const fontSize = pxValue(getProp(rule, 'font-size'));
  assert.ok(fontSize !== null, 'buttons should have a font-size property');
  assert.ok(fontSize >= 22, `button font-size should be >= 22px, got ${fontSize}px`);
});

test('mode buttons should have minimum height of 36px', () => {
  const rule = extractRule('.mode-btn');
  const height = pxValue(getProp(rule, 'height'));
  assert.ok(height !== null, '.mode-btn should have a height property');
  assert.ok(height >= 36, `.mode-btn height should be >= 36px, got ${height}px`);
});

// ========== Button click animation tests ==========

test('btn-pop keyframe animation should exist', () => {
  assert.ok(css.includes('@keyframes btn-pop'), 'CSS should contain @keyframes btn-pop');
});

test('btn-pop class should apply the animation', () => {
  const rule = extractRule('.btn-pop');
  assert.ok(rule !== null, '.btn-pop class should exist');
  const anim = getProp(rule, 'animation');
  assert.ok(anim !== null, '.btn-pop should have an animation property');
  assert.ok(anim.includes('btn-pop'), `.btn-pop animation should reference btn-pop, got: ${anim}`);
});

test('buttons should have transform in transition', () => {
  const rule = extractRule('.buttons button, .adv-buttons button');
  const transition = getProp(rule, 'transition');
  assert.ok(transition !== null, 'buttons should have a transition property');
  assert.ok(transition.includes('transform'), `button transition should include transform, got: ${transition}`);
});

test('buttons should scale down on :active', () => {
  const activeRule = extractRule('.buttons button:active, .adv-buttons button:active');
  assert.ok(activeRule !== null, 'button :active rule should exist');
  const transform = getProp(activeRule, 'transform');
  assert.ok(transform !== null, 'button:active should have a transform property');
  assert.ok(transform.includes('scale'), `button:active transform should include scale, got: ${transform}`);
});

test('mode buttons should have transform transition', () => {
  const rule = extractRule('.mode-btn');
  const transition = getProp(rule, 'transition');
  assert.ok(transition !== null, '.mode-btn should have a transition property');
  assert.ok(transition.includes('transform'), `.mode-btn transition should include transform, got: ${transition}`);
});

test('mode buttons should scale down on :active', () => {
  const activeRule = extractRule('.mode-btn:active');
  assert.ok(activeRule !== null, '.mode-btn:active rule should exist');
  const transform = getProp(activeRule, 'transform');
  assert.ok(transform !== null, '.mode-btn:active should have a transform property');
  assert.ok(transform.includes('scale'), `.mode-btn:active transform should include scale, got: ${transform}`);
});

test('convert button should have transform in transition', () => {
  const rule = extractRule('.btn-convert');
  const transition = getProp(rule, 'transition');
  assert.ok(transition !== null, '.btn-convert should have a transition property');
  assert.ok(transition.includes('transform'), `.btn-convert transition should include transform, got: ${transition}`);
});

// ========== Resize handle tests ==========

test('resize handle should exist and have nwse-resize cursor', () => {
  const rule = extractRule('.resize-handle');
  assert.ok(rule !== null, '.resize-handle class should exist');
  const cursor = getProp(rule, 'cursor');
  assert.ok(cursor !== null, '.resize-handle should have a cursor property');
  assert.equal(cursor, 'nwse-resize', `.resize-handle cursor should be nwse-resize, got: ${cursor}`);
});

test('resize handle should be absolutely positioned', () => {
  const rule = extractRule('.resize-handle');
  const position = getProp(rule, 'position');
  assert.ok(position !== null, '.resize-handle should have a position property');
  assert.equal(position, 'absolute', `.resize-handle position should be absolute, got: ${position}`);
});

test('resize handle should have z-index to stay above content', () => {
  const rule = extractRule('.resize-handle');
  const zIndex = getProp(rule, 'z-index');
  assert.ok(zIndex !== null, '.resize-handle should have a z-index property');
  assert.ok(parseInt(zIndex, 10) >= 1, `.resize-handle z-index should be >= 1, got: ${zIndex}`);
});

test('resize handle should have transition for smooth hover effect', () => {
  const rule = extractRule('.resize-handle');
  const transition = getProp(rule, 'transition');
  assert.ok(transition !== null, '.resize-handle should have a transition property');
  assert.ok(transition.includes('opacity'), `.resize-handle transition should include opacity, got: ${transition}`);
});

test('resize handle hover should increase opacity', () => {
  const rule = extractRule('.resize-handle:hover');
  assert.ok(rule !== null, '.resize-handle:hover rule should exist');
  const opacity = parseFloat(getProp(rule, 'opacity'));
  assert.ok(!isNaN(opacity), '.resize-handle:hover should have an opacity property');
  assert.ok(opacity > 0.5, `.resize-handle:hover opacity should be > 0.5 for visibility, got: ${opacity}`);
});
