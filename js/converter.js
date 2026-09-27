// Переводчики: из десятичной в любую систему и обратно. Оба идут по
// одному рабочему листу в три действия — разбить, перевести, сложить —
// и оба останавливаются после каждого действия: ученик успевает сделать
// шаг на бумаге раньше, чем его покажет экран.
//
// Действие, где нужна голова, отдано ученику: в прямом переводе он сам
// щёлкает в столбике самую большую степень, что влезает в остаток,
// в обратном — находит в столбике степень слагаемого. Кнопка «Шаг»
// делает то же самое за него, кнопка «Всё» проходит весь лист.

import { baseName, toBaseString } from './numerals.js';
import {
  groupTerms, largestFit, parseInBase, splitTerms, spellPower, spellTerm,
} from './convert.js';
import { createLadder } from './ladder.js';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const sub = (s, base) => `${s}<sub>${base}</sub>`;
const pow = (base, n) => `${base}<sup>${n}</sup>`;
const coefOf = c => c > 1 ? `${c}·` : '';
let uid = 0;

// ---- Рабочий лист ----

function createSheet() {
  const el = document.createElement('div');
  el.className = 'ws';
  const prompt = document.createElement('p');
  prompt.className = 'ws-prompt';

  const add = node => { el.insertBefore(node, prompt.parentNode === el ? prompt : null); };
  const api = {
    el,
    clear() { el.innerHTML = ''; prompt.innerHTML = ''; prompt.hidden = true; },
    heading(text) { const h = document.createElement('h4'); h.textContent = text; add(h); },
    line(html, cls = '') {
      const p = document.createElement('p');
      p.className = 'ws-line' + (cls ? ' ' + cls : '');
      p.innerHTML = html;
      add(p);
      return p;
    },
    // Сложение столбиком: слагаемые выровнены по правому краю, итог под чертой.
    sum(rows, total) {
      const d = document.createElement('div');
      d.className = 'ws-sum';
      d.innerHTML = rows.map(r => `<div class="r">${r}</div>`).join('') + `<div class="t">${total}</div>`;
      add(d);
    },
    prompt(html) {
      prompt.innerHTML = html;
      prompt.hidden = html === '';
      el.append(prompt);               // всегда последним
    },
    note(html, cls) {
      let n = prompt.querySelector('.note');
      if (!n) { n = document.createElement('span'); prompt.append(n); }
      n.className = 'note ' + cls;
      n.innerHTML = html;
    },
  };
  return api;
}

// ---- Общая обвязка ----

function scaffold({ fieldHtml, base, minBase, maxBase, onInput, onBase, onRandom, onStep, onAll, onReset }) {
  const el = document.createElement('div');
  el.className = 'conv';
  const name = 'conv-base-' + (uid = uid + 1);
  el.innerHTML = `
    <div class="tools">
      ${fieldHtml}
      <div class="cv-bases">
        <span class="lbl">Основание</span>
        <div class="cols" role="radiogroup" aria-label="Основание">
          ${range(minBase, maxBase).map(b =>
            `<label><input type="radio" name="${name}" value="${b}"${b === base ? ' checked' : ''}><span>${b}</span></label>`).join('')}
        </div>
      </div>
      <button type="button" class="act mini cv-random">случайное число</button>
    </div>
    <div class="tools">
      <button type="button" class="act cv-step">Шаг</button>
      <button type="button" class="act cv-all">Всё</button>
      <button type="button" class="act cv-reset">Заново</button>
      <span class="hint cv-error" role="alert"></span>
    </div>
    <div class="cv-body">
      <div class="cv-ladder"></div>
    </div>`;
  const input = el.querySelector('.cv-field input');
  input.addEventListener('input', onInput);
  el.querySelector('.cols').addEventListener('change', e => onBase(+e.target.value));
  el.querySelector('.cv-random').addEventListener('click', onRandom);
  el.querySelector('.cv-step').addEventListener('click', onStep);
  el.querySelector('.cv-all').addEventListener('click', onAll);
  el.querySelector('.cv-reset').addEventListener('click', onReset);
  return {
    el, input,
    body: el.querySelector('.cv-body'),
    ladderHost: el.querySelector('.cv-ladder'),
    error: el.querySelector('.cv-error'),
    setBase(b) { el.querySelector(`.cols input[value="${b}"]`).checked = true; },
    lock(on) { el.querySelectorAll('.cv-step, .cv-all').forEach(b => { b.disabled = on; }); },
  };
}

// ---- Из десятичной в систему b ----

export function createToBase({ base = 2, value = 187, minBase = 2, maxBase = 10, maxValue = 99999, onContinue = null } = {}) {
  let st = null;
  const s = scaffold({
    fieldHtml: `<label class="cv-field"><span class="lbl">Число в десятичной</span>` +
      `<input type="number" min="0" max="${maxValue}" value="${value}"></label>`,
    base, minBase, maxBase,
    onInput: () => { if (s.input.value !== '') start(); },
    onBase: b => { base = b; start(); },
    onRandom: () => { s.input.value = String(11 + Math.floor(Math.random() * 989)); start(); },
    onStep: () => { if (st) next(); },
    onAll: () => { if (st) while (st.phase !== 'done') next(); },
    onReset: start,
  });
  const sheet = createSheet();
  s.body.append(sheet.el);
  const ladder = createLadder({ base, limit: value, clickable: true, onPick: pick });
  s.ladderHost.append(ladder.el);

  function start() {
    const v = Math.min(maxValue, Math.max(0, Math.trunc(+s.input.value || 0)));
    s.input.value = String(v);
    st = { value: v, rest: v, steps: [], groups: null, ti: 0, phase: v === 0 ? 'done' : 'sub' };
    ladder.reset({ base, limit: v });
    sheet.clear();
    if (v === 0) {
      sheet.line('Ноль — ноль в любой системе.');
      finish();
      return;
    }
    sheet.heading('1. Разбиваем на слагаемые');
    say();
  }

  function say() {
    const { phase, rest, groups, ti } = st;
    if (phase === 'sub') {
      sheet.prompt(`${st.steps.length ? 'Остаток' : 'Число'} <b>${rest}</b>. Какая самая большая степень влезает? ` +
        'Щёлкните её в столбике или нажмите «Шаг».');
    } else if (phase === 'group') {
      sheet.prompt('Остаток 0 — слагаемые найдены. «Шаг» соберёт их в сумму.');
    } else if (phase === 'translate') {
      const g = groups[ti];
      sheet.prompt(`Слагаемое <b>${coefOf(g.coef)}${base ** g.n}</b>: «Шаг» переведёт его по столбику.`);
    } else if (phase === 'add') {
      sheet.prompt('Все слагаемые переведены. «Шаг» сложит их столбиком.');
    } else {
      sheet.prompt('');
    }
  }

  // Принять степень: вычесть, записать строку, отметить в столбике.
  function accept(n) {
    const p = base ** n;
    sheet.line(`${st.rest} − <b>${p}</b> = ${st.rest - p}`);
    st.rest = st.rest - p;
    st.steps.push(n);
    ladder.flash(n, 'ok');
    ladder.mark(n, st.steps.filter(x => x === n).length);
    if (st.rest === 0) st.phase = 'group';
    say();
  }

  function pick(n) {
    if (!st || st.phase !== 'sub') return;
    const p = base ** n;
    const best = largestFit(st.rest, base);
    if (n === best) { accept(n); return; }
    if (p > st.rest) {
      ladder.flash(n, 'bad');
      sheet.note(`${p} не влезает в ${st.rest}.`, 'bad');
    } else {
      ladder.flash(n, 'warn');
      sheet.note(`${p} влезает, но влезет и побольше.`, 'warn');
    }
  }

  function next() {
    const { phase } = st;
    if (phase === 'sub') {
      accept(largestFit(st.rest, base));
    } else if (phase === 'group') {
      st.groups = groupTerms(st.steps.map(n => ({ n })), base);
      sheet.line(`${st.value} = ` + st.groups.map(g => `${coefOf(g.coef)}${base ** g.n}`).join(' + '), 'ws-strong');
      sheet.heading('2. Переводим каждое слагаемое');
      st.phase = 'translate';
      st.ti = 0;
      say();
    } else if (phase === 'translate') {
      const g = st.groups[st.ti];
      const c = coefOf(g.coef);
      sheet.line(g.coef > 1
        ? `${c}${base ** g.n} = ${c}${pow(base, g.n)} = ${c}${sub(spellPower(g.n), base)} = ${sub(spellTerm(g.coef, g.n), base)}`
        : `${base ** g.n} = ${pow(base, g.n)} = ${sub(spellPower(g.n), base)}`);
      ladder.flash(g.n, 'ok');
      st.ti = st.ti + 1;
      if (st.ti === st.groups.length) st.phase = 'add';
      say();
    } else if (phase === 'add') {
      sheet.heading('3. Складываем');
      sheet.sum(st.groups.map(g => spellTerm(g.coef, g.n)), toBaseString(st.value, base));
      finish();
    }
  }

  function finish() {
    st.phase = 'done';
    const spelled = toBaseString(st.value, base);
    sheet.line(`${sub(st.value, 10)} = ${sub(spelled, base)}`, 'ws-result');
    if (onContinue && st.value > 0) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'act mini cv-continue';
      b.innerHTML = `Перевести ${sub(spelled, base)} обратно в десятичную ↓`;
      b.addEventListener('click', () => onContinue({ str: spelled, base }));
      sheet.line('').append(b);
    }
    say();
  }

  start();
  return {
    el: s.el,
    set({ value: v, base: b }) {
      if (b !== undefined) { base = b; s.setBase(b); }
      if (v !== undefined) s.input.value = String(v);
      start();
    },
  };
}

// ---- Из системы b в десятичную ----

export function createToDecimal({ base = 2, str = '10111011', minBase = 2, maxBase = 10, maxValue = 99999, onContinue = null } = {}) {
  let st = null;
  const s = scaffold({
    fieldHtml: `<label class="cv-field"><span class="lbl">Число в выбранной системе</span>` +
      `<input type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${str}"></label>`,
    base, minBase, maxBase,
    onInput: start,
    onBase: b => { base = b; start(); },
    onRandom: () => { s.input.value = toBaseString(11 + Math.floor(Math.random() * 989), base); start(); },
    onStep: () => { if (st) next(); },
    onAll: () => { if (st) while (st.phase !== 'done') next(); },
    onReset: start,
  });
  const sheet = createSheet();
  s.body.append(sheet.el);
  const ladder = createLadder({ base, limit: 1, clickable: true, onPick: pick });
  s.ladderHost.append(ladder.el);

  function start() {
    st = null;
    sheet.clear();
    let value;
    try {
      value = parseInBase(s.input.value, base);
      if (value > maxValue) throw new Error(`Слишком большое: не больше ${toBaseString(maxValue, base)} в этой системе`);
    } catch (e) {
      s.error.textContent = e.message;
      s.lock(true);
      return;
    }
    s.error.textContent = '';
    s.lock(false);
    const text = s.input.value.trim().replace(/^0+(?=.)/, '');
    st = { str: text, value, terms: splitTerms(text, base), ti: 0, phase: value === 0 ? 'done' : 'split' };
    ladder.reset({ base, limit: value });
    if (value === 0) {
      sheet.line('Ноль — ноль в любой системе.');
      finish();
      return;
    }
    sheet.heading('1. Разбиваем на слагаемые по разрядам');
    say();
  }

  function say() {
    const { phase, terms, ti } = st;
    if (phase === 'split') {
      sheet.prompt(`Число <b>${sub(st.str, base)}</b>. «Шаг» разложит его по разрядам: каждая ненулевая цифра — слагаемое.`);
    } else if (phase === 'translate') {
      const t = terms[ti];
      sheet.prompt(`Слагаемое <b>${sub(spellTerm(t.coef, t.n), base)}</b>. Найдите его степень в столбике или нажмите «Шаг».`);
    } else if (phase === 'add') {
      sheet.prompt('Все слагаемые переведены. «Шаг» сложит их.');
    } else {
      sheet.prompt('');
    }
  }

  function accept(n) {
    const t = st.terms[st.ti];
    const c = coefOf(t.coef);
    sheet.line(t.coef > 1
      ? `${sub(spellTerm(t.coef, t.n), base)} = ${c}${sub(spellPower(t.n), base)} = ${c}${pow(base, t.n)} = ${c}${base ** t.n} = ${t.value}`
      : `${sub(spellPower(t.n), base)} = ${pow(base, t.n)} = ${t.value}`);
    ladder.flash(n, 'ok');
    ladder.mark(n);
    st.ti = st.ti + 1;
    if (st.ti === st.terms.length) st.phase = 'add';
    say();
  }

  function pick(n) {
    if (!st || st.phase !== 'translate') return;
    const t = st.terms[st.ti];
    if (n === t.n) { accept(n); return; }
    ladder.flash(n, 'bad');
    sheet.note(t.coef > 1
      ? `В этой строке ${sub(spellPower(n), base)}, а в слагаемом ${sub(spellTerm(t.coef, t.n), base)} степень ${sub(spellPower(t.n), base)}.`
      : `В этой строке ${sub(spellPower(n), base)}, а нужно ${sub(spellPower(t.n), base)}.`, 'bad');
  }

  function next() {
    const { phase } = st;
    if (phase === 'split') {
      sheet.line(`${sub(st.str, base)} = ` + st.terms.map(t => sub(spellTerm(t.coef, t.n), base)).join(' + '), 'ws-strong');
      sheet.heading('2. Переводим каждое слагаемое');
      st.phase = 'translate';
      st.ti = 0;
      say();
    } else if (phase === 'translate') {
      accept(st.terms[st.ti].n);
    } else if (phase === 'add') {
      sheet.heading('3. Складываем');
      sheet.sum(st.terms.map(t => String(t.value)), String(st.value));
      finish();
    }
  }

  function finish() {
    st.phase = 'done';
    sheet.line(`${sub(st.str, base)} = ${sub(st.value, 10)}`, 'ws-result');
    if (onContinue && st.value > 0) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'act mini cv-continue';
      b.innerHTML = `Перевести ${st.value} из десятичной в другую систему ↑`;
      b.addEventListener('click', () => onContinue({ value: st.value }));
      sheet.line('').append(b);
    }
    say();
  }

  start();
  return {
    el: s.el,
    set({ str: text, base: b }) {
      if (b !== undefined) { base = b; s.setBase(b); }
      if (text !== undefined) s.input.value = text;
      start();
    },
  };
}
