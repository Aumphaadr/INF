// Урок «Системы счисления»: сборка инструментов на странице. Разметка
// разделов — в numeral-systems.html, здесь только монтаж и связывание.

import { initNav } from './nav.js';
import { mount, bindWeights } from './page.js';
import { createComposer } from './composer.js';
import { createBaseTable } from './basetable.js';
import { createBaseSlider } from './baseslider.js';

// Урок останавливается на десятичной: системы от одиннадцатеричной
// до шестнадцатеричной — отдельный урок, bases-11-16.html.
const BASES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const dec = createComposer({ base: 10 });
mount('composer-10', dec.el);
bindWeights('decimal', [dec]);

const quinary = createComposer({ base: 5 });
mount('composer-5', quinary.el);
bindWeights('quinary', [quinary]);

const grid = document.createElement('div');
grid.className = 'composers';
const all = BASES.map(base => {
  const c = createComposer({ base, compact: true });
  grid.append(c.el);
  return c;
});
mount('composers-all', grid);
bindWeights('all-bases', all);

mount('basetable', createBaseTable({ bases: BASES, rows: 50, step: 50, familiar: 10 }));
mount('baseslider', createBaseSlider({ minBase: 2, maxBase: 10, base: 5, value: 100 }));

initNav('numeral-systems.html');
