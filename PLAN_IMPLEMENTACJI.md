# PolyStrike — plan implementacji

> **Dla wykonawców agentowych:** WYMAGANA UMIEJĘTNOŚĆ DODATKOWA: użyj `superpowers:subagent-driven-development` (zalecane) albo `superpowers:executing-plans`, aby realizować ten plan zadanie po zadaniu. Kroki używają pól wyboru `- [ ]` do śledzenia postępu.

**Cel:** Zbudować przeglądarkowy FPS low-poly dla maksymalnie 10 graczy, z trybami 5 na 5 i każdy na każdego, sześcioma klasami broni, serwerami, skinami i nagrodami za zwycięstwa.

**Architektura:** Monorepo pnpm zawiera klienta Three.js, autorytatywny serwer Colyseus oraz pakiet wspólnych typów i konfiguracji. Klient przewiduje własny ruch, serwer zatwierdza stan gry, a pozostali gracze są interpolowani.

**Stos technologiczny:** TypeScript, Vite, Three.js, Node.js, Colyseus, PostgreSQL, SQLite, Web Audio API, Mixamo, Sketchfab, GLB Shrink, pnpm, Vitest i Playwright.

**Specyfikacja:** `docs/SPECYFIKACJA_GRY.md`

## Ograniczenia globalne

- Maksymalnie 10 graczy w pokoju.
- Pierwsza wersja obsługuje komputery z aktualnymi Chrome, Edge i Firefox.
- Serwer jest jedynym źródłem prawdy dla trafień, obrażeń, amunicji, wyniku, czasu i odrodzeń.
- Częstotliwość symulacji serwera wynosi 20 Hz.
- Mecz trwa 10 minut; limit wynosi 50 eliminacji drużynowych albo 30 eliminacji gracza.
- Nie dodawać płatności prawdziwymi pieniędzmi, pełnych kont, rankingu, botów ani sterowania dotykowego do wersji 1.0.
- Nie dodawać czatu głosowego ani tekstowego; komunikacja korzysta wyłącznie z koła szybkich komunikatów i znaczników drużynowych na mapie.
- Zwycięstwo daje 100 coinów, skrzynka kosztuje 300 coinów, a duplikat skina zwraca 50 coinów.
- Każdy zewnętrzny model, klip animacji i utwór musi mieć wpis w `docs/CREDITS.md` oraz maszynowo czytelny manifest licencji.
- Nie dodawać do runtime nieskończonego świata, Gaussian Splatting, WebGPU-only oceanu FFT ani kontrolera `ecctrl`.

---

## Docelowe pliki i odpowiedzialności

```text
apps/client/src/game/GameClient.ts       inicjalizacja sceny i pętla renderowania
apps/client/src/game/LocalPlayer.ts      wejście, predykcja i korekta lokalnego gracza
apps/client/src/game/RemotePlayers.ts    interpolacja innych graczy
apps/client/src/game/WeaponView.ts       model broni, odrzut i efekty strzału
apps/client/src/ui/Hud.ts                HUD, tabela wyników i komunikaty
apps/client/src/ui/MainMenu.ts           nawigacja i animowany podgląd aktualnego skina
apps/client/src/ui/ServerBrowser.ts      szybka gra, lista, tworzenie i kod serwera
apps/client/src/ui/Inventory.ts          skiny, skrzynki i wyposażenie
apps/client/src/assets/AssetManifest.ts  źródła, licencje i budżety zasobów
apps/client/src/animation/PlayerAnimator.ts graf stanów i klipy Mixamo
apps/client/src/audio/AudioDirector.ts   muzyka map, warstwy napięcia i mikser
apps/client/src/vfx/VfxPool.ts           pulowane błyski, smugi, iskry i cząsteczki
apps/client/src/net/RoomConnection.ts    połączenie, reconnect i obsługa wiadomości
apps/server/src/rooms/GameRoom.ts        cykl pokoju i komunikacja Colyseus
apps/server/src/rooms/ServerDirectory.ts publiczna lista i kody serwerów prywatnych
apps/server/src/simulation/World.ts      ruch, kolizje i aktualizacja 20 Hz
apps/server/src/combat/CombatSystem.ts   walidacja strzałów, trafienia i obrażenia
apps/server/src/match/MatchRules.ts      reguły obu trybów, wynik i koniec meczu
apps/server/src/profile/ProfileStore.ts  saldo, skiny, wyposażenie i zapis profilu
apps/server/src/profile/CrateService.ts  autorytatywny zakup i losowanie skrzynek
packages/shared/src/config/weapons.ts    parametry sześciu broni
packages/shared/src/protocol.ts          typy wejścia i wiadomości
packages/shared/src/state.ts             schemat stanu synchronizowanego
tests/e2e/match.spec.ts                  przepływ dwóch klientów
```

## Etap 1: Fundament projektu i wspólne kontrakty

**Rezultat:** Klient i serwer uruchamiają się równocześnie, a pakiet `shared` jest używany przez oba.

**Pliki:**

- utwórz `package.json`, `pnpm-workspace.yaml` i `tsconfig.base.json`,
- utwórz `apps/client`, `apps/server` i `packages/shared`,
- utwórz `packages/shared/src/protocol.ts`, `state.ts` i `config/weapons.ts`,
- utwórz `packages/shared/src/config/weapons.test.ts`.

**Interfejsy:**

```ts
export type GameMode = "team_deathmatch" | "free_for_all";
export type WeaponId = "knife" | "pistol" | "smg" | "rifle" | "sniper" | "shotgun";

export interface PlayerInput {
  sequence: number;
  clientTime: number;
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  jump: boolean;
  sprint: boolean;
}

export interface FireRequest {
  sequence: number;
  clientTime: number;
  weaponId: WeaponId;
  origin: [number, number, number];
  direction: [number, number, number];
}
```

- [ ] Skonfiguruj workspace i skrypty `dev`, `build`, `test`, `typecheck` oraz `test:e2e`.
- [ ] Napisz test sprawdzający obecność dokładnie sześciu broni i dodatnie wartości obrażeń.
- [ ] Uruchom `pnpm test` i potwierdź, że test początkowo nie przechodzi z powodu braku konfiguracji.
- [ ] Dodaj konfigurację broni zgodną z tabelą w specyfikacji.
- [ ] Uruchom `pnpm test && pnpm typecheck`; oczekiwany wynik: wszystkie kontrole przechodzą.
- [ ] Zatwierdź zmianę: `git commit -m "chore: scaffold multiplayer game workspace"`.

## Etap 2: Pokój, lobby i matchmaking

**Rezultat:** Do jednego pokoju dołącza do 10 graczy przez szybką grę, listę publiczną lub kod, a następnie przechodzą z lobby do odliczania.

**Pliki:**

- utwórz `apps/server/src/rooms/GameRoom.ts`,
- utwórz `apps/server/src/rooms/GameRoom.test.ts`,
- utwórz `apps/server/src/rooms/ServerDirectory.ts` i `ServerDirectory.test.ts`,
- utwórz `apps/server/src/index.ts`,
- utwórz `apps/client/src/net/RoomConnection.ts`.

**Interfejsy:**

```ts
export interface JoinOptions {
  playerName: string;
  mode: GameMode;
  roomCode?: string;
}

export type MatchPhase = "lobby" | "countdown" | "playing" | "finished";
```

- [ ] Napisz test: jedenasty gracz jest odrzucany, a gracze 5 na 5 trafiają do mniej licznej drużyny.
- [ ] Napisz testy unikalności kodu, ukrycia prywatnego pokoju na liście i odrzucenia błędnego kodu.
- [ ] Uruchom test pokoju; oczekiwany wynik: nie przechodzi przed utworzeniem `GameRoom`.
- [ ] Zaimplementuj walidację nazwy 3–16 znaków, limit 10 osób i automatyczny przydział drużyny.
- [ ] Dodaj start 10-sekundowego odliczania po osiągnięciu 2 graczy oraz anulowanie go po spadku poniżej 2 osób.
- [ ] Dodaj klientowi `joinOrCreate("game", options)` oraz komunikaty: łączenie, lobby, błąd i ponowienie.
- [ ] Dodaj publiczną listę serwerów oraz tworzenie prywatnego serwera z losowym sześcioliterowym kodem.
- [ ] Uruchom testy oraz ręcznie otwórz dwie karty; obie mają znaleźć się w tym samym pokoju.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add lobby and room matchmaking"`.

## Etap 3: Mapa, ruch i kolizje

**Rezultat:** Gracz porusza się po mapie FPS, a serwer blokuje przechodzenie przez ściany.

**Pliki:**

- utwórz `apps/client/src/game/GameClient.ts` i `LocalPlayer.ts`,
- utwórz `apps/server/src/simulation/World.ts` i `World.test.ts`,
- utwórz `packages/shared/src/config/movement.ts`,
- utwórz `apps/client/src/maps/Depot.ts` i `Crossroads.ts`.

**Interfejsy:**

```ts
export interface MovementConfig {
  walkSpeed: number;   // 5 m/s
  sprintSpeed: number; // 7 m/s
  jumpSpeed: number;   // 6 m/s
  gravity: number;     // 18 m/s²
}

export function simulatePlayer(
  state: PlayerKinematicState,
  input: PlayerInput,
  deltaSeconds: number,
  colliders: readonly AabbCollider[]
): PlayerKinematicState;
```

- [ ] Napisz testy stałego dystansu ruchu przy krokach 20 Hz, blokowania na ścianie i lądowania po skoku.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą bez `simulatePlayer`.
- [ ] Zaimplementuj serwerową symulację ruchu, grawitacji i kolizji kapsuły z uproszczonymi bryłami mapy.
- [ ] Dodaj klientowi Pointer Lock, wejście WASD, mysz, skok i sprint.
- [ ] Dodaj predykcję lokalną, historię wejść i korektę na podstawie ostatniego numeru sekwencji potwierdzonego przez serwer.
- [ ] Zbuduj mapy `Depot` i `Crossroads` z prostych brył oraz wspólnego opisu kolizji.
- [ ] Uruchom `pnpm test`, a następnie sprawdź ręcznie brak przechodzenia przez ściany.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add authoritative player movement"`.

## Etap 4: Synchronizacja innych graczy

**Rezultat:** Pozycje i obroty zdalnych graczy są płynnie wyświetlane.

**Pliki:**

- utwórz `apps/client/src/game/RemotePlayers.ts`,
- utwórz `apps/client/src/game/SnapshotBuffer.ts` i `SnapshotBuffer.test.ts`,
- zmodyfikuj schemat stanu w `packages/shared/src/state.ts`.

**Interfejsy:**

```ts
export interface PlayerSnapshot {
  serverTime: number;
  position: [number, number, number];
  yaw: number;
  pitch: number;
  alive: boolean;
}

export function sampleSnapshot(
  snapshots: readonly PlayerSnapshot[],
  renderTime: number
): PlayerSnapshot;
```

- [ ] Napisz test interpolacji połowy drogi między dwoma snapshotami oraz zachowania przy braku danych.
- [ ] Uruchom test; oczekiwany wynik: nie przechodzi bez bufora.
- [ ] Zaimplementuj bufor 100 ms i interpolację pozycji oraz kątów.
- [ ] Dodaj low-poly model gracza z oddzielnym kolorem drużyny i animacją kołysania podczas ruchu.
- [ ] Sprawdź w dwóch kartach płynność ruchu i brak renderowania własnego modelu przed kamerą lokalnego gracza.
- [ ] Zatwierdź zmianę: `git commit -m "feat: interpolate remote players"`.

## Etap 5: System broni i walki

**Rezultat:** Wszystkie sześć broni działa, a serwer waliduje strzały, amunicję i obrażenia.

**Pliki:**

- utwórz `apps/server/src/combat/CombatSystem.ts` i `CombatSystem.test.ts`,
- utwórz `apps/server/src/combat/LagCompensation.ts`,
- utwórz `apps/client/src/game/WeaponView.ts`,
- utwórz `apps/client/src/audio/AudioManager.ts`.

**Interfejsy:**

```ts
export interface HitResult {
  targetId: string;
  hitZone: "head" | "torso" | "limb";
  distance: number;
  damage: number;
}

export function validateAndResolveFire(
  shooter: ServerPlayer,
  request: FireRequest,
  world: CombatWorld,
  now: number
): HitResult[];
```

- [ ] Napisz testy odrzucenia strzału bez amunicji, podczas przeładowania, po śmierci i przed upływem czasu szybkostrzelności.
- [ ] Napisz testy mnożników głowy i kończyn, spadku obrażeń oraz ośmiu promieni strzelby.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą bez systemu walki.
- [ ] Zaimplementuj serwerowy hitscan, przeszkody, hitboxy oraz 200 ms historii pozycji.
- [ ] Zaimplementuj magazynki, zapas amunicji, przeładowanie i zmianę broni.
- [ ] Dodaj klientowi modele low-poly, błysk lufy, odrzut kamery, dźwięki i wskaźnik trafienia.
- [ ] Sprawdź ręcznie każdą broń w dwóch kartach oraz uruchom wszystkie testy.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add server-authoritative combat"`.

## Etap 6: Reguły meczów, śmierć i odrodzenie

**Rezultat:** Oba tryby kończą się zgodnie z limitem czasu lub wyniku.

**Pliki:**

- utwórz `apps/server/src/match/MatchRules.ts` i `MatchRules.test.ts`,
- utwórz `apps/server/src/match/SpawnSelector.ts` i `SpawnSelector.test.ts`,
- zmodyfikuj `apps/server/src/rooms/GameRoom.ts`.

**Interfejsy:**

```ts
export interface MatchResult {
  reason: "score_limit" | "time_limit";
  winnerPlayerId?: string;
  winnerTeam?: "blue" | "red";
  draw: boolean;
}

export function selectSafeSpawn(
  candidates: readonly SpawnPoint[],
  alivePlayers: readonly ServerPlayer[],
  team?: "blue" | "red"
): SpawnPoint;
```

- [ ] Napisz testy limitu 50 dla drużyn, limitu 30 dla FFA, końca po 10 minutach i rozstrzygania remisu FFA mniejszą liczbą śmierci.
- [ ] Napisz test wyboru punktu odrodzenia najdalej od widocznego przeciwnika.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą bez reguł meczu.
- [ ] Zaimplementuj śmierć, 3-sekundowy respawn, ochronę 1,5 sekundy oraz przywrócenie wyposażenia.
- [ ] Zaimplementuj wynik, zegar, fazę końcową i powrót do lobby po 15 sekundach.
- [ ] Sprawdź oba tryby z obniżonymi limitami testowymi, a następnie przywróć wartości ze specyfikacji.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add match rules and respawning"`.

## Etap 7: HUD, menu, serwery i ustawienia

**Rezultat:** Gracz widzi wszystkie potrzebne informacje i może ukończyć cały przepływ bez narzędzi deweloperskich.

**Pliki:**

- utwórz `apps/client/src/ui/MainMenu.ts`, `ServerBrowser.ts`, `Lobby.ts`, `Hud.ts`, `Scoreboard.ts` i `Results.ts`,
- utwórz `apps/client/src/ui/Settings.ts`,
- utwórz `apps/client/src/ui/ui.test.ts`.

- [ ] Napisz testy walidacji nazwy oraz wyświetlania czasu, wyniku, zdrowia i amunicji ze stanu gry.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą bez komponentów UI.
- [ ] Zaimplementuj menu z przyciskami: szybka rozgrywka, utwórz serwer, dołącz do serwera, skiny, wyposażenie i ustawienia.
- [ ] Dodaj tworzenie serwera z nazwą, trybem, mapą, widocznością i opcjonalnym kodem oraz listę serwerów z pingiem i liczbą graczy.
- [ ] Dodaj animowany model gracza w aktualnym skinie na środku menu; model ma animację bezczynności i obrót myszą.
- [ ] Zaimplementuj lobby, HUD, kill feed, tabelę `Tab` oraz ekran wyniku z animowanym `VICTORY` lub `DEFEAT`.
- [ ] Zaimplementuj ustawienia czułości, głośności i jakości zapisane w `localStorage`.
- [ ] Dodaj widoczne stany: łączenie, błąd, utrata połączenia i ponawianie.
- [ ] Sprawdź pełny przepływ: menu → lobby → mecz → wynik → lobby.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add complete game interface"`.

## Etap 8: Profile, coiny, skiny i skrzynki

**Rezultat:** Zwycięstwa przyznają coiny, skrzynki odblokowują skiny, a wyposażenie jest zachowane po ponownym uruchomieniu gry.

**Pliki:**

- utwórz `apps/server/src/profile/ProfileStore.ts` i `ProfileStore.test.ts`,
- utwórz `apps/server/src/profile/CrateService.ts` i `CrateService.test.ts`,
- utwórz `apps/server/src/profile/schema.sql`,
- utwórz `apps/client/src/ui/Inventory.ts` i `Inventory.test.ts`,
- utwórz `packages/shared/src/config/skins.ts`.

**Interfejsy:**

```ts
export type SkinRarity = "common" | "rare" | "epic" | "legendary";

export interface PlayerProfile {
  id: string;
  coins: number;
  ownedSkinIds: string[];
  equippedSkinId: string;
  equippedPrimaryWeapon: "smg" | "rifle" | "sniper" | "shotgun";
}

export interface CrateOpenResult {
  skinId: string;
  rarity: SkinRarity;
  duplicate: boolean;
  coinsAfter: number;
}

export function openCrate(profileId: string, idempotencyKey: string): Promise<CrateOpenResult>;
export function awardVictory(matchId: string, profileId: string): Promise<number>;
```

- [ ] Napisz test utworzenia anonimowego profilu z podstawowym skinem i zerowym saldem.
- [ ] Napisz test, że `awardVictory` przyznaje 100 coinów zwycięzcy tylko raz dla danego meczu i profilu.
- [ ] Napisz test, że przegrany i gracz opuszczający mecz przed końcem otrzymują 0 coinów.
- [ ] Napisz test, że skrzynka odejmuje 300 coinów, a brak środków nie zmienia profilu.
- [ ] Napisz deterministyczne testy progów losowania: 60% zwykły, 30% rzadki, 9% epicki i 1% legendarny.
- [ ] Napisz test zamiany duplikatu na 50 coinów i idempotencji powtórzonego żądania otwarcia.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą bez magazynu profili i serwisu skrzynek.
- [ ] Zaimplementuj transakcyjne saldo, historię nagród, własność skinów i zapis wyposażenia w bazie danych.
- [ ] Zaimplementuj tajny token anonimowego profilu: token w przeglądarce, wyłącznie jego skrót w bazie.
- [ ] Dodaj ekran skinów, animację otwierania skrzynki, podgląd rzadkości i natychmiastową aktualizację modelu w menu.
- [ ] Uruchom testy profili dwukrotnie i potwierdź, że ponowione żądania nie naliczają podwójnej nagrody ani kosztu.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add skins coins and reward crates"`.

## Etap 9: Reconnect, bezpieczeństwo i odporność

**Rezultat:** Krótkie zerwanie sieci nie usuwa gracza, a nieprawidłowe wiadomości nie psują meczu.

**Pliki:**

- zmodyfikuj `RoomConnection.ts` i `GameRoom.ts`,
- utwórz `apps/server/src/security/RateLimiter.ts` i `RateLimiter.test.ts`,
- utwórz `apps/server/src/validation/messages.ts` i `messages.test.ts`.

- [ ] Napisz testy odrzucenia `NaN`, nieskończonych współrzędnych, nieznanej broni, zbyt częstych wejść i zbyt częstych strzałów.
- [ ] Napisz test rezerwowania miejsca przez 30 sekund po rozłączeniu.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą przed dodaniem zabezpieczeń.
- [ ] Dodaj walidację każdej wiadomości, limity częstotliwości i bezpieczne logowanie błędów.
- [ ] Dodaj trzy próby reconnectu oraz odzyskanie identyfikatora sesji i stanu gracza.
- [ ] Odłącz sieć na 10 sekund podczas meczu i potwierdź powrót; powtórz przez ponad 30 sekund i potwierdź usunięcie gracza.
- [ ] Zatwierdź zmianę: `git commit -m "feat: harden multiplayer connections"`.

## Etap 10: Trening, obserwowanie i statystyki wersji 1.0

**Rezultat:** Gracz może ćwiczyć bez innych osób, obserwować mecz po śmierci i sprawdzać trwałe statystyki profilu.

**Pliki:**

- utwórz `apps/client/src/training/TrainingMode.ts` i `TrainingMode.test.ts`,
- utwórz `apps/client/src/game/SpectatorCamera.ts` i `SpectatorCamera.test.ts`,
- utwórz `apps/server/src/profile/StatsService.ts` i `StatsService.test.ts`,
- utwórz `apps/client/src/ui/ProfileStats.ts`.

**Interfejsy:**

```ts
export interface CareerStats {
  matchesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  shotsFired: number;
  shotsHit: number;
  playTimeSeconds: number;
}

export function recordCompletedMatch(matchId: string, playerId: string, delta: CareerStats): Promise<void>;
export function getNextSpectatedPlayer(alivePlayerIds: readonly string[], currentId?: string): string | undefined;
```

- [ ] Napisz test trafiania statycznego celu i natychmiastowego odrodzenia celu w treningu.
- [ ] Napisz test przełączania kamery wyłącznie między żyjącymi graczami oraz powrotu do własnej postaci po respawnie.
- [ ] Napisz test idempotentnego zapisu statystyk dla jednego `matchId` i `playerId`.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą przed dodaniem nowych modułów.
- [ ] Dodaj lokalny tryb treningowy na mapie `Depot` z celami, licznikiem trafień, celnością i przyciskiem zakończenia.
- [ ] Dodaj kamerę obserwatora po śmierci, zmianę celu kliknięciem i ukrycie informacji niedostępnych obserwowanemu graczowi.
- [ ] Zapisuj po zakończeniu meczu rozegrane mecze, zwycięstwa, eliminacje, śmierci, strzały, trafienia i czas gry.
- [ ] Dodaj ekran statystyk profilu i test pełnego przepływu trening → mecz → zaktualizowane statystyki.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add training spectating and career stats"`.

## Etap 11: Pipeline zasobów, animacje, VFX i muzyka wersji 1.0

**Rezultat:** Każdy zasób jest zoptymalizowany i ma znaną licencję, postać korzysta z płynnych animacji, a mapy i ekrany mają dopasowaną muzykę oraz skalowalne efekty.

**Pliki:**

- utwórz `apps/client/src/assets/AssetManifest.ts` i `AssetManifest.test.ts`,
- utwórz `apps/client/src/animation/PlayerAnimator.ts` i `PlayerAnimator.test.ts`,
- utwórz `apps/client/src/audio/AudioDirector.ts` i `AudioDirector.test.ts`,
- utwórz `apps/client/src/vfx/VfxPool.ts` i `VfxPool.test.ts`,
- utwórz `tools/assets/validate-assets.ts`,
- utwórz `docs/CREDITS.md` i `docs/ASSET_PIPELINE.md`.

**Interfejsy:**

```ts
export interface LicensedAsset {
  id: string;
  kind: "model" | "animation" | "music" | "sound" | "texture";
  sourceUrl: string;
  author: string;
  licenseId: string;
  attributionRequired: boolean;
  compressedBytes: number;
  triangleCount?: number;
}

export type PlayerAnimationState = "idle" | "walk" | "sprint" | "jump" | "land" | "reload" | "death" | "emote" | "victory";
export type AudioLocation = "menu" | "lobby" | "training" | "depot" | "crossroads" | "victory" | "defeat" | "crate";
export type VfxQuality = "low" | "medium" | "high";
```

- [ ] Napisz test odrzucający zasób bez autora, adresu źródła, identyfikatora licencji lub wpisu wymaganego przypisania.
- [ ] Napisz test budżetu 8 000 trójkątów i 150 KB dla zwykłego obiektu, 25 000 trójkątów i 500 KB dla modelu gracza oraz 20 MB dla mapy.
- [ ] Napisz test grafu animacji idle → walk → sprint → jump → land oraz priorytetów reload, death, emote i victory.
- [ ] Napisz test wyboru muzyki według ekranu i mapy, braku natychmiastowego powtórzenia oraz aktywacji intensywnej warstwy w ostatnich 60 sekundach.
- [ ] Napisz test osobnej regulacji kanałów muzyki, efektów i interfejsu oraz zapisu głośności w ustawieniach.
- [ ] Napisz test, że zmiana jakości VFX ogranicza liczbę i czas życia cząsteczek, ale nie zmienia danych trafienia.
- [ ] Uruchom testy; oczekiwany wynik: nie przechodzą przed utworzeniem pipeline'u.
- [ ] Przygotuj jeden szkielet postaci i retargetuj klipy Mixamo dla wszystkich stanów; przytnij puste klatki i skompresuj ścieżki animacji.
- [ ] Dodaj pulę VFX dla błysku lufy, smug, uderzeń, iskier, łusek, dymu, odłamków i cząsteczek `VICTORY` bez alokacji w gorącej pętli.
- [ ] Dodaj dyrektora audio z dwoma wariantami menu, lobby, treningu, `Depot` i `Crossroads`, stingerami `VICTORY`, `DEFEAT`, skrzynki oraz warstwą napięcia.
- [ ] Dodaj przestrzenne kroki, strzały i uderzenia oraz niespatializowane UI i muzykę.
- [ ] Udokumentuj workflow Sketchfab → kontrola licencji → optymalizacja GLB Shrink → walidacja → manifest → `CREDITS.md`.
- [ ] Uruchom walidator dla wszystkich zasobów i sprawdź ręcznie płynność animacji, przejścia muzyki oraz trzy poziomy jakości VFX.
- [ ] Zatwierdź zmianę: `git commit -m "feat: add licensed asset audio animation and vfx pipeline"`.

## Etap 12: Test pełnego meczu i wydajność

**Rezultat:** Automatyczny test potwierdza synchronizację, a scena spełnia budżet wydajności.

**Pliki:**

- utwórz `tests/e2e/match.spec.ts`,
- utwórz `apps/client/src/debug/PerformancePanel.ts`,
- utwórz `docs/TESTY_MANUALNE.md`.

- [ ] Napisz test Playwright uruchamiający dwie karty, dołączający obu graczy do jednego pokoju i oczekujący fazy `playing`.
- [ ] Rozszerz test o eliminację kontrolowaną przez serwer testowy i potwierdzenie tego samego wyniku w obu kartach.
- [ ] Rozszerz test o zakończenie meczu, komunikat `VICTORY`, przyznanie 100 coinów i zachowanie nagrody po odświeżeniu strony.
- [ ] Dodaj test zakupu skrzynki i wyposażenia zdobytego skina widocznego na animowanym modelu menu.
- [ ] Uruchom `pnpm test:e2e`; oczekiwany wynik: test przechodzi bez ręcznej ingerencji.
- [ ] Dodaj scenariusz obciążenia 10 symulowanych klientów na 15 minut i rejestruj opóźnienie pętli serwera.
- [ ] Zmierz klienta przy 10 modelach; utrzymuj minimum 60 FPS i ogranicz liczbę wywołań rysowania przez współdzielone geometrie i materiały.
- [ ] Opisz testy ręczne wszystkich broni, trybów, przeglądarek i reconnectu w `docs/TESTY_MANUALNE.md`.
- [ ] Uruchom `pnpm test && pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Zatwierdź zmianę: `git commit -m "test: verify multiplayer match end to end"`.

## Etap 13: Wdrożenie wersji 1.0

**Rezultat:** Publiczny adres HTTPS uruchamia klienta, który łączy się z serwerem WSS.

**Pliki:**

- utwórz `Dockerfile`, `.dockerignore` i `.env.example`,
- utwórz `docs/DEPLOYMENT.md`,
- zmodyfikuj konfigurację klienta i serwera dla zmiennych środowiskowych.

- [ ] Dodaj `VITE_GAME_SERVER_URL` po stronie klienta oraz `PORT`, `DATABASE_URL`, `ALLOWED_ORIGINS` i `NODE_ENV` po stronie serwera.
- [ ] Dodaj kontrolę startową, która przerywa uruchomienie produkcyjne przy brakujących lub nieprawidłowych zmiennych.
- [ ] Zbuduj obraz serwera poleceniem `docker build -t low-poly-arena-server .`.
- [ ] Uruchom kontener lokalnie i potwierdź połączenie klienta przez WebSocket.
- [ ] Wdróż statyczny klient oraz serwer Node.js, włącz HTTPS/WSS i ogranicz CORS do adresu klienta.
- [ ] Wykonaj test dymny w Chrome, Edge i Firefox: dołączenie dwóch graczy, eliminacja, wynik, respawn i reconnect.
- [ ] Oznacz wydanie `v1.0.0` po przejściu całej listy kryteriów ze specyfikacji.
- [ ] Zatwierdź zmianę: `git commit -m "chore: prepare version 1.0 deployment"`.

## Kolejność kamieni milowych

1. **Prototyp sieciowy:** etapy 1–4; dwie kapsuły poruszają się po jednej mapie.
2. **Grywalna alfa:** etapy 5–6; wszystkie bronie i oba tryby działają bez pełnego UI.
3. **Beta:** etapy 7–9; pełny przepływ użytkownika, skiny, nagrody, reconnect i zabezpieczenia.
4. **Wersja 1.0:** etapy 10–13; trening, obserwowanie, statystyki, pipeline licencji, animacje, muzyka, VFX, testy, optymalizacja i publiczne wdrożenie.

## Aktualizacja 1.1: Poziomy, zadania, osiągnięcia i głosowanie

**Rezultat:** Gracze otrzymują długoterminowe cele, mogą wybrać następną mapę i rozmawiać w lobby.

**Pliki:**

- utwórz `apps/server/src/progression/ProgressionService.ts` i `ProgressionService.test.ts`,
- utwórz `apps/server/src/progression/QuestService.ts` i `QuestService.test.ts`,
- utwórz `apps/server/src/progression/AchievementService.ts` i `AchievementService.test.ts`,
- utwórz `apps/server/src/match/MapVote.ts` i `MapVote.test.ts`,
- utwórz widoki `Progression.ts`, `Quests.ts`, `Achievements.ts` i `MapVote.ts` w `apps/client/src/ui/`.

- [ ] Napisz test krzywej poziomów, w której poziom 2 wymaga 1 000 XP, a każdy następny wymaga o 250 XP więcej.
- [ ] Napisz test przyznawania XP tylko raz za ukończony mecz.
- [ ] Napisz test generowania dokładnie trzech zadań dziennych i trzech tygodniowych bez duplikatów.
- [ ] Napisz test jednorazowego odebrania nagrody za zadanie i osiągnięcie.
- [ ] Napisz test głosowania na maksymalnie trzy mapy, jednego głosu na gracza i losowego rozstrzygnięcia remisu przez serwer.
- [ ] Zaimplementuj XP, poziomy, zadania, osiągnięcia i transakcyjne nagrody w coinach.
- [ ] Dodaj 30 początkowych osiągnięć oraz pule 12 zadań dziennych i 12 tygodniowych w konfiguracji wspólnej.
- [ ] Dodaj głosowanie po ekranie wyników.
- [ ] Uruchom testy jednostkowe i test E2E: ukończenie meczu → XP → postęp zadania → głosowanie na mapę.
- [ ] Oznacz wydanie `v1.1.0` i zatwierdź zmianę: `git commit -m "feat: add progression quests voting and chat"`.

## Aktualizacja 1.2: Znajomi, drużyny i moderacja

**Rezultat:** Gracze tworzą grupy do pięciu osób, wspólnie dołączają do meczów i mogą bezpiecznie reagować na niewłaściwe zachowanie.

**Pliki:**

- utwórz `apps/server/src/social/FriendService.ts` i `FriendService.test.ts`,
- utwórz `apps/server/src/social/PartyService.ts` i `PartyService.test.ts`,
- utwórz `apps/server/src/moderation/ReportService.ts` i `ReportService.test.ts`,
- utwórz `apps/server/src/moderation/AdminApi.ts` i `AdminApi.test.ts`,
- utwórz klientowe widoki `Friends.ts`, `Party.ts`, `ReportDialog.ts` i `BlockPlayerMenu.ts`.

- [ ] Napisz test zaproszenia, akceptacji, odrzucenia, usunięcia znajomego i blokady zaproszeń od zablokowanej osoby.
- [ ] Napisz test drużyny z jednym liderem, limitem pięciu osób i wspólnym wejściem do jednego pokoju.
- [ ] Napisz test zaproszenia drużyny kodem do serwera prywatnego.
- [ ] Napisz test zgłoszenia z powodem, identyfikatorem meczu i odnośnikiem do autorytatywnych zdarzeń oraz replayu.
- [ ] Napisz test, że zablokowanie gracza odrzuca jego zaproszenia do znajomych i drużyny bez wpływu na stan meczu.
- [ ] Napisz test autoryzacji panelu moderatora oraz nałożenia i wygaśnięcia blokady czasowej.
- [ ] Zaimplementuj obecność online, znajomych, drużyny, zaproszenia, blokowanie kontaktu, zgłoszenia i dziennik działań moderatora.
- [ ] Uruchom test E2E: dwóch znajomych tworzy drużynę, dołącza do meczu, blokuje zaproszenia gracza i wysyła zgłoszenie.
- [ ] Oznacz wydanie `v1.2.0` i zatwierdź zmianę: `git commit -m "feat: add friends parties and moderation"`.

## Aktualizacja 1.3: Dodatkowe tryby gry

**Rezultat:** PolyStrike obsługuje Control, Capture the Flag, Gun Game, Knife Only i Snipers Only.

**Pliki:**

- utwórz `apps/server/src/modes/ControlRules.ts` i `ControlRules.test.ts`,
- utwórz `apps/server/src/modes/CaptureTheFlagRules.ts` i `CaptureTheFlagRules.test.ts`,
- utwórz `apps/server/src/modes/GunGameRules.ts` i `GunGameRules.test.ts`,
- utwórz `apps/server/src/modes/WeaponRestrictionRules.ts` i `WeaponRestrictionRules.test.ts`,
- utwórz `packages/shared/src/config/modes.ts`,
- dodaj klientowe wskaźniki celów w `apps/client/src/ui/ObjectivesHud.ts`.

- [ ] Napisz test Control: punkt nalicza 1 punkt na sekundę drużynie posiadającej przewagę i kończy mecz przy 200 punktach.
- [ ] Napisz test CTF: przejęcie flagi wymaga własnej flagi w bazie, zdobycie daje punkt, a limit wynosi 3.
- [ ] Napisz test Gun Game: eliminacja przesuwa gracza po kolejności `pistol → smg → shotgun → rifle → sniper → knife`, a eliminacja nożem kończy mecz.
- [ ] Napisz test Knife Only odrzucający zmianę na broń palną.
- [ ] Napisz test Snipers Only dopuszczający wyłącznie snajperkę i nóż.
- [ ] Zaimplementuj osobne klasy reguł, stan sieciowy celów i listę map zgodnych z każdym trybem.
- [ ] Dodaj HUD punktu, flagi, aktualnej broni Gun Game i ograniczeń wyposażenia.
- [ ] Uruchom po jednym automatycznym pełnym meczu każdego trybu z co najmniej dwoma klientami.
- [ ] Oznacz wydanie `v1.3.0` i zatwierdź zmianę: `git commit -m "feat: add five additional game modes"`.

## Aktualizacja 1.4: Rozbudowana personalizacja

**Rezultat:** Gracze tworzą kosmetyczny wygląd profilu, postaci i broni bez wpływania na balans.

**Pliki:**

- utwórz `packages/shared/src/config/cosmetics.ts`,
- utwórz `apps/server/src/profile/LoadoutService.ts` i `LoadoutService.test.ts`,
- utwórz `apps/client/src/cosmetics/WeaponSkinRenderer.ts`, `CharmRenderer.ts`, `EmoteController.ts` i `EliminationEffect.ts`,
- utwórz widoki `LoadoutEditor.ts`, `CrosshairEditor.ts` i `ProfileCardEditor.ts`.

- [ ] Napisz test walidacji własności skina broni, emotki, pozy, zawieszki, wizytówki i ramki przed wyposażeniem.
- [ ] Napisz test trzech nazwanych zestawów oraz atomowego przełączania aktywnego zestawu.
- [ ] Napisz test zakresów celownika: wielkość 2–40 px, przerwa 0–20 px, grubość 1–8 px i prawidłowy kolor RGB.
- [ ] Napisz test, że konfiguracja kosmetyczna nie może zmieniać obrażeń, szybkostrzelności, odrzutu ani prędkości ruchu.
- [ ] Dodaj skiny broni, zawieszki, emotki, pozy zwycięstwa, animacje eliminacji, wizytówki, ramki i edytor celownika.
- [ ] Dodaj trzy zestawy wyposażenia i podgląd zmian na animowanym modelu oraz modelu broni.
- [ ] Sprawdź budżet wydajności wszystkich kosmetyków przy 10 graczach i zachowaj minimum 60 FPS.
- [ ] Oznacz wydanie `v1.4.0` i zatwierdź zmianę: `git commit -m "feat: expand cosmetic customization"`.

## Aktualizacja 1.5: Frostbase, Harbor i Neon District

**Rezultat:** Gra otrzymuje trzy wydajne mapy z odrębną pogodą, materiałami, dźwiękiem i muzyką.

**Pliki:**

- utwórz `apps/client/src/maps/Frostbase.ts`, `Harbor.ts` i `NeonDistrict.ts`,
- utwórz `apps/client/src/weather/SnowSystem.ts` i `SnowSystem.test.ts`,
- utwórz `apps/client/src/water/AnalyticHarborWater.ts` i `AnalyticHarborWater.test.ts`,
- utwórz `apps/client/src/materials/WindowInteriors.ts` i `WindowInteriors.test.ts`,
- rozszerz `AudioDirector.ts` i manifest zasobów każdej mapy.

- [ ] Napisz test deterministycznego rozkładu punktów odrodzenia i zgodności uproszczonych kolizji wszystkich trzech map.
- [ ] Napisz test jakości śniegu: niski 1 000, średni 3 000 i wysoki 6 000 cząsteczek, zawsze z czystym obszarem wokół celownika.
- [ ] Napisz test lekkiej wody analitycznej z ograniczoną liczbą fal i zapasowym materiałem bez odbić.
- [ ] Napisz test przełączania wnętrz okien `Neon District` na płaski impostor po przekroczeniu progu LOD.
- [ ] Zbuduj `Frostbase` z opadami, oszronionymi powierzchniami i czytelnymi sylwetkami przeciwników.
- [ ] Zbuduj `Harbor` z wodą analityczną; nie dodawaj oceanu FFT wymagającego WebGPU.
- [ ] Zbuduj `Neon District` z instancjonowanymi oknami, ograniczonym bloomem i trybem bez `three-fenestra`, jeśli test zgodności nie przejdzie.
- [ ] Dodaj po dwa niepowtarzające się utwory: ambient elektroniczny dla `Frostbase`, ciężką elektronikę dla `Harbor` i synthwave dla `Neon District`.
- [ ] Dodaj osobne ambience, pogłos i kroki po śniegu, metalu, betonie oraz mokrej nawierzchni.
- [ ] Przeprowadź test bez post-processingu, test widoczności przeciwnika, test 10 graczy i test minimum 60 FPS dla każdej mapy.
- [ ] Oznacz wydanie `v1.5.0` i zatwierdź zmianę: `git commit -m "feat: add three audiovisual map environments"`.

## Aktualizacja 1.6: Samouczek, dostępność, kontroler, regiony i PWA

**Rezultat:** Nowy gracz uczy się podstaw, może dostosować grę do swoich potrzeb, wybrać szybki region i zainstalować PolyStrike jako aplikację.

**Pliki:**

- utwórz `apps/client/src/tutorial/TutorialFlow.ts` i `TutorialFlow.test.ts`,
- rozszerz `apps/client/src/training/TrainingMode.ts` o strzelnicę,
- utwórz `apps/client/src/accessibility/AccessibilitySettings.ts` i `AccessibilitySettings.test.ts`,
- utwórz `apps/client/src/input/GamepadInput.ts` i `GamepadInput.test.ts`,
- utwórz `apps/client/src/net/RegionSelector.ts` i `RegionSelector.test.ts`,
- utwórz `apps/client/src/pwa/MapCache.ts` i `MapCache.test.ts` oraz manifest PWA.

- [ ] Napisz test sekwencji samouczka: ruch → celowanie → strzał → przeładowanie → zmiana broni → cel trybu.
- [ ] Napisz test strzelnicy mierzącej DPS, celność i czas eliminacji dla każdej broni bez przyznawania nagród profilu.
- [ ] Napisz test zakresu FOV 70–110°, trybów kolorów, ograniczenia kołysania, błysków, drgań i napisów dźwiękowych.
- [ ] Napisz test wykrywania konfliktów przypisania klawiszy oraz przywracania ustawień domyślnych.
- [ ] Napisz test martwej strefy, krzywej drążka i rozpoznania odłączenia kontrolera; asysta celowania ma być wyłączona w rankingu.
- [ ] Napisz test wyboru regionu według najniższej mediany z trzech pomiarów oraz ręcznego nadpisania wyboru.
- [ ] Napisz test wersjonowanego cache PWA, odrzucenia niepełnej mapy i usunięcia zasobów starego wydania.
- [ ] Zaimplementuj samouczek, ruchome cele, dostępność, pełne mapowanie sterowania, Gamepad API, wybór regionu i instalację PWA.
- [ ] Uruchom audyt klawiatury, myszy i kontrolera oraz test offline menu z poprawnym komunikatem o braku serwera.
- [ ] Oznacz wydanie `v1.6.0` i zatwierdź zmianę: `git commit -m "feat: add onboarding accessibility regions and pwa"`.

## Aktualizacja 1.7: Killcam, replay, najlepsze akcje i komunikacja

**Rezultat:** Gracze oglądają śmierć i powtórki, zapisują najlepsze akcje oraz komunikują się bez mikrofonu.

**Pliki:**

- utwórz `apps/server/src/replay/ReplayRecorder.ts` i `ReplayRecorder.test.ts`,
- utwórz `apps/client/src/replay/ReplayPlayer.ts`, `Killcam.ts` i ich testy,
- utwórz `apps/server/src/replay/HighlightSelector.ts` i `HighlightSelector.test.ts`,
- utwórz `apps/server/src/team/PingService.ts` i `PingService.test.ts`,
- utwórz `apps/client/src/ui/CommunicationWheel.ts`.

**Interfejsy:**

```ts
export interface ReplayFrame { serverTime: number; players: ReplayPlayerState[]; }
export type ReplayEvent =
  | { serverTime: number; type: "fire"; playerId: string; weaponId: WeaponId }
  | { serverTime: number; type: "hit"; attackerId: string; targetId: string; damage: number }
  | { serverTime: number; type: "kill"; attackerId: string; targetId: string }
  | { serverTime: number; type: "objective"; playerId: string; objectiveId: string; points: number }
  | { serverTime: number; type: "ping"; ping: TeamPing };
export interface TeamPing { ownerId: string; kind: "enemy" | "help" | "move" | "weapon" | "defend" | "retreat"; position: [number, number, number]; expiresAt: number; }
```

- [ ] Napisz test zapisu snapshotów 10 Hz i zdarzeń w poprawnej kolejności czasu.
- [ ] Napisz test killcamu obejmującego dokładnie ostatnie 8 sekund przed śmiercią i bezpieczne pominięcie.
- [ ] Napisz test seek, pauzy, prędkości odtwarzania, zmiany gracza i kamery swobodnej pełnego replayu.
- [ ] Napisz test deterministycznego wyboru najlepszej akcji na podstawie serii eliminacji i celów trybu.
- [ ] Napisz test limitu pingów, walidacji pozycji, czasu życia i widoczności wyłącznie dla drużyny.
- [ ] Zaimplementuj skompresowany format replayu z identyfikatorem wersji protokołu i ograniczonym okresem przechowywania.
- [ ] Dodaj killcam, przeglądarkę replayów, eksport klipu najlepszej akcji oraz koło sześciu komunikatów.
- [ ] Uruchom test E2E: eliminacja → killcam → pełny replay → znacznik drużyny widoczny tylko dla sojusznika.
- [ ] Oznacz wydanie `v1.7.0` i zatwierdź zmianę: `git commit -m "feat: add replays killcam highlights and team pings"`.

## Aktualizacja 1.8: Konta i synchronizacja postępu

**Rezultat:** Gość może połączyć profil z bezpiecznym kontem i korzystać z tego samego postępu na wielu urządzeniach.

**Pliki:**

- utwórz `apps/server/src/auth/AccountService.ts` i `AccountService.test.ts`,
- utwórz `apps/server/src/auth/SessionService.ts` i `SessionService.test.ts`,
- utwórz `apps/server/src/auth/PasswordResetService.ts` i `PasswordResetService.test.ts`,
- utwórz `apps/server/src/privacy/DataRightsService.ts` i `DataRightsService.test.ts`,
- utwórz klientowe widoki `SignUp.ts`, `SignIn.ts`, `PasswordReset.ts` i `AccountSettings.ts`.

- [ ] Napisz test atomowego połączenia gościa z kontem bez utraty coinów, skinów, statystyk i wyposażenia.
- [ ] Napisz test unikalności e-maila, weryfikacji adresu i haszowania hasła przez Argon2id z aktualnymi parametrami zapisanymi przy skrócie.
- [ ] Napisz test sesji z rotacją tokenu, limitem urządzeń, wylogowaniem wszystkich sesji i unieważnieniem skradzionego tokenu.
- [ ] Napisz test jednorazowego, wygasającego tokenu odzyskiwania bez ujawniania, czy adres istnieje.
- [ ] Napisz test rozstrzygania konfliktu ustawień przez wersję rekordu oraz idempotencji operacji ekonomii.
- [ ] Napisz test eksportu danych i odroczonego usunięcia konta z anulowaniem w okresie ochronnym.
- [ ] Zaimplementuj rejestrację, logowanie, weryfikację, odzyskiwanie, sesje, synchronizację profilu oraz dziennik audytowy.
- [ ] Uruchom test E2E na dwóch profilach przeglądarki: logowanie → wspólny ekwipunek → zmiana ustawień → synchronizacja.
- [ ] Oznacz wydanie `v1.8.0` i zatwierdź zmianę: `git commit -m "feat: add accounts and cross device progression"`.

## Aktualizacja 2.0: Ranking 5 na 5, rangi i sezony

**Rezultat:** Kwalifikujący się gracze rywalizują w osobnej kolejce rankingowej z sezonami i tabelami wyników.

**Pliki:**

- utwórz `apps/server/src/ranked/RatingService.ts` i `RatingService.test.ts`,
- utwórz `apps/server/src/ranked/RankedMatchmaker.ts` i `RankedMatchmaker.test.ts`,
- utwórz `apps/server/src/ranked/SeasonService.ts` i `SeasonService.test.ts`,
- utwórz `apps/server/src/ranked/LeaderboardService.ts` i `LeaderboardService.test.ts`,
- utwórz klientowe widoki `RankedQueue.ts`, `RankBadge.ts`, `SeasonProgress.ts` i `Leaderboard.ts`.

- [ ] Napisz test blokady kolejki przed poziomem 10 lub 20 ukończonymi zwykłymi meczami.
- [ ] Napisz test tworzenia meczu wyłącznie z dwóch pełnych drużyn po pięciu graczy.
- [ ] Napisz test aktualizacji ukrytej oceny po wyniku meczu bez uwzględniania zakupionych kosmetyków.
- [ ] Napisz test progów rang: Brąz, Srebro, Złoto, Platyna, Diament i Mistrz.
- [ ] Napisz test pięciu kwalifikacji, sezonu 12-tygodniowego i częściowego resetu oceny.
- [ ] Napisz test kary za opuszczenie meczu oraz braku podwójnej kary po reconnectcie.
- [ ] Napisz test stronicowanych tabel światowych i regionalnych z deterministycznym rozstrzyganiem remisów.
- [ ] Zaimplementuj kolejkę, dobór drużyn, ocenę, rangi, sezony, kwalifikacje, kary i kosmetyczne nagrody sezonowe.
- [ ] Przeprowadź symulację co najmniej 10 000 wyników i sprawdź stabilność rozkładu rang oraz brak nieskończonych kolejek testowych.
- [ ] Uruchom test E2E pełnego meczu rankingowego, aktualizacji rang i tabeli wyników.
- [ ] Oznacz wydanie `v2.0.0` i zatwierdź zmianę: `git commit -m "feat: launch ranked seasons"`.

## Aktualizacja 2.1: Klany, turnieje i wydarzenia

**Rezultat:** Gracze organizują społeczności, rozgrywki turniejowe i bezpiecznie konfigurowane wydarzenia.

**Pliki:**

- utwórz `apps/server/src/clans/ClanService.ts` i `ClanService.test.ts`,
- utwórz `apps/server/src/tournaments/TournamentService.ts` i `TournamentService.test.ts`,
- utwórz `apps/server/src/rooms/CustomRules.ts` i `CustomRules.test.ts`,
- utwórz `apps/server/src/events/SeasonalEventService.ts` i `SeasonalEventService.test.ts`,
- utwórz `apps/server/src/events/CommunityChallengeService.ts` i `CommunityChallengeService.test.ts`,
- utwórz klientowe widoki `Clan.ts`, `Tournament.ts`, `CustomServerRules.ts` i `Events.ts`.

- [ ] Napisz test klanu z limitem 50 osób, unikalną nazwą i skrótem, rolami oraz dziennikiem zmian.
- [ ] Napisz test drabinek 4, 8 i 16 drużyn, blokady składu oraz wyniku przyjmowanego wyłącznie z serwera gry.
- [ ] Napisz test dozwolonej listy własnych reguł i odrzucenia wartości spoza bezpiecznych zakresów.
- [ ] Napisz test rozpoczęcia i końca wydarzenia według czasu serwera oraz jednorazowych nagród kosmetycznych.
- [ ] Napisz test wyzwania społecznościowego liczącego wyłącznie autorytatywne zdarzenia bez podwójnego naliczenia.
- [ ] Zaimplementuj klany, zaproszenia, turnieje, własne reguły, kalendarz wydarzeń i globalne postępy wyzwań.
- [ ] Uruchom test E2E turnieju czterech drużyn i wydarzenia wygasającego bez ręcznej ingerencji.
- [ ] Oznacz wydanie `v2.1.0` i zatwierdź zmianę: `git commit -m "feat: add clans tournaments and live events"`.

## Aktualizacja 2.2: Boty zastępujące rozłączonych graczy

**Rezultat:** Nierankingowy mecz pozostaje grywalny po rozłączeniu, bez udawania prawdziwego gracza ani przewagi wynikającej z pełnej wiedzy serwera.

**Pliki:**

- utwórz `apps/server/src/bots/BotController.ts` i `BotController.test.ts`,
- utwórz `apps/server/src/bots/BotPerception.ts` i `BotPerception.test.ts`,
- utwórz `apps/server/src/bots/NavGraph.ts` i `NavGraph.test.ts`,
- utwórz `packages/shared/src/config/bots.ts`.

- [ ] Napisz test podstawienia bota po rozłączeniu i natychmiastowego oddania miejsca po reconnectcie.
- [ ] Napisz test ograniczonego pola widzenia, słuchu, czasu reakcji i braku dostępu do niewidocznego przeciwnika.
- [ ] Napisz test nawigacji do celu, omijania przeszkód i wyjścia z zakleszczenia.
- [ ] Napisz test trzech poziomów trudności oraz blokady botów w rankingu i turniejach.
- [ ] Napisz test, że eliminacja bota liczy się do wyniku meczu, ale nie do zadań wymagających prawdziwego gracza.
- [ ] Zaimplementuj deterministyczne drzewo zachowań, percepcję, nawigację, celowanie z błędem i limity czasu CPU.
- [ ] Przeprowadź test 10 botów przez 30 minut na wszystkich mapach i sprawdź brak zakleszczeń oraz budżet pętli serwera.
- [ ] Oznacz wydanie `v2.2.0` i zatwierdź zmianę: `git commit -m "feat: add disconnect replacement bots"`.

## Aktualizacja 2.3: Edytor i mapy społeczności

**Rezultat:** Gracze budują bezpieczne mapy z zatwierdzonych modułów, publikują wersje i otrzymują oceny.

**Pliki:**

- utwórz `apps/client/src/editor/MapEditor.ts`, `PrefabPalette.ts` i `MapPreview.ts`,
- utwórz `apps/server/src/community/MapValidator.ts` i `MapValidator.test.ts`,
- utwórz `apps/server/src/community/MapPublishingService.ts` i `MapPublishingService.test.ts`,
- utwórz `apps/server/src/community/MapRatingService.ts` i `MapRatingService.test.ts`,
- utwórz `packages/shared/src/community/MapFormat.ts`.

- [ ] Zdefiniuj wersjonowany format JSON zawierający wyłącznie identyfikatory zatwierdzonych prefabów, transformacje, spawny, cele, granice i metadane.
- [ ] Napisz test odrzucenia własnego kodu, nieznanego prefabu, transformacji z `NaN`, przekroczonej liczby obiektów i limitu 20 MB.
- [ ] Napisz test osiągalności celów, bezpiecznych odległości spawnów, granic planszy i zgodności trybów.
- [ ] Napisz test niezmiennych wersji publikacji, własności autora, listy zmian i moderowanego statusu.
- [ ] Napisz test jednej oceny na gracza po ukończonym meczu oraz blokady samooceny.
- [ ] Zaimplementuj edytor siatkowy z cofaniem, ponawianiem, testem lokalnym, miniaturą i publikacją bez wykonywania skryptów użytkownika.
- [ ] Uruchom test E2E: budowa → walidacja → publikacja → moderacja → mecz → ocena.
- [ ] Oznacz wydanie `v2.3.0` i zatwierdź zmianę: `git commit -m "feat: add safe community map editor"`.

## Aktualizacja 2.4: Anty-cheat, kary i odwołania

**Rezultat:** System wykrywa niemożliwe zachowania na podstawie danych serwera, wspiera ręczną kontrolę i zapewnia przejrzystą procedurę odwoławczą.

**Pliki:**

- utwórz `apps/server/src/anticheat/RuleEngine.ts` i `RuleEngine.test.ts`,
- utwórz `apps/server/src/anticheat/AnomalyDetector.ts` i `AnomalyDetector.test.ts`,
- utwórz `apps/server/src/moderation/CaseService.ts` i `CaseService.test.ts`,
- utwórz `apps/server/src/moderation/AppealService.ts` i `AppealService.test.ts`,
- utwórz klientowe widoki `PenaltyHistory.ts` i `AppealForm.ts`.

- [ ] Napisz test reguł niemożliwej prędkości, szybkostrzelności, amunicji, pozycji, obrotu oraz linii strzału.
- [ ] Napisz test analizy odchyleń celności, czasu reakcji i śledzenia celu bez automatycznej trwałej blokady.
- [ ] Napisz test przypadku łączącego replay, zdarzenia serwera, wersję klienta i naruszone reguły.
- [ ] Napisz test kary z powodem, dowodem, autorem, czasem, wygaśnięciem i pełnym dziennikiem zmian.
- [ ] Napisz test jednego odwołania na karę oraz wykluczenia pierwotnego moderatora z rozpatrywania.
- [ ] Zaimplementuj reguły czasu rzeczywistego, analizę okresową, kolejkę kontroli, historię kar i odwołania bez skanowania urządzenia.
- [ ] Uruchom replaye prawidłowych i sztucznie nieprawidłowych meczów; zmierz fałszywe alarmy i nie uruchamiaj automatycznej trwałej blokady.
- [ ] Oznacz wydanie `v2.4.0` i zatwierdź zmianę: `git commit -m "feat: add server evidence anticheat and appeals"`.

## Aktualizacja 2.5: Mistrzostwo broni, medale i kontrakty

**Rezultat:** Używanie każdej broni zapewnia osobny kosmetyczny rozwój, a dobre zagrania są czytelnie nagradzane podczas meczu.

**Pliki:**

- utwórz `apps/server/src/mastery/WeaponMasteryService.ts` i `WeaponMasteryService.test.ts`,
- utwórz `apps/server/src/match/MedalService.ts` i `MedalService.test.ts`,
- utwórz `apps/server/src/mastery/WeaponContractService.ts` i `WeaponContractService.test.ts`,
- utwórz `packages/shared/src/config/mastery.ts` i `contracts.ts`,
- utwórz klientowe widoki `WeaponMastery.ts`, `ContractProgress.ts` i `MedalFeed.ts`.

- [ ] Napisz test osobnego postępu każdej broni oraz jednorazowych kosmetycznych nagród poziomów.
- [ ] Napisz test medali: headshot, double kill w 5 sekund, triple kill w 8 sekund, seria 5, zemsta, przerwanie serii i obrona celu.
- [ ] Napisz test kontraktów z licznikiem zatwierdzanych wyłącznie zdarzeń serwera i brakiem postępu w treningu lub przeciw botom.
- [ ] Napisz test, że nagrody mistrzostwa i kontraktów nie zmieniają konfiguracji obrażeń, szybkostrzelności, odrzutu ani ruchu.
- [ ] Zaimplementuj poziomy mistrzostwa, medale, kontrakty, idempotentne nagrody i ekran postępu.
- [ ] Uruchom test E2E: ukończenie kontraktu → medal w meczu → odblokowanie kosmetyku → zachowanie po ponownym logowaniu.
- [ ] Oznacz wydanie `v2.5.0` i zatwierdź zmianę: `git commit -m "feat: add weapon mastery medals and contracts"`.

## Aktualizacja 2.6: Poddanie, AFK i tryb komentatora

**Rezultat:** Nierozstrzygalny mecz można zakończyć zgodnym głosowaniem, bezczynni gracze nie blokują drużyny, a turnieje otrzymują bezpieczny widok transmisyjny.

**Pliki:**

- utwórz `apps/server/src/match/SurrenderVote.ts` i `SurrenderVote.test.ts`,
- utwórz `apps/server/src/match/AfkService.ts` i `AfkService.test.ts`,
- utwórz `apps/server/src/spectator/CasterFeed.ts` i `CasterFeed.test.ts`,
- utwórz klientowe widoki `SurrenderVote.ts`, `AfkWarning.ts` i `CasterHud.ts`.

- [ ] Napisz test blokady poddania przed 5. minutą, progu 4 z 5, czasu 30 sekund i cooldownu 3 minut.
- [ ] Napisz test ostrzeżenia po 90 sekundach bezczynności, zastąpienia botem po 120 sekundach i odzyskania miejsca po powrocie.
- [ ] Napisz test, że syntetyczne pakiety bez zmiany zachowania gracza nie resetują licznika AFK.
- [ ] Napisz test publicznego obrazu komentatora opóźnionego o co najmniej 120 sekund oraz prywatnego obrazu sędziego chronionego rolą.
- [ ] Napisz test, że klient komentatora nie ma endpointu zmieniającego wynik, pozycję, zdrowie ani stan celu.
- [ ] Zaimplementuj poddanie, AFK, podstawienie bota, opóźniony feed i HUD komentatora.
- [ ] Uruchom test E2E meczu turniejowego z poddaniem, AFK, reconnectem i obserwatorem opóźnionym.
- [ ] Oznacz wydanie `v2.6.0` i zatwierdź zmianę: `git commit -m "feat: add surrender afk handling and caster mode"`.

## Aktualizacja 2.7: Interaktywne i częściowo zniszczalne mapy

**Rezultat:** Wybrane mapy otrzymują zsynchronizowane elementy reagujące na graczy bez kosztownej, niedeterministycznej pełnej destrukcji.

**Pliki:**

- utwórz `apps/server/src/world/InteractiveObjectSystem.ts` i `InteractiveObjectSystem.test.ts`,
- utwórz `apps/server/src/world/DestructibleCover.ts` i `DestructibleCover.test.ts`,
- utwórz `apps/server/src/world/MapHazardSystem.ts` i `MapHazardSystem.test.ts`,
- utwórz `packages/shared/src/state/interactiveObjects.ts`,
- utwórz klientowe prezentacje `DoorView.ts`, `MovingPlatformView.ts`, `ExplosiveView.ts` i `HazardView.ts`.

- [ ] Napisz test autorytatywnego otwierania drzwi, ruchu windy i platformy z identycznym wynikiem przy stałym kroku 20 Hz.
- [ ] Napisz test beczki z obrażeniami malejącymi według odległości, przeszkodami blokującymi eksplozję i ochroną sojuszników zgodną z trybem.
- [ ] Napisz test trzech stanów osłony: cała, uszkodzona i zniszczona oraz późnego dołączenia klienta do aktualnego stanu.
- [ ] Napisz test harmonogramu pociągu, kruchego lodu i zamykanego przejścia oraz zapisu wszystkich przejść stanu w replayu.
- [ ] Napisz walidator blokujący element nachodzący na spawn, cel lub jedyne wyjście z obszaru.
- [ ] Zaimplementuj stan serwera, interpolowane widoki klienta, VFX zniszczenia i możliwość wyłączenia zagrożeń przed meczem prywatnym.
- [ ] Uruchom test 10 graczy z maksymalną liczbą interakcji i sprawdź budżet serwera oraz minimum 60 FPS klienta.
- [ ] Oznacz wydanie `v2.7.0` i zatwierdź zmianę: `git commit -m "feat: add interactive hazards and staged destruction"`.

## Aktualizacja 2.8: Fotografia, aktualności, języki i integracje

**Rezultat:** PolyStrike wspiera prezentowanie najlepszych akcji, polski i angielski interfejs, publiczne profile, aktualności oraz bezpieczne integracje turniejowe.

**Pliki:**

- utwórz `apps/client/src/replay/PhotoMode.ts` i `PhotoMode.test.ts`,
- utwórz `apps/client/src/news/NewsCenter.ts` i `NewsCenter.test.ts`,
- utwórz `apps/client/src/i18n/pl.ts`, `en.ts` i `i18n.test.ts`,
- utwórz `apps/server/src/public/PublicProfileService.ts` i `PublicProfileService.test.ts`,
- utwórz `apps/server/src/api/TournamentApi.ts` i `TournamentApi.test.ts`,
- utwórz `apps/server/src/rotation/DailyRotation.ts` i `DailyRotation.test.ts`,
- utwórz `apps/client/src/replay/HighlightClipExporter.ts` i `HighlightClipExporter.test.ts`.

- [ ] Napisz test blokady trybu fotograficznego podczas żywego meczu oraz działania kamery, FOV, głębi ostrości i ukrycia HUD w replayu.
- [ ] Napisz test podpisu manifestu aktualności, dozwolonego Markdownu bez skryptów i zgodności wersji klienta.
- [ ] Napisz test kompletności kluczy polskich i angielskich, formatowania liczb, dat i braku tekstów UI wpisanych bezpośrednio w kodzie.
- [ ] Napisz test ustawień prywatności publicznego profilu i ukrycia e-maila, historii kar oraz prywatnych identyfikatorów.
- [ ] Napisz test API tylko do odczytu z kluczami, wersją `/v1`, paginacją i limitem żądań.
- [ ] Napisz test codziennej rotacji według czasu serwera, podpisanej konfiguracji i wykluczenia kolejki rankingowej.
- [ ] Napisz test eksportu krótkiego klipu wyłącznie po decyzji gracza i bez automatycznej publikacji.
- [ ] Zaimplementuj tryb fotograficzny, centrum aktualności, lokalizację, publiczne profile, API, rotacje i eksport klipów.
- [ ] Uruchom audyt dostępności obu języków oraz test E2E: replay → zdjęcie → klip → publiczny profil → wynik przez API.
- [ ] Oznacz wydanie `v2.8.0` i zatwierdź zmianę: `git commit -m "feat: add localization presentation and tournament integrations"`.

## Aktualizacja 2.9: Dopracowanie, diagnostyka i odporność

**Rezultat:** Gra lepiej prezentuje mecze, automatycznie dobiera ustawienia, diagnozuje sieć i odzyskuje sesję po awarii.

**Pliki:**

- utwórz `apps/client/src/game/WeaponInspect.ts` i `WeaponInspect.test.ts`,
- utwórz `apps/client/src/presentation/TeamIntro.ts`, `VictoryPodium.ts` i ich testy,
- utwórz `apps/server/src/match/WarmupPhase.ts` i `WarmupPhase.test.ts`,
- utwórz `apps/client/src/ui/ServerHistory.ts` i `ServerHistory.test.ts`,
- utwórz `apps/client/src/graphics/AutoBenchmark.ts` i `AutoBenchmark.test.ts`,
- utwórz `apps/client/src/net/NetworkDiagnostics.ts` i `NetworkDiagnostics.test.ts`,
- utwórz `apps/client/src/recovery/MatchRecovery.ts` i `MatchRecovery.test.ts`,
- utwórz `apps/client/src/sharing/SettingsCode.ts` i `SettingsCode.test.ts`,
- utwórz `apps/client/src/maps/MapVariant.ts` i `MapVariant.test.ts`,
- utwórz `apps/client/src/training/TimedChallenge.ts` i `TrainingGhost.ts`,
- utwórz `apps/client/src/audio/Announcer.ts` i `Announcer.test.ts`,
- utwórz `apps/client/src/status/ServiceStatus.ts` i `ServiceStatus.test.ts`,
- utwórz `apps/client/src/recovery/SafeMode.ts` i `SafeMode.test.ts`.

- [ ] Napisz test przerwania animacji oglądania broni przez strzał, przeładowanie i zmianę broni.
- [ ] Napisz test prezentacji dokładnie aktywnych graczy oraz podium wyłącznie zwycięzców z wyposażonym skinem i pozą.
- [ ] Napisz test rozgrzewki do 60 sekund bez naliczania wyniku, statystyk, zadań, kontraktów ani nagród.
- [ ] Napisz test ulubionych serwerów i historii ograniczonej do ostatnich 20 unikalnych pozycji.
- [ ] Napisz deterministyczny test progów benchmarku dla ustawień niskich, średnich, wysokich i trybu własnego.
- [ ] Napisz test obliczania ping, jitteru, utraty pakietów i jakości synchronizacji bez odczytu adresów innych klientów.
- [ ] Napisz test odzyskania aktywnego meczu po odświeżeniu i wygaśnięcia prób po 30 sekundach.
- [ ] Napisz test wersjonowanego kodu ustawień celownika i wyposażenia, sumy kontrolnej oraz braku identyfikatora konta.
- [ ] Napisz test wariantów dnia, nocy, deszczu i zimy zachowujących identyczne kolizje, spawny i cele.
- [ ] Napisz test wyzwania treningowego oraz ducha zapisującego wyłącznie wejście i czas lokalnego najlepszego wyniku.
- [ ] Napisz test lektora z cooldownem, priorytetem komunikatów i całkowitym wyciszeniem w ustawieniach.
- [ ] Napisz test podpisanego statusu regionów, zaplanowanych przerw i incydentów bez wykonywania treści jako kodu.
- [ ] Napisz test aktywacji trybu bezpiecznego po trzech awariach tej samej wersji oraz ręcznego wyjścia z tego trybu.
- [ ] Zaimplementuj wszystkie moduły, dodaj test E2E: benchmark → ulubiony serwer → rozgrzewka → mecz → podium → odświeżenie → reconnect.
- [ ] Przetestuj warianty map i tryb bezpieczny na minimalnej grafice oraz potwierdź brak wpływu na autorytatywny stan meczu.
- [ ] Oznacz wydanie `v2.9.0` i zatwierdź zmianę: `git commit -m "feat: polish presentation diagnostics and recovery"`.

## Wersja 3.0: Bezpieczeństwo operacyjne, utrzymanie i zgodność

**Rezultat:** PolyStrike może być bezpiecznie utrzymywany, aktualizowany, skalowany i odtwarzany po awarii, a wymagane dokumenty są gotowe do niezależnego przeglądu prawnego.

**Pliki:**

- utwórz `apps/client/src/telemetry/CrashReporter.ts` i `CrashReporter.test.ts`,
- utwórz `apps/client/src/telemetry/ConsentManager.ts` i `ConsentManager.test.ts`,
- utwórz `apps/server/src/telemetry/TelemetryIngest.ts` i `TelemetryIngest.test.ts`,
- utwórz `apps/server/src/admin/EconomyAuditService.ts` i `EconomyAuditService.test.ts`,
- utwórz `apps/server/src/features/FeatureFlags.ts` i `FeatureFlags.test.ts`,
- utwórz `infra/backup/backup.yml`, `restore-test.yml` i `RETENTION.md`,
- utwórz `infra/monitoring/dashboards.yml`, `alerts.yml` i `runbooks/`,
- utwórz `infra/deploy/staged-rollout.yml`, `rollback.yml` i `autoscaling.yml`,
- utwórz `docs/PRIVACY_DRAFT.md`, `TERMS_DRAFT.md`, `CODE_OF_CONDUCT.md`, `PARENTAL_CONTROLS.md` i `LEGAL_REVIEW_CHECKLIST.md`.

**Interfejsy:**

```ts
export interface TelemetryConsent { crashReports: boolean; anonymousAnalytics: boolean; updatedAt: string; }
export interface EconomyAuditEntry { profileId: string; transactionId: string; source: string; coinDelta: number; itemDelta: string[]; createdAt: string; approvedBy?: [string, string]; }
export interface FeatureFlagRule { flagId: string; environment: "local" | "test" | "staging" | "production"; regions: string[]; rolloutPercent: number; enabled: boolean; }
```

- [ ] Napisz test usuwania tokenów, e-maili, adresów i treści prywatnych z raportu awarii przed wysłaniem.
- [ ] Napisz test osobnej zgody na awarie i analitykę, zmiany zgody oraz braku wysyłki po wyłączeniu.
- [ ] Napisz test limitu rozmiaru, częstotliwości, dozwolonych schematów i wersji wiadomości telemetrycznej.
- [ ] Napisz test szyfrowanej kopii, retencji oraz odtworzenia do odizolowanej bazy z porównaniem sum kontrolnych i liczby rekordów.
- [ ] Napisz syntetyczne kontrole dostępności klienta, matchmakingu, pokoju, bazy profili, ekonomii i publicznego API.
- [ ] Zdefiniuj alarmy dla dostępności, p95 opóźnienia, błędów, reconnectów, CPU, pamięci, kolejek i nieudanej kopii; każdy alarm ma właściciela i runbook.
- [ ] Napisz test skalowania w górę i w dół bez zamykania aktywnego pokoju oraz z minimalną liczbą procesów zapasowych.
- [ ] Napisz test limitów połączeń, wielkości pakietów, zapytań API oraz awaryjnego blokowania wybranego endpointu lub regionu.
- [ ] Napisz test wdrożenia stopniowego 5% → 25% → 100% i automatycznego rollbacku po przekroczeniu progu błędów.
- [ ] Napisz test flag funkcji według środowiska, regionu i deterministycznego procentu kont; klient nie może sam aktywować flagi.
- [ ] Napisz test blokujący połączenie procesu staging z produkcyjną bazą, domeną lub kluczem.
- [ ] Napisz test pełnego dziennika ekonomii oraz korekty wymagającej dwóch różnych uprawnionych administratorów.
- [ ] Zaimplementuj monitoring, stopniowe wdrożenia, rollback, autoscaling, flagi funkcji, kopie, test odtwarzania i bezpieczny panel ekonomii.
- [ ] Przygotuj szkice polityki prywatności, regulaminu, zasad zachowania i kontroli rodzicielskiej bez uznawania ich za zatwierdzone dokumenty prawne.
- [ ] Zleć niezależny przegląd prawny dla krajów publikacji, modelu ekonomii, skrzynek, wieku odbiorców, retencji danych i procesu usuwania konta.
- [ ] Przeprowadź ćwiczenie awarii: utrata procesu, utrata regionu, błędne wydanie, nieudana migracja i odtworzenie bazy; zapisz czasy odzyskania i wnioski.
- [ ] Oznacz wydanie `v3.0.0` dopiero po przejściu testu odtwarzania, rollbacku, obciążenia, bezpieczeństwa i checklisty prawnej.
- [ ] Zatwierdź zmianę: `git commit -m "chore: add production operations security and compliance"`.

## Mapa wydań po wersji 1.0

1. **1.1:** poziomy, doświadczenie, zadania, osiągnięcia i głosowanie na mapę.
2. **1.2:** znajomi, drużyny, zaproszenia, blokowanie kontaktu, zgłoszenia i narzędzia moderatora.
3. **1.3:** Control, Capture the Flag, Gun Game, Knife Only i Snipers Only.
4. **1.4:** skiny broni, emotki, pozy, zawieszki, animacje eliminacji, wizytówki, ramki, celowniki i zestawy.
5. **1.5:** Frostbase, Harbor i Neon District z własną pogodą, dźwiękiem i muzyką.
6. **1.6:** samouczek, strzelnica, dostępność, kontroler, regiony i PWA.
7. **1.7:** killcam, replay, najlepsze akcje, koło komunikatów i znaczniki.
8. **1.8:** konta, odzyskiwanie i synchronizacja postępu.
9. **2.0:** ranking 5 na 5, rangi, kwalifikacje, sezony i tabele wyników.
10. **2.1:** klany, turnieje, własne reguły, wydarzenia i wyzwania społeczności.
11. **2.2:** boty zastępujące rozłączonych graczy.
12. **2.3:** bezpieczny edytor, publikacja i oceny map społeczności.
13. **2.4:** rozszerzony anty-cheat, historia kar i odwołania.
14. **2.5:** mistrzostwo broni, medale meczowe i kosmetyczne kontrakty.
15. **2.6:** poddanie meczu, wykrywanie AFK i bezpieczny tryb komentatora.
16. **2.7:** interaktywne mapy, etapowe zniszczenia i zagrożenia środowiskowe.
17. **2.8:** tryb fotograficzny, aktualności, polski i angielski, publiczne profile, API i rotacje.
18. **2.9:** prezentacja meczu, rozgrzewka, serwery, benchmark, diagnostyka, warianty map, trening i odzyskiwanie po awarii.
19. **3.0:** kopie zapasowe, monitoring, skalowanie, ochrona ruchu, stopniowe wdrożenia, rollback, flagi funkcji, audyt ekonomii i przegląd prawny.
