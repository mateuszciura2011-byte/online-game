export function renderHud(root: HTMLElement, health: number, ammo: number, score: number, target: number) { root.innerHTML = `<div class="hud-health">${health}</div><div class="hud-ammo">${ammo}</div><div class="hud-score">${score} / ${target}</div><div class="reticle">+</div>`; }
export function resultCopy(victory: boolean) { return victory ? 'VICTORY +100 COINÓW' : 'DEFEAT'; }
export function messageTone(text: string) {
  if (text.startsWith('TRENING:')) return 'training';
  if (text.startsWith('START ZA')) return 'countdown';
  if (text === 'BRAK AMUNICJI') return 'default';
  return text.includes('VICTORY') ? 'victory' : /UTRACONO|BRAK|DEFEAT/.test(text) ? 'danger' : 'default';
}
export function didWin(result: { winnerPlayerId?: string; winnerTeam?: 'blue' | 'red'; draw: boolean }, playerId: string | undefined, playerTeam: string | undefined) { return !result.draw && (result.winnerPlayerId === playerId || result.winnerTeam === playerTeam); }
export function formatKillFeed(killer: string, target: string, weapon: string) { const label: Record<string, string> = { knife: 'NÓŻ', pistol: 'PISTOLET', smg: 'PM', rifle: 'KARABIN', sniper: 'SNAJPERKA', shotgun: 'STRZELBA' }; return `${killer} [${label[weapon] ?? weapon.toUpperCase()}] ${target}`; }
export function formatHitFeedback(damage: number) { return `TRAFIENIE +${Math.max(0, Math.round(damage))}`; }
export function formatReloadFeedback(weaponName: string) { return `PRZEŁADOWANIE: ${weaponName}`; }
export function formatMatchScore(mode: string, localScore: number, blueScore: number, redScore: number) { return mode === 'free_for_all' ? `WYNIK ${localScore}` : `NIEBIESCY ${blueScore} : ${redScore} CZERWONI`; }
export function minimapPoint(position: [number, number], extent = 68 / 2.3) { return [Math.max(7, Math.min(143, 75 + position[0] * (68 / extent))), Math.max(7, Math.min(143, 75 + position[1] * (68 / extent)))] as const; }
export function showResult(root: HTMLElement, victory: boolean) { root.innerHTML = `<section class="result ${victory ? 'victory' : 'defeat'}">${resultCopy(victory)}</section>`; }
