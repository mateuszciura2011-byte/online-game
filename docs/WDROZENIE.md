# Wdrożenie PolyStrike

1. Ustaw `ALLOWED_ORIGINS` na dokładny adres strony z klientem gry.
2. Zbuduj serwer: `pnpm --filter @polystrike/server build`.
3. Zbuduj klienta z `VITE_SERVER_URL` wskazującym publiczny adres WebSocket serwera: `pnpm --filter @polystrike/client build`.
4. Opublikuj katalog `apps/client/dist` jako stronę statyczną, a `apps/server/dist` uruchom przez Node.js na porcie `PORT` (domyślnie 2567).

Do działania przez HTTPS klient musi używać `wss://`, a serwer powinien być ustawiony za proxy terminującym TLS.
