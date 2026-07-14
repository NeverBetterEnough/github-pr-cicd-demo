import {
  add,
  subtract,
  multiply,
  divide
} from './calculator.js';

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
