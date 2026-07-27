import {
  add,
  subtract,
  multiply,
  divide,
  convertBase
} from './calculator.js';

// ========== 四则运算 ==========

const firstInput = document.querySelector('#first-number');
const secondInput = document.querySelector('#second-number');
const operatorSelect = document.querySelector('#operator');
const resultOutput = document.querySelector('#result');
const form = document.querySelector('#calculator-form');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const first = Number(firstInput.value);
  const second = Number(secondInput.value);
  const operator = operatorSelect.value;

  const operations = {
    add,
    subtract,
    multiply,
    divide
  };

  const calculate = operations[operator];

  if (!calculate) {
    resultOutput.textContent = '不支持的运算';
    return;
  }

  try {
    const result = calculate(first, second);
    resultOutput.textContent = String(result);
  } catch (err) {
    resultOutput.textContent = err.message;
  }
});

// ========== 进制转换 ==========

const convertValueInput = document.querySelector('#convert-value');
const fromBaseInput = document.querySelector('#from-base');
const toBaseInput = document.querySelector('#to-base');
const convertResultOutput = document.querySelector('#convert-result');
const converterForm = document.querySelector('#converter-form');

converterForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const value = convertValueInput.value.trim();
  const fromBase = Number(fromBaseInput.value);
  const toBase = Number(toBaseInput.value);

  if (value === '') {
    convertResultOutput.textContent = '请输入数值';
    return;
  }

  try {
    const result = convertBase(value, fromBase, toBase);
    convertResultOutput.textContent = result;
  } catch (err) {
    convertResultOutput.textContent = err.message;
  }
});
