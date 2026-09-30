export type PlayerAnimationState = 'idle' | 'walk' | 'sprint' | 'jump' | 'land' | 'reload' | 'death' | 'emote' | 'victory';
export interface AnimationInput { moving: boolean; sprinting: boolean; airborne: boolean; landed: boolean; reloading: boolean; dead: boolean; emote: boolean; victory: boolean; }
const priority: PlayerAnimationState[] = ['death', 'victory', 'reload', 'emote', 'land', 'jump', 'sprint', 'walk', 'idle'];
export function chooseAnimation(input: AnimationInput): PlayerAnimationState { const active: Record<PlayerAnimationState, boolean> = { death: input.dead, victory: input.victory, reload: input.reloading, emote: input.emote, land: input.landed, jump: input.airborne, sprint: input.moving && input.sprinting, walk: input.moving, idle: true }; return priority.find((state) => active[state]) ?? 'idle'; }
export class PlayerAnimator { state: PlayerAnimationState = 'idle'; update(input: AnimationInput) { this.state = chooseAnimation(input); return this.state; } }
