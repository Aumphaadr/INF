// Модель позиционных систем счисления. Чистые функции без DOM: ими
// пользуются составитель, таблица, ползунок и самопроверка в node.

export const MIN_BASE = 2;
export const MAX_BASE = 36;

// Цифры сверх девятки — латинские буквы, как в шестнадцатеричной записи.
// В этом уроке они не нужны (основания до десяти), но модель знает их
// заранее: расширение урока не должно требовать её переписывать.
const DIGIT_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function digitChar(d) { return DIGIT_CHARS[d]; }

// Значение символа-цифры или -1, если такой цифры не бывает.
export function digitValue(ch) {
  return DIGIT_CHARS.indexOf(String(ch).toUpperCase());
}

const NAMES = {
  2: 'двоичная', 3: 'троичная', 4: 'четверичная', 5: 'пятеричная',
  6: 'шестеричная', 7: 'семеричная', 8: 'восьмеричная', 9: 'девятеричная',
  10: 'десятичная', 11: 'одиннадцатеричная', 12: 'двенадцатеричная',
  13: 'тринадцатеричная', 14: 'четырнадцатеричная', 15: 'пятнадцатеричная',
  16: 'шестнадцатеричная', 20: 'двадцатеричная', 60: 'шестидесятеричная',
};

export function baseName(base) {
  return NAMES[base] || `с основанием ${base}`;
}

// Для фраз: «в двоичной», «в системе с основанием 20».
export function baseNameIn(base) {
  const n = NAMES[base];
  return n ? `в ${n.replace(/ая$/, 'ой')}` : `в системе с основанием ${base}`;
}

export function checkBase(base) {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) {
    throw new RangeError(`основание ${base} вне диапазона ${MIN_BASE}…${MAX_BASE}`);
  }
}

// Разряды числа, старший первым. width — сколько разрядов вернуть
// (слева дополняется нулями); без width — ровно столько, сколько нужно,
// для нуля — один разряд.
export function toDigits(value, base, width) {
  checkBase(base);
  let v = Math.trunc(value);
  if (!(v >= 0)) throw new RangeError(`ожидалось целое неотрицательное число, а не ${value}`);
  const out = [];
  do { out.push(v % base); v = Math.floor(v / base); } while (v > 0);
  if (width !== undefined) {
    if (out.length > width) {
      throw new RangeError(`число ${value} не помещается в ${width} разрядов с основанием ${base}`);
    }
    while (out.length < width) out.push(0);
  }
  return out.reverse();
}

// Обратно: из разрядов (старший первым) в число.
export function fromDigits(digits, base) {
  checkBase(base);
  return digits.reduce((acc, d) => acc * base + d, 0);
}

export function toBaseString(value, base) {
  return toDigits(value, base).map(digitChar).join('');
}

export function digitCount(value, base) {
  return toDigits(value, base).length;
}

// «Круглое» число системы: степень основания — там, где запись становится
// на разряд длиннее (10, 100, 1000 в этой системе). Единица круглой не
// считается: она во всех системах выглядит одинаково.
export function isRound(value, base) {
  checkBase(base);
  if (value < base) return false;
  while (value % base === 0) value = value / base;
  return value === 1;
}

// Веса разрядов, старший первым: [base^(width-1), …, base, 1].
export function weights(base, width) {
  checkBase(base);
  return Array.from({ length: width }, (_, i) => base ** (width - 1 - i));
}
