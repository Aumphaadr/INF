// Самопроверка модели: node tools/selfcheck.mjs
// Прямой и обратный переводы сходятся для всех оснований, веса и
// «круглые» числа совпадают с тем, что даёт сам движок JS.
import {
  MIN_BASE, MAX_BASE, toDigits, fromDigits, toBaseString, digitCount,
  isRound, weights, digitChar, digitValue,
} from '../js/numerals.js';

let checks = 0;
function ok(cond, what) {
  checks = checks + 1;
  if (!cond) { console.error('ПРОВАЛ: ' + what); process.exitCode = 1; }
}

for (let base = MIN_BASE; base <= MAX_BASE; base = base + 1) {
  for (let v = 0; v < 2000; v = v + 1) {
    ok(fromDigits(toDigits(v, base), base) === v, `круг ${v} в ${base}`);
    ok(toBaseString(v, base) === v.toString(base).toUpperCase(), `строка ${v} в ${base}`);
    ok(digitCount(v, base) === v.toString(base).length, `длина ${v} в ${base}`);
    let round = false;
    for (let p = base; p <= v; p = p * base) if (p === v) round = true;
    ok(isRound(v, base) === round, `круглое ${v} в ${base}`);
  }
  ok(toDigits(0, base, 5).join('') === '00000', `нули шириной 5 в ${base}`);
  ok(weights(base, 3).join(',') === `${base * base},${base},1`, `веса в ${base}`);
  for (let d = 0; d < base; d = d + 1) ok(digitValue(digitChar(d)) === d, `цифра ${d}`);
}

let threw = false;
try { toDigits(32, 2, 5); } catch (e) { threw = e instanceof RangeError; }
ok(threw, 'переполнение ширины даёт RangeError');
threw = false;
try { toDigits(1, 1); } catch (e) { threw = e instanceof RangeError; }
ok(threw, 'основание 1 отвергается');

console.log(process.exitCode ? 'есть провалы' : `порядок: ${checks} проверок`);

// ---- Модель перевода ----
import {
  ladderRows, spellPower, spellTerm, largestFit, decompose, groupTerms,
  parseInBase, splitTerms,
} from '../js/convert.js';

ok(decompose(187, 2).map(s => s.power).join('+') === '128+32+16+8+2+1', 'пример 187 в двоичную');
ok(decompose(187, 5).map(s => s.power).join('+') === '125+25+25+5+5+1+1', 'пример 187 в пятеричную');
ok(ladderRows(2, 187).map(r => r.value).join(',') === '256,128,64,32,16,8,4,2,1', 'столбик до 187');
ok(ladderRows(10, 99999, { beyond: false }).length === 5, 'столбик без лишней строки');
ok(spellPower(3) === '1000' && spellTerm(2, 2) === '200', 'запись степеней');

for (let base = MIN_BASE; base <= 10; base = base + 1) {
  for (let v = 0; v < 3000; v = v + 1) {
    const steps = decompose(v, base);
    ok(steps.every(s => s.rest - s.power === s.next && s.next >= 0), `шаги ${v} в ${base}`);
    ok(steps.reduce((a, s) => a + s.power, 0) === v, `сумма шагов ${v} в ${base}`);
    const groups = groupTerms(steps, base);
    ok(groups.every(g => g.coef < base), `без переносов ${v} в ${base}`);
    ok(groups.reduce((a, g) => a + g.value, 0) === v, `сумма групп ${v} в ${base}`);
    // Сложение переведённых слагаемых столбиком даёт запись числа.
    const spelled = toBaseString(v, base);
    const built = groups.reduce((a, g) => a + parseInBase(spellTerm(g.coef, g.n), base), 0);
    ok(built === v && (v === 0 || groups.map(g => spellTerm(g.coef, g.n)).length > 0), `столбик ${v} в ${base}`);
    // Зеркало: разбивка записи по разрядам совпадает с группами.
    const mirror = splitTerms(spelled, base);
    ok(JSON.stringify(mirror) === JSON.stringify(groups), `зеркало ${v} в ${base}`);
    ok(parseInBase(spelled, base) === v, `разбор ${spelled} в ${base}`);
    if (v > 0) ok(base ** largestFit(v, base) <= v && base ** (largestFit(v, base) + 1) > v, `влезает ${v} в ${base}`);
  }
}

let msg = '';
try { parseInBase('127', 5); } catch (e) { msg = e.message; }
ok(msg === 'В пятеричной нет цифры 7', `слова об ошибке: ${msg}`);
try { parseInBase('1?', 2); } catch (e) { msg = e.message; }
ok(msg === '«?» — не цифра', `слова об ошибке: ${msg}`);

console.log(process.exitCode ? 'есть провалы' : `перевод: порядок, всего ${checks} проверок`);
