// Боковое меню — общее для всех страниц. Список уроков живёт здесь,
// в одном месте: новая страница добавляется одной строкой.

const LESSONS = [
  { href: 'index.html', title: 'Главная',
    note: 'Что здесь есть' },
  { href: 'numeral-systems.html', title: 'Системы счисления',
    note: 'От двоичной до десятичной на одном экране' },
  { href: 'base-conversion.html', title: 'Перевод между системами',
    note: 'Разбивка на слагаемые вместо остатков от деления' },
  { href: 'bases-11-16.html', title: 'Системы от 11-чной до 16-чной',
    note: 'Цифры кончились — в ход идут буквы' },
  { title: 'Диаграммы Венна', note: 'в планах' },
  { title: 'Предикаты и кванторы', note: 'в планах' },
  { title: 'Таблицы истинности', note: 'в планах' },
];

export function initNav(currentHref) {
  const sidebar = document.querySelector('.sidebar');
  // Ссылкой должен быть весь подсвечиваемый прямоугольник: <a> блочный
  // и вмещает и название, и пояснение — средняя кнопка и клавиатура
  // работают как со всякой ссылкой.
  sidebar.innerHTML =
      '<h3>Информатика</h3>'
    + '<ul class="pages">' + LESSONS.map(p => p.href
        ? `<li><a href="${p.href}"${p.href === currentHref ? ' class="cur" aria-current="page"' : ''}>`
          + `<span class="t">${p.title}</span><span class="note">${p.note}</span></a></li>`
        : `<li><span class="soon"><span class="t">${p.title}</span>`
          + `<span class="note">${p.note}</span></span></li>`
      ).join('') + '</ul>';

  const scrim = document.querySelector('.scrim');
  const burger = document.querySelector('.burger');
  const setOpen = open => {
    sidebar.dataset.open = open ? '1' : '0';
    scrim.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setOpen(sidebar.dataset.open !== '1'));
  scrim.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
}
