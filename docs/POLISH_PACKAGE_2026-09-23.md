# PolyStrike — pakiet dopracowania rozgrywki

## Zakres i wykonanie

- Mapy: kierunkowe oznaczenia przy wszystkich spawnach na sześciu arenach. Farba pozostaje płaska; nie dodaje przeszkód ani nie zmienia wspólnych kolizji klienta i serwera. Strzałki są grupowane w dwie partie na mapę.
- Modele: oznaczenia drużyn z boku i z tyłu, niezależne od skina. Pozycja boczna uwzględnia szerokie naramienniki wariantu assault. Ozdobne naszywki są wyłączone z celów śladu strzału.
- Broń: animowane wyjmowanie magazynka i ruch dłoni podtrzymującej przy przeładowaniu; ruch zamka pistoletu podczas strzału. Zakończenie lub anulowanie przeładowania przywraca pozycję spoczynkową. Punkt startu śladu pozostaje na końcu lufy.
- Wyposażenie: większe podglądy, wyraźny pasek wybranej broni, dostępny stan aria-pressed i obramowanie przy obsłudze klawiaturą.
- Jakość: niski poziom wyłącza dynamiczne cienie, średni ma mapę cienia 1024 px, wysoki 2048 px. Stare cele renderowania są zwalniane przy zmianie. Rozdzielczość obrazu nadal ma ograniczenie odpowiednie do poziomu jakości. Opis w ustawieniach aktualizuje się od razu.
- Dźwięk: aktywne i zaplanowane głosy syntezatora są odłączane po zakończeniu lub anulowaniu. Pauza i wyjście z rozgrywki kasują aktualnie odtwarzane efekty oraz krótkie efekty strzału. Zachowano osobne suwaki i istniejące brzmienia.
- Testy: dodatkowe testy widoczności naszywek promieniami, niezmienionego celu trafienia, kierunków spawnów, animacji, renderowania cieni i rzeczywistego sygnału audio. Poprawiono sprzątanie dodatkowych kart testowych i klikanie przycisku odzyskiwania sterowania.

## Niezmienniki

Styl low-poly, sześć układów aren, zasady istniejących trybów, kolizje i ekonomia nie są przebudowywane. Brak nowych płatnych zasobów, publikacji i ponownego uruchomienia automatycznej pętli.

## Weryfikacja

- 279 testów logiki: zaliczone.
- Kontrola typów: zaliczona.
- Pełny przebieg Chrome: 61/61 testów zaliczonych (5,4 min), w tym odrodzenie po 30 sekundach, blokada myszy, wszystkie areny i przeładowanie sieciowe.
- Końcowe budowanie klienta i serwera: zaliczone. Pozostaje ostrzeżenie o wielkości głównego pakietu JavaScript: 780,85 kB (218,03 kB gzip); nie blokuje budowania.
- Niezależny przegląd poprawek naszywek: zaakceptowany po poprawieniu zasłaniania przez naramienniki.
- Stałe kamery w tests/e2e/polish-models.spec.ts pokazują trzy warianty postaci z boku i z tyłu oraz fazy animacji broni, bez postprocessingu; ograniczenia na pojedynczy widok: poniżej 60 wywołań rysowania i 3000 trójkątów.

## Granice tego etapu

To dopracowanie istniejącej gry, nie nowy zestaw map i nie pełny przebudowany system animacji. Nie zmierzono czasu GPU na komputerze użytkownika ani nie potwierdzono gotowości do publicznej publikacji. W testach przeglądarkowych używany jest lokalny Chrome.
