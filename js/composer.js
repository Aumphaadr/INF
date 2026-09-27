// Составитель чисел: разряды-барабаны, у каждого своё колесо цифр.
// Компонент один на все основания — в этом весь смысл: от системы
// к системе меняется только длина алфавита, остальное совпадает.
//
// Щелчок по разряду крутит его колесо вперёд без переноса (4 → 0 в
// пятеричной), правый щелчок и колесо мыши — назад. Кнопки «+1» / «−1»
// считают по-настоящему, с переносом: 4 → 10. Две разные вещи — алфавит
// и счёт — здесь нарочно разведены по разным кнопкам.

import {
  baseName, digitChar, digitValue, fromDigits, toBaseString, toDigits, weights,
} from './numerals.js';

// Вспышка — единственная «телесная» обратная связь: разряд, у которого
// кончились цифры, должен быть виден с последней парты. Снимаются все
// классы вспышек, а не только запрошенный: оставшийся от прошлого раза
// «wrap» перебил бы «tick» в CSS, и вспышка бы не перезапустилась.
const FLASHES = ['tick', 'wrap', 'overflow'];
function flash(node, cls) {
  node.classList.remove(...FLASHES);
  void node.offsetWidth;
  node.classList.add(cls);
}

const cap = s => s[0].toUpperCase() + s.slice(1);

// title и note заменяют заголовок карточки («Красный» вместо
// «Шестнадцатеричная»); alphabet: false прячет ряд цифр; bits: true
// показывает под каждым разрядом его двоичную группу — только для
// оснований-степеней двойки; onChange зовётся после каждого изменения.
export function createComposer({
  base, width = 5, compact = false, title = null, note = null,
  alphabet = true, bits = false, onChange = null,
}) {
  const digits = new Array(width).fill(0);
  const w = weights(base, width);
  const top = base ** width;          // первое число, которому не хватило разрядов
  let showWeights = false;
  let ready = false;

  // Двоичных разрядов на одну цифру: 16 = 2⁴ — четыре, 8 = 2³ — три.
  const bitsPerDigit = bits ? Math.log2(base) : 0;
  if (bits && !Number.isInteger(bitsPerDigit)) {
    throw new RangeError(`основание ${base} — не степень двойки, разряды на двоичные группы не делятся`);
  }

  const el = document.createElement('section');
  el.className = 'composer' + (compact ? ' compact' : '');
  el.dataset.base = String(base);
  el.style.setProperty('--width', String(width));
  el.setAttribute('aria-label', `Составитель чисел, ${baseName(base)} система`);
  el.innerHTML = `
    <header class="c-head">
      <span class="c-name">${title || cap(baseName(base))}</span>
      <span class="c-base">${note || 'основание ' + base}</span>
    </header>
    ${alphabet ? `<div class="c-alphabet" aria-label="Цифры этой системы">
      ${Array.from({ length: base }, (_, d) => `<span>${digitChar(d)}</span>`).join('')}
    </div>` : ''}
    <div class="c-wheels"></div>
    ${bits ? '<div class="c-bits"></div><p class="c-bitline"></p>' : ''}
    <div class="c-weights" hidden>
      ${w.map((x, i) => `<span class="wt"><b>${base}<sup>${width - 1 - i}</sup></b><i>${x}</i></span>`).join('')}
    </div>
    <p class="c-expansion" hidden></p>
    <footer class="c-foot">
      <button type="button" class="c-step" data-delta="-1">−1</button>
      <button type="button" class="c-step" data-delta="1">+1</button>
      <button type="button" class="c-reset">сброс</button>
    </footer>`;

  const wheelsEl = el.querySelector('.c-wheels');
  const weightsEl = el.querySelector('.c-weights');
  const expEl = el.querySelector('.c-expansion');
  const bitsEl = el.querySelector('.c-bits');
  const bitlineEl = el.querySelector('.c-bitline');

  const wheelEls = digits.map((_, pos) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wheel';
    b.dataset.pos = String(pos);
    b.setAttribute('aria-label', `Разряд с весом ${w[pos]}`);
    wheelsEl.append(b);
    return b;
  });

  function render() {
    // Ведущие нули гасим, как на счётчике с неподсвеченными разрядами:
    // число читается «14», а не «00014». Последний разряд не гасим никогда —
    // ноль тоже число.
    let lead = true;
    digits.forEach((d, i) => {
      wheelEls[i].textContent = digitChar(d);
      lead = lead && d === 0;
      wheelEls[i].classList.toggle('lead', lead && i < width - 1);
    });
    if (bits) renderBits();
    if (showWeights) renderExpansion();
    if (ready && onChange) onChange(fromDigits(digits, base));
  }

  // Двоичная группа под каждой цифрой: перевод без арифметики, разряд
  // за разрядом. Группы всегда полной ширины — «0010», а не «10»,
  // иначе не видно, что ширина у всех одна.
  function renderBits() {
    const groups = digits.map(d => d.toString(2).padStart(bitsPerDigit, '0'));
    const first = Math.max(0, digits.findIndex(d => d !== 0));
    const start = digits.every(d => d === 0) ? width - 1 : first;
    bitsEl.innerHTML = groups.map((g, i) =>
      `<span class="bt${i < start ? ' lead' : ''}">${g}</span>`).join('');
    const value = fromDigits(digits, base);
    bitlineEl.innerHTML =
      `<span class="num">${toBaseString(value, base)}<sub>${base}</sub></span> = ` +
      `${groups.slice(start).join(' ')}<sub>2</sub> = <span class="val">${value}<sub>10</sub></span>`;
  }

  // Разложение по весам — то, что делает перевод в десятичную не магией,
  // а арифметикой. Нулевые слагаемые не прячем: регулярность важнее краткости.
  // Цифра в слагаемом — числом, а не знаком: F·16 читается хуже, чем 15·16.
  function renderExpansion() {
    const value = fromDigits(digits, base);
    const terms = digits.map((d, i) => `${d}·${w[i]}`).join(' + ');
    expEl.innerHTML =
      `<span class="num">${toBaseString(value, base)}<sub>${base}</sub></span>` +
      ` = ${terms} = <span class="val">${value}<sub>10</sub></span>`;
  }

  // Колесо одного разряда: без переноса, по кругу.
  function bump(pos, delta) {
    const old = digits[pos];
    digits[pos] = (old + delta + base) % base;
    render();
    const wrapped = delta > 0 ? old === base - 1 : old === 0;
    flash(wheelEls[pos], wrapped ? 'wrap' : 'tick');
  }

  function setDigit(pos, d) {
    if (d < 0 || d >= base || d === digits[pos]) return;
    digits[pos] = d;
    render();
    flash(wheelEls[pos], 'tick');
  }

  // Счёт с переносом. За пределами width разрядов — переполнение: число
  // идёт по кругу, как одометр, и рамка вспыхивает целиком.
  function step(delta) {
    const before = digits.slice();
    let v = fromDigits(digits, base) + delta;
    let overflow = false;
    if (v >= top) { v = v - top; overflow = true; }
    if (v < 0) { v = v + top; overflow = true; }
    setValue(v);
    digits.forEach((d, i) => {
      if (d === before[i]) return;
      // При +1 в ноль разряд попадает только через перенос, при −1 в
      // старшую цифру — только через заём. Остальные изменения — обычный шаг.
      const wrapped = delta > 0 ? d === 0 : d === base - 1;
      flash(wheelEls[i], wrapped ? 'wrap' : 'tick');
    });
    if (overflow) flash(el, 'overflow');
  }

  function setValue(v) {
    toDigits(v, base, width).forEach((d, i) => { digits[i] = d; });
    render();
  }

  wheelsEl.addEventListener('click', e => {
    const b = e.target.closest('.wheel');
    if (b) bump(+b.dataset.pos, 1);
  });
  wheelsEl.addEventListener('contextmenu', e => {
    const b = e.target.closest('.wheel');
    if (!b) return;
    e.preventDefault();
    bump(+b.dataset.pos, -1);
  });
  // Колесо мыши над барабаном крутит барабан, а не страницу.
  wheelsEl.addEventListener('wheel', e => {
    const b = e.target.closest('.wheel');
    if (!b || e.deltaY === 0) return;
    e.preventDefault();
    bump(+b.dataset.pos, e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  wheelsEl.addEventListener('keydown', e => {
    const b = e.target.closest('.wheel');
    if (!b) return;
    const pos = +b.dataset.pos;
    let handled = true;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') bump(pos, 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') bump(pos, -1);
    else if (e.key === 'Home') setDigit(pos, 0);
    else if (e.key === 'End') setDigit(pos, base - 1);
    else if (e.key.length === 1 && digitValue(e.key) >= 0) setDigit(pos, digitValue(e.key));
    else handled = false;
    if (handled) e.preventDefault();
  });

  // Отгоревшая вспышка убирает за собой класс: иначе он копится на разряде.
  el.addEventListener('animationend', e => e.target.classList.remove(...FLASHES));

  el.querySelectorAll('.c-step').forEach(b =>
    b.addEventListener('click', () => step(+b.dataset.delta)));
  el.querySelector('.c-reset').addEventListener('click', () => {
    digits.fill(0);
    render();
    wheelEls.forEach(b => flash(b, 'tick'));
  });

  render();
  ready = true;

  return {
    el,
    base,
    get value() { return fromDigits(digits, base); },
    set value(v) { setValue(v); },
    setWeights(on) {
      showWeights = on;
      weightsEl.hidden = !on;
      expEl.hidden = !on;
      if (on) renderExpansion();
    },
  };
}
