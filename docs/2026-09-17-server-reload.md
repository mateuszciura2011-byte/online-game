# Przeładowanie kontrolowane przez serwer

- Klient zgłasza rozpoczęcie przeładowania, a nie dopiero jego koniec.
- Serwer odmierza reloadMs wybranej broni i dopiero potem przenosi naboje
  z zapasu do magazynka. Ponowne żądanie nie skraca ani nie restartuje czasu.
- Strzały podczas trwającego przeładowania są odrzucane przez serwer.
- Zmiana broni anuluje przeładowanie; śmierć i nowy stan odrodzenia nie
  dziedziczą poprzedniego przeładowania. Trening zachowuje lokalny zegar.
- Klient oczekuje potwierdzonej amunicji zamiast sam uzupełniać magazynek.
  Odrzucone przeładowanie nieposiadanej broni zwalnia oczekiwanie klienta.
- Śmierć podczas pauzy anuluje lokalny stan. Po ponownym połączeniu pierwsza
  aktualizacja przywraca amunicję i kończy ewentualne osierocone przeładowanie.

Testy: kontroler czasu i anulowania, integracja pokoju z blokadą strzałów,
potwierdzenie odrzuconego wyposażenia i amunicja w aktualizacji stanu.
Nowy test przeglądarkowy strzela pistoletem w meczu, przeładowuje i zmienia broń.
Pauza ze śmiercią i ponowne połączenie zostały sprawdzone w przeglądzie kodu;
nie są osobnymi automatycznymi scenariuszami przeglądarkowymi tego etapu.

Pełny test ujawnił też próbę dobierania gracza do pokoju z rozpoczętą walką.
Pokój jest teraz blokowany dla dobierania podczas gry i odblokowywany przy
rozpoczęciu nowego meczu po ekranie wyników.

Weryfikacja końcowa: 210 testów kodu przeszło; po ostatniej zmianie dobierania
ponownie przeszło 88 testów serwera. Pełny zestaw 27 testów przeglądarkowych
przeszedł. Kontrole TypeScript klienta i serwera oraz kompilacja przeszły.
Znane ostrzeżenie kompilacji: duży plik JavaScript.
