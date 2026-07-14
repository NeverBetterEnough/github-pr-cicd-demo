import { add, subtract } from './calculator.js';

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

  const result = operator === 'add'
    ? add(first, second)
    : subtract(first, second);

  resultOutput.textContent = String(result);
});
