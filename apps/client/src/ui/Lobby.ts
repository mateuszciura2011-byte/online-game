export interface LobbyPlayer {
  id: string;
  name: string;
  isBot?: boolean;
}

export function formatLobbySummary(players: LobbyPlayer[]): string {
  const bots = players.filter((player) => player.isBot).map((player) => player.name);
  return `Lobby: ${players.length}/10${bots.length ? ` · Boty: ${bots.join(', ')}` : ''}`;
}

export function formatCountdown(seconds: number): string { return `START ZA ${Math.max(0, Math.ceil(seconds))}…`; }
