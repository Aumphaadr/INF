// Алфавиты систем: сколько цифр у каждой и откуда берутся новые.
// После девятки знаки кончаются, и с одиннадцатеричной в ход идут буквы:
// A = 10, B = 11, … F = 15. Таблица показывает это как продолжение ряда,
// а не как особенность шестнадцатеричной.

import { baseName, digitChar } from './numerals.js';

export function createAlphabetTable({ minBase = 2, maxBase = 16, familiar = 10 } = {}) {
  const el = document.createElement('div');
  el.className = 'alphabets';
  const rows = [];
  for (let b = minBase; b <= maxBase; b = b + 1) {
    const chips = Array.from({ length: b }, (_, d) => d < 10
      ? `<span class="digit">${d}</span>`
      : `<span class="digit letter" title="${digitChar(d)} = ${d}"><b>${digitChar(d)}</b><i>${d}</i></span>`
    ).join('');
    rows.push(`<tr${b === familiar ? ' class="fam"' : ''}>` +
      `<th scope="row">${b}</th><td class="nm">${baseName(b)}</td>` +
      `<td><div class="digits">${chips}</div></td></tr>`);
  }
  el.innerHTML = `<table>
    <thead><tr><th scope="col">основание</th><th scope="col">название</th><th scope="col">цифры</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>`;
  return el;
}
