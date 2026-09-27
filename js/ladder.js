// Столбик степеней — то, что выписывают сбоку, прежде чем переводить.
// Три колонки: степень, её десятичное значение и её запись в системе:
// единица и n нулей. В переводчиках столбик кликабелен — ученик сам
// находит нужную строку, а столбик отвечает вспышкой.

import { baseNameIn } from './numerals.js';
import { ladderRows, spellPower } from './convert.js';

const FLASHES = ['ok', 'bad', 'warn'];

export function createLadder({ base, limit, beyond = true, clickable = false, onPick = null }) {
  const el = document.createElement('div');
  el.className = 'ladder' + (clickable ? ' clickable' : '');
  const rowEls = new Map();      // n → tr

  function render() {
    const rows = ladderRows(base, limit, { beyond });
    el.innerHTML = `<table>
      <thead><tr>
        <th scope="col">степень</th>
        <th scope="col">в десятичной</th>
        <th scope="col">${baseNameIn(base)}</th>
        <th scope="col"><span class="visually-hidden">отметки</span></th>
      </tr></thead>
      <tbody>${rows.map(r =>
        `<tr data-n="${r.n}"${clickable ? ' tabindex="0" role="button"' : ''}>` +
        `<td class="pw">${base}<sup>${r.n}</sup></td>` +
        `<td class="dec">${r.value}</td>` +
        `<td class="sp">${spellPower(r.n)}</td>` +
        `<td class="mk"></td></tr>`).join('')}
      </tbody></table>`;
    rowEls.clear();
    el.querySelectorAll('tbody tr').forEach(tr => rowEls.set(+tr.dataset.n, tr));
  }

  function flash(n, cls) {
    const tr = rowEls.get(n);
    if (!tr) return;
    tr.classList.remove(...FLASHES);
    void tr.offsetWidth;
    tr.classList.add(cls);
  }

  // Отметка использованной степени: галочка, а при повторе — кратность.
  function mark(n, count = 1) {
    const tr = rowEls.get(n);
    if (!tr) return;
    tr.classList.add('used');
    tr.querySelector('.mk').innerHTML = `<span class="badge">${count > 1 ? '×' + count : '✓'}</span>`;
  }

  function clearMarks() {
    rowEls.forEach(tr => {
      tr.classList.remove('used', ...FLASHES);
      tr.querySelector('.mk').innerHTML = '';
    });
  }

  if (clickable) {
    el.addEventListener('click', e => {
      const tr = e.target.closest('tr[data-n]');
      if (tr && onPick) onPick(+tr.dataset.n);
    });
    el.addEventListener('keydown', e => {
      const tr = e.target.closest('tr[data-n]');
      if (!tr || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      if (onPick) onPick(+tr.dataset.n);
    });
  }
  el.addEventListener('animationend', e => {
    const tr = e.target.closest('tr');
    if (tr) tr.classList.remove(...FLASHES);
  });

  render();

  return {
    el,
    flash, mark, clearMarks,
    get base() { return base; },
    reset(next = {}) {
      if (next.base !== undefined) base = next.base;
      if (next.limit !== undefined) limit = next.limit;
      render();
    },
  };
}
