# Interfejs walki — zakończenie etapu

- Pasek przeładowania i model broni korzystają z tego samego czasu, zamiast niezależnej animacji CSS. Stan dostępny jako progressbar. Anulowanie zeruje wskaźnik w kolejnej klatce.
- Pauza treningu zachowuje pełny czas przeładowania także przy wolnych klatkach. W meczu sieciowym serwer nadal prowadzi grę i może potwierdzić zakończenie w pauzie.
- Komunikaty odróżniają pusty magazynek, brak całej amunicji, niski stan bez zapasu i oczekiwanie na potwierdzenie serwera. Nóż nie sugeruje przeładowania.
- Usunięto migający napis STRZAŁ. Pozostały efekty broni i zużywanie amunicji. Zachowano automatyczne przeładowanie, obrażenia, ekonomię i tryby.

## Weryfikacja 30 września

- 297 testów logiki: 8 shared, 116 server, 173 client — zaliczone.
- Kontrola typów — zaliczona.
- Pełny Chrome: 68/68 (5,7 min), w tym nowe scenariusze pauzy, zmiany broni, spokojnego HUD i automatycznego przeładowania oraz odrodzenie i przeładowanie sieciowe.
- Naprawiono dwa błędy testów: dopasowanie 0/96 wewnątrz 20/96 oraz odczyt wskaźnika przed aktualizacją kolejnej klatki.
- Obejrzany zrzut pauzy potwierdza położenie paska pod amunicją, poza środkiem widoku.
- Przegląd kodu nie zgłosił nowych istotnych usterek. Nie testowano integracyjnie sztucznie opóźnionego potwierdzenia serwera ani całkowitego zużycia zapasu; komunikaty tych stanów sprawdzono testami jednostkowymi.
