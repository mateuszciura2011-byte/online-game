# PolyStrike — zintegrowany pakiet prezentacji

## Wykonane

- Sześć odmiennych sylwetek za północną granicą aren: suwnica Depot, wieżowce Crossroads, kominy Foundry, neonowe budynki Alleyways, baszty Citadel i dźwig Canal. Każda dekoracja korzysta z jednej instancjonowanej partii. Nie zmienia przestrzeni gry ani kolizji.
- Podglądy map generowane z rzeczywistych przeszkód i pozycji startowych obu drużyn. Wybór karty i listy pozostaje zsynchronizowany; tylko jedna karta jest zaznaczona.
- Palce dłoni, magazynek pistoletu, animacja pompy strzelby wraz z dłonią podtrzymującą i łagodniejsze zakończenie przeładowania. Zachowany punkt wyjścia śladu na końcu lufy.
- Spójne powierzchnie wyposażenia, zakupu i pauzy, sylwetki pięciu broni w sklepie, czytelny stan wyposażenia i obramowania klawiaturowego wyboru.
- Naprawy znalezione podczas przeglądu: okna i szyldy zwrócone do areny, wyłączenie dekoracji tła z cieni także w rzeczywistej integracji setMap, przycisk zamknięcia nie zasłania tekstu przewijanego menu.

## Świeża weryfikacja 24 września

- 294 testy logiki zaliczone: shared 8, serwer 116, klient 170.
- Kontrola typów klienta i serwera zaliczona.
- Pełny przebieg Chrome 64/64, 5,4 min: wszystkie areny, cztery tryby, blokada myszy, pauza, przeładowanie sieciowe, profil i odrodzenie po 30 sekundach.
- Po końcowej korekcie przycisku zamknięcia: ponowny zestaw interfejsu 18/18, w tym nowy test nakładania tekstu. Łącznie w zestawie istnieje teraz 65 różnych testów przeglądarkowych; nie jest to deklaracja nowego pełnego przebiegu 65/65.
- Testy regresji fasad i cieni oraz przewijanego menu najpierw odtworzyły błędy, następnie przeszły po poprawkach.
- Obejrzano zrzuty sześciu aren z poziomu gracza i z góry, mapy na ekranie 360 px oraz sklep 1024×600. Stała scena kontrolna mieści się w limitach poniżej 46 wywołań rysowania i 20 000 trójkątów na widok; to nie pomiar czasu GPU pełnego meczu.
- Niezależny przegląd kodu: zgłoszone problemy fasad i integracji cieni poprawione i ponownie sprawdzone.
- Budowanie produkcyjne klienta i serwera zaliczone. Pozostaje ostrzeżenie o głównym pakiecie JS 784,54 kB (219,82 kB gzip).

## Granice

Zachowano low-poly, kolizje, zasady trybów, ekonomię i profile. Dekoracje tła nie są nowymi dostępnymi obszarami map. Nie publikowano gry, nie kupowano zasobów i nie wznowiono automatycznej pętli. Automatyczne testy Chrome oraz przegląd obrazów nie oznaczają braku wszystkich błędów ani gotowości do publikacji. Nie przeprowadzono subiektywnego odsłuchu ani pomiarów GPU na komputerze gracza.
