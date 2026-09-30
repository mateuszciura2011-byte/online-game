import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ProfileStore, type PlayerProfile } from './ProfileStore.js';
export interface AccountSession { profile: PlayerProfile; token: string; }
type Credential = { profileId: string; salt: string; passwordHash: string };
type SavedAccounts = { tokenHashes: Record<string, string>; credentials: Record<string, Credential> };

export class AccountService {
  private tokenHashes = new Map<string, string>();
  private credentials = new Map<string, Credential>();

  constructor(private profiles: ProfileStore, private readonly persistPath?: string) {
    if (!persistPath || !existsSync(persistPath)) return;
    const saved = JSON.parse(readFileSync(persistPath, 'utf8')) as Record<string, string> | SavedAccounts;
    const tokenHashes = 'tokenHashes' in saved ? saved.tokenHashes : saved;
    Object.entries(tokenHashes).forEach(([hash, id]) => this.tokenHashes.set(hash, id));
    if ('credentials' in saved) Object.entries(saved.credentials).forEach(([email, credential]) => this.credentials.set(email, credential));
  }

  createAnonymousAccount(): AccountSession { return this.issueSession(this.profiles.get(randomBytes(12).toString('hex'))); }
  resume(token: string) { const id = this.tokenHashes.get(this.hashToken(token)); return id ? this.profiles.get(id) : undefined; }

  register(email: string, password: string, guestToken?: string): AccountSession {
    const normalizedEmail = this.normalizeEmail(email);
    this.validatePassword(password);
    if (this.credentials.has(normalizedEmail)) throw new Error('Ten adres e-mail jest już używany.');
    const targetProfile = guestToken ? this.resume(guestToken) : undefined;
    const profile = targetProfile ?? this.profiles.get(randomBytes(12).toString('hex'));
    const salt = randomBytes(16).toString('base64url');
    this.credentials.set(normalizedEmail, { profileId: profile.id, salt, passwordHash: this.hashPassword(password, salt) });
    this.save();
    return this.issueSession(profile);
  }

  signIn(email: string, password: string): AccountSession {
    const credential = this.credentials.get(this.normalizeEmail(email));
    if (!credential || !this.passwordMatches(password, credential)) throw new Error('Nieprawidłowy e-mail lub hasło.');
    return this.issueSession(this.profiles.get(credential.profileId));
  }

  private issueSession(profile: PlayerProfile): AccountSession { const token = randomBytes(24).toString('base64url'); this.tokenHashes.set(this.hashToken(token), profile.id); this.save(); return { profile, token }; }
  private normalizeEmail(email: string) { const normalized = email.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Podaj prawidłowy adres e-mail.'); return normalized; }
  private validatePassword(password: string) { if (password.length < 10) throw new Error('Hasło musi mieć co najmniej 10 znaków.'); }
  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private hashPassword(password: string, salt: string) { return scryptSync(password, salt, 64).toString('base64'); }
  private passwordMatches(password: string, credential: Credential) { const expected = Buffer.from(credential.passwordHash, 'base64'); const received = Buffer.from(this.hashPassword(password, credential.salt), 'base64'); return expected.length === received.length && timingSafeEqual(expected, received); }
  private save() { if (!this.persistPath) return; mkdirSync(dirname(this.persistPath), { recursive: true }); const saved: SavedAccounts = { tokenHashes: Object.fromEntries(this.tokenHashes), credentials: Object.fromEntries(this.credentials) }; writeFileSync(this.persistPath, JSON.stringify(saved)); }
}
