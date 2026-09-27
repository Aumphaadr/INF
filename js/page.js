// Общее для страниц уроков: монтаж инструмента на место заглушки
// и привязка переключателя «вес разрядов» к составителям раздела.

export function mount(name, node) {
  document.querySelector(`[data-mount="${name}"]`).replaceWith(node);
}

// Переключатель стоит в шапке раздела и действует на все составители
// раздела: учитель открывает разложение, когда ученики к нему готовы,
// а до того числа остаются просто числами.
export function bindWeights(sectionId, composers) {
  const box = document.querySelector(`#${sectionId} [data-weights]`);
  box.addEventListener('change', () => composers.forEach(c => c.setWeights(box.checked)));
}
