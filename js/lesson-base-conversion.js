// Урок «Перевод между системами»: монтаж инструментов.

import { initNav } from './nav.js';
import { createLadder } from './ladder.js';
import { createToBase, createToDecimal } from './converter.js';

const MIN_BASE = 2, MAX_BASE = 10, MAX_VALUE = 99999;

function mount(name, node) {
  document.querySelector(`[data-mount="${name}"]`).replaceWith(node);
}

// Столбик-справочник с выбором основания: степени до пятизначного числа.
const ladder = createLadder({ base: 2, limit: MAX_VALUE, beyond: false });
mount('ladder', ladder.el);
document.querySelector('#ladder .cols').addEventListener('change', e => {
  ladder.reset({ base: +e.target.value });
});

// Результат одного переводчика подаётся на вход другому: так видно,
// что алгоритмы обратны друг другу, а не просто похожи.
let toDecimal;
const toBase = createToBase({
  base: 2, value: 187, minBase: MIN_BASE, maxBase: MAX_BASE, maxValue: MAX_VALUE,
  onContinue: ({ str, base }) => {
    toDecimal.set({ str, base });
    document.querySelector('#to-decimal').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
});
toDecimal = createToDecimal({
  base: 2, str: '10111011', minBase: MIN_BASE, maxBase: MAX_BASE, maxValue: MAX_VALUE,
  onContinue: ({ value }) => {
    toBase.set({ value });
    document.querySelector('#to-base').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
});
mount('to-base', toBase.el);
mount('to-decimal', toDecimal.el);

initNav('base-conversion.html');
