// Модель урока о переводе: столбик степеней, разбивка числа на слагаемые
// и зеркальная разбивка записи по разрядам. Чистые функции без DOM.
//
// Никаких остатков от деления. Перевод здесь — три честных действия:
// разложить на слагаемые по столбику, перевести каждое (bⁿ — это единица
// и n нулей), сложить. Обратный перевод — те же три действия задом наперёд.

import { baseNameIn, checkBase, digitChar, digitValue } from './numerals.js';

// Столбик степеней по убыванию: от первой степени, превосходящей limit
// (она нужна, чтобы «не влезает» было видно), до b⁰. beyond: false —
// без этой лишней строки.
export function ladderRows(base, limit, { beyond = true } = {}) {
  checkBase(base);
  const rows = [];
  for (let n = 0, value = 1; ; n = n + 1, value = value * base) {
    if (value > limit) {
      if (beyond) rows.push({ n, value });
      break;
    }
    rows.push({ n, value });
  }
  return rows.reverse();
}

// 10ⁿ в любой системе — единица и n нулей.
export function spellPower(n) { return '1' + '0'.repeat(n); }

// Слагаемое coef·10ⁿ: цифра и n нулей. coef < base — иначе это уже
// не слагаемое, а число из двух разрядов.
export function spellTerm(coef, n) { return digitChar(coef) + '0'.repeat(n); }

// Показатель самой большой степени, которая влезает в остаток.
export function largestFit(rest, base) {
  checkBase(base);
  if (!(rest >= 1)) throw new RangeError(`нечего разбивать: остаток ${rest}`);
  let n = 0;
  while (base ** (n + 1) <= rest) n = n + 1;
  return n;
}

// Разбивка на слагаемые: на каждом шаге — самая большая степень, которая
// влезает в остаток. Степень может повториться (в пятеричной 62 = 25 + 25
// + …), но не больше base − 1 раз: иначе влезла бы следующая.
export function decompose(value, base) {
  const steps = [];
  let rest = Math.trunc(value);
  while (rest > 0) {
    const n = largestFit(rest, base);
    const power = base ** n;
    steps.push({ rest, n, power, next: rest - power });
    rest = rest - power;
  }
  return steps;
}

// Слагаемые с кратностью, по убыванию степени: [{ n, coef, value }].
export function groupTerms(steps, base) {
  const count = new Map();
  for (const s of steps) count.set(s.n, (count.get(s.n) || 0) + 1);
  return [...count]
    .sort((a, b) => b[0] - a[0])
    .map(([n, coef]) => ({ n, coef, value: coef * base ** n }));
}

// Разбор записи в системе base. Ошибки — словами, они показываются
// под полем ввода.
export function parseInBase(str, base) {
  checkBase(base);
  const s = String(str).trim();
  if (s === '') throw new Error('введите число');
  let value = 0;
  for (const ch of s) {
    const d = digitValue(ch);
    if (d < 0) throw new Error(`«${ch}» — не цифра`);
    if (d >= base) {
      const where = baseNameIn(base);
      throw new Error(`${where[0].toUpperCase()}${where.slice(1)} нет цифры ${ch}`);
    }
    value = value * base + d;
  }
  return value;
}

// Зеркальная разбивка записи по разрядам, нули пропускаются:
// [{ n, coef, value }] по убыванию степени. Запись должна быть уже
// проверена parseInBase.
export function splitTerms(str, base) {
  checkBase(base);
  const s = String(str).trim().replace(/^0+(?=.)/, '');
  const terms = [];
  const len = s.length;
  [...s].forEach((ch, i) => {
    const d = digitValue(ch);
    const n = len - 1 - i;
    if (d > 0) terms.push({ n, coef: d, value: d * base ** n });
  });
  return terms;
}
