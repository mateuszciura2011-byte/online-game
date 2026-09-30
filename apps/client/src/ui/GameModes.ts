import { GAME_MODES, type GameMode } from '@polystrike/shared/protocol';

export function modePicker(id: string) {
  return `<label for="${id}">TRYB GRY</label><select id="${id}" aria-describedby="${id}-description">${Object.entries(GAME_MODES).map(([value, mode]) => `<option value="${value}">${mode.name}</option>`).join('')}</select><p id="${id}-description" class="mode-description" aria-live="polite"></p>`;
}

export function bindModePickers(root: HTMLElement) {
  for (const id of ['quick-mode', 'mode']) {
    const select = root.querySelector<HTMLSelectElement>(`#${id}`);
    const description = root.querySelector(`#${id}-description`);
    if (!select || !description) continue;
    const update = () => { description.textContent = GAME_MODES[select.value as GameMode].description; };
    select.addEventListener('change', update); update();
  }
}
