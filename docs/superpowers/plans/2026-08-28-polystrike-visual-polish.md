# PolyStrike Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nadać menu, skrzynkom, HUD-owi i arenom spójny, nowoczesny wygląd low-poly FPS.

**Architecture:** Styl bazowy pozostaje w `style.css`, a elementy tworzone dynamicznie w `main.ts` dostają klasy semantyczne. Sceny Three.js zachowują obecną mechanikę, lecz korzystają z bardziej czytelnej palety świateł i materiałów. Każdy etap ma osobną kontrolę typu, budowę i sprawdzenie w przeglądarce.

**Tech Stack:** TypeScript, Vite, Three.js, CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-28-polystrike-visual-design.md`

## Global Constraints

- Nie zmieniać zasad meczu, ruchu, ekonomii ani cen skrzynek.
- Zachować polskie teksty interfejsu i działanie na małych ekranach.
- Cyjan: akcje; złoto: nagrody; czerwień: zagrożenia.
- Każdy etap kończy się `pnpm --dir apps/client run typecheck` i `pnpm --dir apps/client run build`.

---

### Task 1: System wizualny i menu

**Files:**
- Modify: `apps/client/src/style.css`
- Modify: `apps/client/index.html`

**Interfaces:**
- Produces: klasy `button--primary`, `button--gold`, `panel-card` oraz zmienne kolorów CSS używane przez kolejne ekrany.

- [ ] **Step 1: Dodać zmienne palety i testowalne klasy layoutu**

```css
:root { --cyan: #27d8ff; --gold: #ffd45b; --navy: #071521; --danger: #ff5a80; }
.panel-card { background: linear-gradient(145deg, #0b2234ee, #071521ee); border: 1px solid #2a6685; }
.button--primary { background: var(--cyan); color: #031019; }
```

- [ ] **Step 2: Ujednolicić tytuł, panel gracza, nawigację oraz widok mobilny**

```html
<section class="skin-preview panel-card">…</section>
<button id="quick" class="button--primary">SZYBKA ROZGRYWKA</button>
```

- [ ] **Step 3: Zbudować klienta i sprawdzić menu w przeglądarce**

Run: `pnpm --dir apps/client run typecheck; pnpm --dir apps/client run build`
Expected: menu ma aktywny przycisk cyjanowy, nieucinaną zawartość i czytelny panel skina.

### Task 2: Skórki i skrzynki

**Files:**
- Modify: `apps/client/src/main.ts`
- Modify: `apps/client/src/style.css`

**Interfaces:**
- Consumes: `ProfileApi.get`, `ProfileApi.buyCrate`, `ProfileApi.openCrate`.
- Produces: klasy `crate-store`, `crate-result`, `skin-card` oraz czytelny stan przycisków kupna i otwarcia.

- [ ] **Step 1: Nadać stanowi coinów, skrzynek i nagrody osobne klasy CSS**

```ts
store.innerHTML = `<div class="crate-store">…</div>`;
result.className = crateResult.startsWith('NOWY SKIN') ? 'crate-result crate-result--win' : 'crate-result';
```

- [ ] **Step 2: Dodać styl złotego licznika, karty nowego skina i nieaktywnych przycisków**

```css
.crate-result--win { color: var(--gold); box-shadow: 0 0 28px #ffd45b55; }
button:disabled { opacity: .45; cursor: not-allowed; }
```

- [ ] **Step 3: Zbudować klienta i otworzyć ekran skór w przeglądarce**

Run: `pnpm --dir apps/client run typecheck; pnpm --dir apps/client run build`
Expected: widoczne coiny, liczba skrzynek, cena, informacja o wygranych i wyraźna nagroda po otwarciu.

### Task 3: HUD, komunikaty i wynik meczu

**Files:**
- Modify: `apps/client/src/main.ts`
- Modify: `apps/client/src/style.css`
- Test: `apps/client/src/ui/Hud.test.ts`

**Interfaces:**
- Consumes: istniejące elementy `#hud-health`, `#hud-ammo`, `#hud-score`, `#hud-timer`, `#hud-message`, `#minimap`.
- Produces: klasy `hud-card`, `hud-message--victory`, `hud-message--danger`.

- [ ] **Step 1: Dopisać test formatowania klas komunikatu**

```ts
expect(messageTone('VICTORY')).toBe('victory');
expect(messageTone('UTRACONO POŁĄCZENIE')).toBe('danger');
```

- [ ] **Step 2: Uruchomić test przed implementacją**

Run: `pnpm --dir apps/client run test -- Hud.test.ts`
Expected: FAIL, ponieważ `messageTone` jeszcze nie istnieje.

- [ ] **Step 3: Zaimplementować `messageTone` i zastosować klasy do HUD-u**

```ts
export const messageTone = (text: string) => text === 'VICTORY' ? 'victory' : /UTRACONO|BRAK/.test(text) ? 'danger' : 'default';
```

- [ ] **Step 4: Sprawdzić test, budowę i HUD w meczu**

Run: `pnpm --dir apps/client run test -- Hud.test.ts; pnpm --dir apps/client run typecheck; pnpm --dir apps/client run build`
Expected: HP, amunicja i wynik są w kompaktowych panelach; zwycięstwo jest złote, porażka czerwona.

### Task 4: Arena i atmosfera

**Files:**
- Modify: `apps/client/src/maps/Depot.ts`
- Modify: `apps/client/src/maps/Crossroads.ts`
- Modify: `apps/client/src/maps/Foundry.ts`
- Modify: `apps/client/src/vfx/ArenaAtmosphere.ts`
- Test: `apps/client/src/vfx/ArenaAtmosphere.test.ts`

**Interfaces:**
- Consumes: istniejące funkcje budowy aren i `ArenaAtmosphere`.
- Produces: kontrastowe materiały przeszkód, światła kierunkowe i cyjanowe detale bez zwiększania liczby cząstek ponad obecny limit.

- [ ] **Step 1: Dopisać test zachowania limitu cząstek po zmianie palety**

```ts
expect(atmosphere.particleCount()).toBeLessThanOrEqual(72);
```

- [ ] **Step 2: Uruchomić test przed implementacją**

Run: `pnpm --dir apps/client run test -- ArenaAtmosphere.test.ts`
Expected: FAIL, jeżeli `particleCount` nie jest jeszcze dostępne.

- [ ] **Step 3: Ulepszyć paletę materiałów i światło aren bez zmiany kolizji**

```ts
const neonMaterial = new THREE.MeshStandardMaterial({ color: '#1bcceb', emissive: '#0a5f76', emissiveIntensity: 1.1 });
```

- [ ] **Step 4: Sprawdzić test, budowę i trzy mapy w przeglądarce**

Run: `pnpm --dir apps/client run test -- ArenaAtmosphere.test.ts; pnpm --dir apps/client run typecheck; pnpm --dir apps/client run build`
Expected: przeszkody mają lepszy kontrast, neon prowadzi wzrok, a liczba cząstek nie rośnie.

## Plan Self-Review

- Pokrycie specyfikacji: menu (Task 1), skrzynki (Task 2), HUD/wynik (Task 3), arena/atmosfera (Task 4).
- Brak elementów `TODO` i nieokreślonych kroków implementacji.
- Nazwy klas i funkcji są zdefiniowane przy zadaniach, które je tworzą.
