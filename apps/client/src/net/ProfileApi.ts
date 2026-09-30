export interface Profile { id: string; coins: number; crateCount: number; ownedSkinIds: string[]; equippedSkinId: string; equippedPrimaryWeapon: 'smg' | 'rifle' | 'sniper' | 'shotgun'; }
export interface CareerStats { matchesPlayed: number; wins: number; kills: number; deaths: number; shotsFired: number; shotsHit: number; playTimeSeconds: number; }
export class ProfileApi {
  private api = (import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:2567').replace(/^ws/, 'http');
  private session?: { profile: Profile; token: string };
  private pendingSession?: Promise<{ profile: Profile; token: string }>;
  private async ensureSession() {
    if (this.session) return this.session;
    if (!this.pendingSession) {
      this.pendingSession = this.loadSession().finally(() => { this.pendingSession = undefined; });
    }
    return this.pendingSession;
  }
  private async loadSession() {
    const token = localStorage.getItem('polystrike-account-code');
    if (token) {
      const resumed = await fetch(`${this.api}/account/resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (resumed.ok) {
        const data = await resumed.json() as { profile: Profile };
        this.session = this.session ?? { profile: data.profile, token };
        return this.session;
      }
      if (resumed.status !== 401) throw new Error('Nie udało się wczytać konta. Spróbuj ponownie.');
    }
    const response = await fetch(`${this.api}/account/new`, { method: 'POST' });
    if (!response.ok) throw new Error('Nie udało się utworzyć profilu. Spróbuj ponownie.');
    const created = await response.json() as { profile: Profile; token: string };
    // An explicit login or restore may have completed while this request waited.
    if (this.session) return this.session;
    localStorage.setItem('polystrike-account-code', created.token);
    this.session = created;
    return created;
  }
  async accountCode() { return (await this.ensureSession()).token; }
  async register(email: string, password: string) { const guest = await this.ensureSession(); const response = await fetch(`${this.api}/account/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, guestToken: guest.token }) }); if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? 'Nie udało się utworzyć konta.'); const account = await response.json() as { profile: Profile; token: string }; localStorage.setItem('polystrike-account-code', account.token); this.session = account; return account.profile; }
  async signIn(email: string, password: string) { const response = await fetch(`${this.api}/account/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (!response.ok) throw new Error('Nieprawidłowy e-mail lub hasło.'); const account = await response.json() as { profile: Profile; token: string }; localStorage.setItem('polystrike-account-code', account.token); this.session = account; return account.profile; }
  async restore(code: string) { const response = await fetch(`${this.api}/account/resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: code.trim() }) }); if (!response.ok) throw new Error('Nieprawidłowy kod konta.'); const data = await response.json() as { profile: Profile }; localStorage.setItem('polystrike-account-code', code.trim()); this.session = { profile: data.profile, token: code.trim() }; return data.profile; }
  async get() {
    const session = await this.ensureSession();
    const response = await fetch(`${this.api}/profile/${session.profile.id}?token=${encodeURIComponent(session.token)}`);
    if (!response.ok) throw new Error('Nie udało się pobrać profilu. Spróbuj ponownie.');
    return response.json() as Promise<Profile>;
  }
  async buyCrate() { const session = await this.ensureSession(); const response = await fetch(`${this.api}/profile/${session.profile.id}/crate/buy?token=${encodeURIComponent(session.token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: crypto.randomUUID() }) }); if (!response.ok) throw new Error((await response.json()).error); return response.json() as Promise<{ coinsAfter: number; cratesAfter: number }>; }
  async openCrate() { const session = await this.ensureSession(); const response = await fetch(`${this.api}/profile/${session.profile.id}/crate/open?token=${encodeURIComponent(session.token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: crypto.randomUUID() }) }); if (!response.ok) throw new Error((await response.json()).error); return response.json() as Promise<{ skinId: string; rarity: string; duplicate: boolean; coinsAfter: number; cratesAfter: number }>; }
  async equip(skinId: string) { const session = await this.ensureSession(); const response = await fetch(`${this.api}/profile/${session.profile.id}/equip?token=${encodeURIComponent(session.token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skinId }) }); if (!response.ok) throw new Error('Nie masz tego skina.'); return response.json() as Promise<Profile>; }
  async equipWeapon(weapon: Profile['equippedPrimaryWeapon']) { const session = await this.ensureSession(); const response = await fetch(`${this.api}/profile/${session.profile.id}/loadout?token=${encodeURIComponent(session.token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weapon }) }); if (!response.ok) throw new Error('Nieprawidłowa broń.'); return response.json() as Promise<Profile>; }
  async awardVictory(matchId: string) { const session = await this.ensureSession(); return fetch(`${this.api}/profile/${session.profile.id}/victory?token=${encodeURIComponent(session.token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId }) }); }
  async getStats() {
    const session = await this.ensureSession();
    const response = await fetch(`${this.api}/profile/${session.profile.id}/stats?token=${encodeURIComponent(session.token)}`);
    if (!response.ok) throw new Error('Nie udało się pobrać statystyk. Spróbuj ponownie.');
    return response.json() as Promise<CareerStats>;
  }
  async recordStats(matchId: string, delta: CareerStats) { const session = await this.ensureSession(); const response = await fetch(`${this.api}/profile/${session.profile.id}/stats?token=${encodeURIComponent(session.token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, delta }) }); if (!response.ok) throw new Error('Nie udało się zapisać statystyk.'); return response.json() as Promise<CareerStats>; }
}
