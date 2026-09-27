// Сравнительная таблица: строка — одно число, столбец — одна система.
// Десятичный столбец подсвечен как привычный, но стоит в общем ряду:
// он такой же, как остальные, просто у людей десять пальцев.

import { baseName, digitCount, isRound, toBaseString } from './numerals.js';

export function createBaseTable({ bases, rows = 50, step = 50, limit = 1000, familiar = 10, hidden = [] }) {
  let last = rows;              // показаны числа 0…last включительно
  let descending = false;
  const initial = rows;
  // Выключенные столбцы (основания). hidden — выключенные с самого начала:
  // они есть в чипах, но не отвлекают, пока не понадобятся.
  const off = new Set(hidden.filter(b => b !== familiar));

  const el = document.createElement('div');
  el.className = 'basetable';
  const first = bases[0], final = bases[bases.length - 1];
  // Привычный столбец не выключается: он точка опоры для сравнения,
  // и без него любое «сколько это?» повисает в воздухе.
  el.innerHTML = `
    <div class="tools">
      <span class="hint">Столбцы</span>
      <div class="cols" role="group" aria-label="Какие системы показывать">
        ${bases.map(b => `<label title="${b === familiar ? 'привычная система всегда на месте' : baseName(b)}">` +
          `<input type="checkbox" value="${b}"${off.has(b) ? '' : ' checked'}${b === familiar ? ' disabled' : ''}><span>${b}</span></label>`).join('')}
      </div>
      <button type="button" class="act mini bt-all">все</button>
      <button type="button" class="act mini bt-only">только ${baseName(familiar)}</button>
    </div>
    <div class="tools">
      <label class="chk">
        <input type="checkbox" class="bt-tint">
        <span>Раскрасить по числу разрядов</span>
      </label>
      <div class="seg" role="group" aria-label="Порядок столбцов">
        <button type="button" data-desc="0" aria-pressed="true">${first} → ${final}</button>
        <button type="button" data-desc="1" aria-pressed="false">${final} → ${first}</button>
      </div>
      <span class="hint">Щелчок по строке закрепляет подсветку</span>
    </div>
    <div class="bt-scroll">
      <table><thead><tr></tr></thead><tbody></tbody></table>
    </div>
    <div class="tools">
      <button type="button" class="act bt-grow">Ещё ${step} строк</button>
      <button type="button" class="act bt-shrink">Свернуть</button>
      <span class="hint bt-range"></span>
    </div>`;

  const headRow = el.querySelector('thead tr');
  const body = el.querySelector('tbody');
  const rangeEl = el.querySelector('.bt-range');
  const growBtn = el.querySelector('.bt-grow');
  const shrinkBtn = el.querySelector('.bt-shrink');

  const order = () => descending ? bases.slice().reverse() : bases;
  const hiddenAttr = b => off.has(b) ? ' hidden' : '';

  function renderHead() {
    headRow.innerHTML = order().map(b =>
      `<th class="${b === familiar ? 'fam' : ''}" scope="col" data-base="${b}"${hiddenAttr(b)}>` +
      `<b>${b}</b><small>${baseName(b)}</small></th>`
    ).join('');
  }

  function makeRow(v) {
    const tr = document.createElement('tr');
    tr.dataset.value = String(v);
    tr.innerHTML = order().map(b => {
      const cls = [b === familiar ? 'fam' : '', isRound(v, b) ? 'round' : ''].join(' ').trim();
      return `<td class="${cls}" data-base="${b}" style="--len:${digitCount(v, b)}"${hiddenAttr(b)}>` +
        `${toBaseString(v, b)}</td>`;
    }).join('');
    return tr;
  }

  // Столбец прячется на месте, без перестройки таблицы: закреплённые
  // строки и раскраска остаются как были. Новые строки при догрузке
  // читают тот же набор off.
  const chips = el.querySelectorAll('.cols input');
  function setColumn(b, on) {
    if (b === familiar) return;
    if (on) off.delete(b); else off.add(b);
    el.querySelectorAll(`[data-base="${b}"]`).forEach(c => { c.hidden = !on; });
    chips.forEach(c => { c.checked = !off.has(+c.value); });
  }

  // Закреплённые строки переживают перестройку: учитель мог отметить
  // несколько чисел, а потом поменять порядок столбцов.
  function pinned() {
    return new Set([...body.querySelectorAll('tr.pin')].map(tr => +tr.dataset.value));
  }

  function renderBody(from = 0) {
    const keep = pinned();
    if (from === 0) body.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let v = from; v <= last; v = v + 1) {
      const tr = makeRow(v);
      if (keep.has(v)) tr.classList.add('pin');
      frag.append(tr);
    }
    body.append(frag);
    rangeEl.textContent = `числа от 0 до ${last}`;
    growBtn.disabled = last >= limit;
    shrinkBtn.disabled = last <= initial;
  }

  el.querySelector('.cols').addEventListener('change', e => setColumn(+e.target.value, e.target.checked));
  el.querySelector('.bt-all').addEventListener('click', () => bases.forEach(b => setColumn(b, true)));
  el.querySelector('.bt-only').addEventListener('click', () => bases.forEach(b => setColumn(b, false)));
  el.querySelector('.bt-tint').addEventListener('change', e => {
    el.classList.toggle('tint', e.target.checked);
  });
  el.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    descending = b.dataset.desc === '1';
    el.querySelectorAll('.seg button').forEach(x =>
      x.setAttribute('aria-pressed', String(x === b)));
    renderHead();
    renderBody();
  }));
  growBtn.addEventListener('click', () => {
    const from = last + 1;
    last = Math.min(limit, last + step);
    renderBody(from);
  });
  shrinkBtn.addEventListener('click', () => {
    last = initial;
    renderBody();
    el.scrollIntoView({ block: 'nearest' });
  });
  body.addEventListener('click', e => {
    const tr = e.target.closest('tr');
    if (tr) tr.classList.toggle('pin');
  });

  renderHead();
  renderBody();
  return el;
}
