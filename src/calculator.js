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

// ========== 高级数学函数 ==========

/** a^b */
export function power(a, b) {
  return Math.pow(a, b);
}

/** √a */
export function sqrt(a) {
  if (a < 0) throw new Error('不能对负数开平方根');
  return Math.sqrt(a);
}

/** ³√a */
export function cbrt(a) {
  return Math.cbrt(a);
}

/** log₁₀(a) */
export function log10(a) {
  if (a <= 0) throw new Error('对数参数必须大于 0');
  return Math.log10(a);
}

/** ln(a) */
export function ln(a) {
  if (a <= 0) throw new Error('对数参数必须大于 0');
  return Math.log(a);
}

/** a² */
export function square(a) {
  return a * a;
}

/** 1/a */
export function reciprocal(a) {
  if (a === 0) throw new Error('不能除以零');
  return 1 / a;
}

/** n! (整数阶乘，n >= 0) */
export function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error('阶乘只支持非负整数');
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** sin(度) */
export function sin(a) {
  return Math.sin(a * Math.PI / 180);
}

/** cos(度) */
export function cos(a) {
  return Math.cos(a * Math.PI / 180);
}

/** tan(度) */
export function tan(a) {
  // 90°, 270° etc 无定义
  if ((a - 90) % 180 === 0) throw new Error('tan 在该角度无定义');
  return Math.tan(a * Math.PI / 180);
}

// ========== 进制转换 ==========

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function convertBase(value, fromBase, toBase) {
  if (!Number.isInteger(fromBase) || fromBase < 2 || fromBase > 36) {
    throw new Error(`源进制必须在 2-36 之间，收到: ${fromBase}`);
  }
  if (!Number.isInteger(toBase) || toBase < 2 || toBase > 36) {
    throw new Error(`目标进制必须在 2-36 之间，收到: ${toBase}`);
  }

  const strValue = String(value).toUpperCase();
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
