// Урок «Системы от 11-чной до 16-чной»: монтаж инструментов.

import { initNav } from './nav.js';
import { mount, bindWeights } from './page.js';
import { createAlphabetTable } from './alphabets.js';
import { createComposer } from './composer.js';
import { createBaseTable } from './basetable.js';
import { createBaseSlider } from './baseslider.js';
import { createColorMixer } from './colormix.js';

const BASES = [11, 12, 13, 14, 15, 16];

mount('alphabets', createAlphabetTable({ minBase: 2, maxBase: 16, familiar: 10 }));

const eleven = createComposer({ base: 11 });
mount('composer-11', eleven.el);
bindWeights('undecimal', [eleven]);

const grid = document.createElement('div');
grid.className = 'composers';
const all = BASES.map(base => {
  const c = createComposer({ base, compact: true });
  grid.append(c.el);
  return c;
});
mount('composers-all', grid);
bindWeights('all-bases', all);

// Двоичная и восьмеричная в таблице есть, но выключены: они нужны, когда
// разговор дойдёт до групп по три и по четыре разряда.
mount('basetable', createBaseTable({
  bases: [2, 8, 10, 11, 12, 13, 14, 15, 16], rows: 50, step: 50, familiar: 10, hidden: [2, 8],
}));

mount('baseslider', createBaseSlider({ minBase: 2, maxBase: 16, base: 16, value: 255 }));

// Одно и то же число в трёх системах-степенях двойки: двоичная запись
// одна, только группы разной ширины.
const bitGrid = document.createElement('div');
bitGrid.className = 'composers';
[4, 8, 16].forEach(base => {
  const c = createComposer({ base, width: 4, compact: true, bits: true });
  c.value = 181;
  bitGrid.append(c.el);
});
mount('bits', bitGrid);

mount('colormix', createColorMixer({ r: 255, g: 196, b: 86 }));

initNav('bases-11-16.html');
