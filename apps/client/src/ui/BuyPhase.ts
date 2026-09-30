export function formatBuyPhase(seconds: number) {
  return `FAZA KUPOWANIA — ${Math.max(0, Math.ceil(seconds))} s`;
}

export function formatBuyCash(cash: number) {
  return `KREDYTY: ${Math.max(0, Math.floor(cash))}`;
}

export function syncBuyPhaseEnd(serverPhaseEndsAt: number, serverTime: number, clientNow = Date.now()) {
  return clientNow + Math.max(0, serverPhaseEndsAt - serverTime);
}
