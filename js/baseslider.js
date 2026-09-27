// Одно число — разные основания. Число стоит на месте, ползунок меняет
// только основание, и запись перестраивается на глазах: та же самая
// величина, другой алфавит и другие веса разрядов. Непрерывность систем
// счисления здесь буквальна — её можно провести рукой.

import { baseName, digitChar, toBaseString, toDigits, weights } from './numerals.js';

const cap = s => s[0].toUpperCase() + s.slice(1);

export function createBaseSlider({ minBase = 2, maxBase = 10, base = 5, value = 100, maxValue = 99999 }) {
  const el = document.createElement('div');
  el.className = 'baseslider';
  el.innerHTML = `
    <div class="bs-controls">
      <div class="bs-value">
        <span class="lbl">Число</span>
        <button type="button" class="act" data-delta="-1" aria-label="Меньше на один">−1</button>
        <input type="number" min="0" max="${maxValue}" value="${value}" aria-label="Число в десятичной записи">
        <button type="button" class="act" data-delta="1" aria-label="Больше на один">+1</button>
      </div>
      <div class="bs-base">
        <span class="lbl">Основание</span>
        <input type="range" min="${minBase}" max="${maxBase}" value="${base}" aria-label="Основание системы счисления">
        <div class="bs-ticks" role="group" aria-label="Основание">
          ${Array.from({ length: maxBase - minBase + 1 }, (_, i) =>
            `<button type="button" data-base="${minBase + i}">${minBase + i}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="bs-display">
      <div class="bs-name"></div>
      <div class="bs-digits"></div>
      <p class="bs-expansion"></p>
    </div>`;

  const numInput = el.querySelector('input[type=number]');
  const range = el.querySelector('input[type=range]');
  const ticks = el.querySelectorAll('.bs-ticks button');
  const nameEl = el.querySelector('.bs-name');
  const digitsEl = el.querySelector('.bs-digits');
  const expEl = el.querySelector('.bs-expansion');

  function render() {
    const digits = toDigits(value, base);
    const w = weights(base, digits.length);
    nameEl.innerHTML = `${cap(baseName(base))} <span class="c-base">основание ${base}</span>`;
    digitsEl.innerHTML = digits.map((d, i) =>
      `<span class="bs-d"><b>${digitChar(d)}</b><i>${base}<sup>${digits.length - 1 - i}</sup></i><i>${w[i]}</i></span>`
    ).join('');
    expEl.innerHTML =
      `<span class="num">${toBaseString(value, base)}<sub>${base}</sub></span> = ` +
      digits.map((d, i) => `${d}·${w[i]}`).join(' + ') +
      ` = <span class="val">${value}<sub>10</sub></span>`;
    range.value = String(base);
    ticks.forEach(t => t.setAttribute('aria-pressed', String(+t.dataset.base === base)));
  }

  function setValue(v) {
    if (!Number.isFinite(v)) return;
    value = Math.min(maxValue, Math.max(0, Math.trunc(v)));
    numInput.value = String(value);
    render();
  }
  function setBase(b) {
    base = Math.min(maxBase, Math.max(minBase, b));
    render();
  }

  numInput.addEventListener('input', () => {
    // Пустое поле не трогаем: человек стирает число, чтобы набрать новое.
    if (numInput.value === '') return;
    setValue(+numInput.value);
  });
  numInput.addEventListener('blur', () => { numInput.value = String(value); });
  el.querySelectorAll('.bs-value .act').forEach(b =>
    b.addEventListener('click', () => setValue(value + +b.dataset.delta)));
  range.addEventListener('input', () => setBase(+range.value));
  ticks.forEach(t => t.addEventListener('click', () => setBase(+t.dataset.base)));

  render();
  return el;
}
