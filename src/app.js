import {
  add, subtract, multiply, divide,
  power, sqrt, cbrt, log10, ln, square, reciprocal, factorial,
  sin, cos, tan,
  convertBase
} from './calculator.js';

const display = document.querySelector('#display');
const modeBtns = document.querySelectorAll('.mode-btn[data-mode="calc"], .mode-btn[data-mode="base"]');
const btnAdv = document.querySelector('#btn-adv');
const panelCalc = document.querySelector('#panel-calc');
const panelAdv = document.querySelector('#panel-adv');
const panelBase = document.querySelector('#panel-base');

let currentMode = 'calc';
let advancedMode = false;

// ========== 模式切换 ==========

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    panelCalc.style.display = currentMode === 'calc' ? '' : 'none';
    panelAdv.style.display = (currentMode === 'calc' && advancedMode) ? '' : 'none';
    panelBase.style.display = currentMode === 'base' ? '' : 'none';

    if (currentMode === 'calc') updateDisplay();
    else doConvert();
  });
});

btnAdv.addEventListener('click', () => {
  advancedMode = !advancedMode;
  if (advancedMode) {
    btnAdv.classList.add('adv-on');
  } else {
    btnAdv.classList.remove('adv-on');
  }
  panelAdv.style.display = (currentMode === 'calc' && advancedMode) ? '' : 'none';
});

// ========== 标准计算器 ==========

let currentInput = '0';
let previousInput = null;
let pendingOperator = null;
let shouldResetInput = false;
let powerBase = null;   // 用于 xⁿ: 存储底数

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
  if (powerBase !== null) {
    // 输入指数
    if (shouldResetInput) { currentInput = digit; shouldResetInput = false; }
    else { currentInput = currentInput === '0' ? digit : currentInput + digit; }
    updateDisplay();
    return;
  }
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
  currentInput = '0'; previousInput = null; pendingOperator = null;
  shouldResetInput = false; powerBase = null;
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
  if (powerBase !== null) {
    // xⁿ + 运算符 → 先完成幂运算
    handleEquals();
  }
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
  if (powerBase !== null) {
    // xⁿ: 计算幂结果
    const exponent = parseFloat(currentInput);
    try {
      const result = power(powerBase, exponent);
      currentInput = String(result);
    } catch (err) {
      currentInput = err.message;
    }
    powerBase = null;
    previousInput = null;
    pendingOperator = null;
    shouldResetInput = true;
    updateDisplay();
    return;
  }

  if (pendingOperator === null) return;
  const current = parseFloat(currentInput);
  const result = compute(previousInput, current, pendingOperator);
  currentInput = String(result);
  previousInput = null;
  pendingOperator = null;
  shouldResetInput = true;
  updateDisplay();
}

// 基础按钮事件
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
    case 'delete': doDelete(); break;
  }
});

// 高级按钮事件
panelAdv.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'adv') {
    handleAdvanced(btn.dataset.value);
  } else if (action === 'constant') {
    handleConstant(btn.dataset.value);
  } else if (action === 'delete') {
    doDelete();
  }
});

function handleAdvanced(op) {
  const current = parseFloat(currentInput);
  if (isNaN(current)) { display.textContent = '错误'; return; }

  if (op === 'power') {
    // xⁿ: 存储底数，等待指数输入
    powerBase = current;
    previousInput = null;
    pendingOperator = null;
    shouldResetInput = true;
    currentInput = '0';
    display.textContent = current.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ^';
    return;
  }

  // 一元函数
  const fnMap = {
    sqrt, cbrt, log10, ln, square, reciprocal, factorial, sin, cos, tan
  };
  try {
    const result = fnMap[op](current);
    currentInput = String(result);
    previousInput = null;
    pendingOperator = null;
    shouldResetInput = true;
  } catch (err) {
    currentInput = err.message;
  }
  updateDisplay();
}

function handleConstant(name) {
  if (name === 'pi') {
    currentInput = String(Math.PI);
  } else if (name === 'e') {
    currentInput = String(Math.E);
  }
  shouldResetInput = true;
  updateDisplay();
}

function doDelete() {
  if (shouldResetInput) { clearAll(); return; }
  if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
    currentInput = '0';
  } else {
    currentInput = currentInput.slice(0, -1);
  }
  updateDisplay();
}

// 键盘支持
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
  else if (e.key === 'Backspace') doDelete();
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
