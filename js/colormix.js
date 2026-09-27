// Цвет в шестнадцатеричной: три байта — красный, зелёный, синий, — каждый
// две шестнадцатеричные цифры. То самое #FFC456 из CSS, только по разрядам.

import { toBaseString } from './numerals.js';
import { createComposer } from './composer.js';

export function createColorMixer({ r = 255, g = 196, b = 86 } = {}) {
  const el = document.createElement('div');
  el.className = 'colormix';
  el.innerHTML = `
    <div class="sample">
      <div class="swatch" aria-hidden="true"></div>
      <p class="code"></p>
    </div>
    <div class="parts"></div>`;
  const swatch = el.querySelector('.swatch');
  const code = el.querySelector('.code');
  const partsEl = el.querySelector('.parts');

  const parts = [['Красный', r], ['Зелёный', g], ['Синий', b]].map(([title]) => {
    const c = createComposer({
      base: 16, width: 2, compact: true, title, note: 'один байт',
      alphabet: false, onChange: update,
    });
    partsEl.append(c.el);
    return c;
  });

  function update() {
    const values = parts.map(p => p.value);
    const hex = '#' + values.map(v => toBaseString(v, 16).padStart(2, '0')).join('');
    swatch.style.background = hex;
    code.innerHTML = `<b>${hex}</b><small>rgb(${values.join(', ')})</small>`;
  }

  parts[0].value = r;
  parts[1].value = g;
  parts[2].value = b;
  return el;
}
