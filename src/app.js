import { add, subtract, multiply, divide, convertBase } from './calculator.js';

const display = document.querySelector('#display');
const modeBtns = document.querySelectorAll('.mode-btn');
const panelCalc = document.querySelector('#panel-calc');
const panelBase = document.querySelector('#panel-base');

let currentMode = 'calc';

// ========== 模式切换 ==========

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    panelCalc.style.display = currentMode === 'calc' ? '' : 'none';
    panelBase.style.display = currentMode === 'base' ? '' : 'none';

    if (currentMode === 'calc') updateDisplay();
    else doConvert();
  });
});

// ========== 标准计算器 ==========

let currentInput = '0';
let previousInput = null;
let pendingOperator = null;
let shouldResetInput = false;

function updateDisplay() {
  if (currentMode !== 'calc') return;
  const num = parseFloat(currentInput);
  if (isNaN(num)) { display.textContent = currentInput; return; }

  if (currentInput.includes('.')) {
    const parts = currentInput.split('.');
    const intPart = parseInt(parts[0], 10);
    if (isNaN(intPart)) { display.textContent = currentInput; return; }
    display.textContent = intPart.toLocaleString('en-US', { maximumFractionDigits: 0 }) + '.' + (parts[1] || '');
  } else {
    const intVal = parseInt(currentInput, 10);
    if (isNaN(intVal)) { display.textContent = currentInput; return; }
    display.textContent = intVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}

function inputDigit(digit) {
  if (shouldResetInput) { currentInput = digit; shouldResetInput = false; }
  else { currentInput = currentInput === '0' ? digit : currentInput + digit; }
  updateDisplay();
}

function inputDecimal() {
  if (shouldResetInput) { currentInput = '0.'; shouldResetInput = false; }
  else if (!currentInput.includes('.')) { currentInput += '.'; }
  updateDisplay();
}

function clearAll() {
  currentInput = '0'; previousInput = null; pendingOperator = null; shouldResetInput = false;
  updateDisplay();
}

function negate() {
  if (currentInput === '0') return;
  currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
  updateDisplay();
}

function percent() {
  const num = parseFloat(currentInput);
  if (isNaN(num)) return;
  currentInput = String(num / 100);
  updateDisplay();
}

function handleOperator(op) {
  const current = parseFloat(currentInput);
  if (pendingOperator && previousInput !== null && !shouldResetInput) {
    const result = compute(previousInput, current, pendingOperator);
    currentInput = String(result);
    previousInput = result;
  } else {
    previousInput = current;
  }
  pendingOperator = op;
  shouldResetInput = true;
  updateDisplay();
}

function compute(a, b, operator) {
  const ops = { add, subtract, multiply, divide };
  try { return ops[operator](a, b); }
  catch (err) { return err.message; }
}

function handleEquals() {
  if (pendingOperator === null) return;
  const current = parseFloat(currentInput);
  const result = compute(previousInput, current, pendingOperator);
  currentInput = String(result);
  previousInput = null;
  pendingOperator = null;
  shouldResetInput = true;
  updateDisplay();
}

panelCalc.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  switch (btn.dataset.action) {
    case 'digit': inputDigit(btn.dataset.value); break;
    case 'decimal': inputDecimal(); break;
    case 'clear': clearAll(); break;
    case 'negate': negate(); break;
    case 'percent': percent(); break;
    case 'operator': handleOperator(btn.dataset.value); break;
    case 'equals': handleEquals(); break;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (currentMode !== 'calc') return;

  if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
  else if (e.key === '.') inputDecimal();
  else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') clearAll();
  else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); }
  else if (e.key === '+') handleOperator('add');
  else if (e.key === '-') handleOperator('subtract');
  else if (e.key === '*') handleOperator('multiply');
  else if (e.key === '/') { e.preventDefault(); handleOperator('divide'); }
  else if (e.key === '%') percent();
  else if (e.key === 'Backspace') {
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-')))
      currentInput = '0';
    else currentInput = currentInput.slice(0, -1);
    updateDisplay();
  }
});

// ========== 进制转换 ==========

const convertValueInput = document.querySelector('#convert-value');
const fromBaseInput = document.querySelector('#from-base');
const toBaseInput = document.querySelector('#to-base');
const btnConvert = document.querySelector('#btn-convert');

function doConvert() {
  const value = convertValueInput.value.trim();
  const fromBase = Number(fromBaseInput.value);
  const toBase = Number(toBaseInput.value);

  if (value === '') { display.textContent = '请输入数值'; return; }

  try {
    const result = convertBase(value, fromBase, toBase);
    display.textContent = result;
  } catch (err) {
    display.textContent = err.message;
  }
}

btnConvert.addEventListener('click', (e) => {
  e.preventDefault();
  doConvert();
});

[convertValueInput, fromBaseInput, toBaseInput].forEach(el => {
  el.addEventListener('input', () => {
    if (currentMode === 'base') doConvert();
  });
});

updateDisplay();
