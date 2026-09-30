export type Position3 = readonly [number, number, number];

/** Smoothly brings client prediction back to the authoritative server position. */
export function reconcilePosition(current: Position3, authoritative: Position3, amount = .35): [number, number, number] {
  const alpha = Math.max(0, Math.min(1, amount));
  return current.map((value, index) => value + (authoritative[index] - value) * alpha) as [number, number, number];
}
