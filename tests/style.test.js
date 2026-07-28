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
