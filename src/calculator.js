export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零');
  }
  return a / b;
}

export function modulo(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零');
  }
  return a % b;
}

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * 进制转换：将数值从源进制转换为目标进制
 * @param {string|number} value - 待转换的值（十进制可用数字，其他进制用字符串）
 * @param {number} fromBase - 源进制（2-36）
 * @param {number} toBase - 目标进制（2-36）
 * @returns {string} 转换后的字符串（大写）
 */
export function convertBase(value, fromBase, toBase) {
  if (!Number.isInteger(fromBase) || fromBase < 2 || fromBase > 36) {
    throw new Error(`源进制必须在 2-36 之间，收到: ${fromBase}`);
  }
  if (!Number.isInteger(toBase) || toBase < 2 || toBase > 36) {
    throw new Error(`目标进制必须在 2-36 之间，收到: ${toBase}`);
  }

  const strValue = String(value).toUpperCase();

  // 验证输入字符串中每个字符都在源进制有效范围内
  const validDigits = DIGITS.slice(0, fromBase);
  for (let i = 0; i < strValue.length; i++) {
    const ch = strValue[i];
    if (i === 0 && ch === '-') continue;
    if (!validDigits.includes(ch)) {
      throw new Error(`"${value}" 不是有效的 ${fromBase} 进制数`);
    }
  }

  const decimal = parseInt(strValue, fromBase);
  if (Number.isNaN(decimal)) {
    throw new Error(`"${value}" 不是有效的 ${fromBase} 进制数`);
  }

  return decimal.toString(toBase).toUpperCase();
}
