# Wdrożenie PolyStrike

1. Ustaw `ALLOWED_ORIGINS` na dokładny adres klienta HTTPS.
2. Ustaw `VITE_SERVER_URL` klienta na adres serwera WSS.
3. Zbuduj obraz: `docker build -t polystrike-server .`.
4. Uruchom: `docker run --rm -p 2567:2567 --env-file .env polystrike-server`.
5. Wystaw klienta przez HTTPS oraz serwer przez WSS za reverse proxy. Sprawdź `/health` i połączenie dwóch graczy.
