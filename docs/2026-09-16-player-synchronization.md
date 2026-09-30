# Synchronizacja postaci

Kontynuacja zatwierdzonego etapu rozgrywki, bez zmiany balansu i modeli.

- Interpolacja zachowuje zdrowie i stan życia z właściwego momentu serwera.
  Nie przywraca domyślnych 100 HP pomiędzy pakietami i nie pokazuje śmierci
  przed jej znacznikiem czasu.
- Obrót przez granicę -PI/PI wybiera krótszy łuk zamiast niemal pełnego obrotu.
- Pełna lista graczy w aktualizacji usuwa nieobecne modele oraz ich cele trafień.
- Wyjście do menu i wejście do treningu czyszczą zdalne postacie. Spóźnione
  aktualizacje meczu nie odtwarzają ich w menu ani treningu.
- Geometrie i materiały usuwanych postaci są zwalniane raz, również gdy kilka
  części jednego modelu korzysta z tego samego zasobu.

Trzy nowe testy odtworzyły problemy przed implementacją. Po zmianach przeszło
206 testów kodu, kontrola TypeScript i kompilacja produkcyjna. Pozostaje znane
ostrzeżenie o dużym pliku JavaScript. Przegląd kodu nie znalazł istotnej regresji.

Ponowna weryfikacja 17 września: 206 testów kodu, 26 testów przeglądarkowych,
TypeScript klienta i kompilacja produkcyjna przeszły. Testy przeglądarkowe są
automatyczne, nie stanowią deklaracji ręcznego przegrania wszystkich map.

Następny otwarty punkt: czas przeładowania gracza egzekwowany przez serwer.
