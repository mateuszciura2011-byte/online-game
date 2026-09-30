# PolyStrike — pełna naprawa, styl i audio

## Cel

Naprawić całą grę jako spójny, oryginalny low-poly shooter przeglądarkowy dla maksymalnie 10 osób. Głównym trybem jest szybkie 5 na 5 z botami uzupełniającymi wolne miejsca. Projekt zachowuje działające konta, statystyki, skórki, skrzynki i serwer Colyseus, ale porządkuje klienta, rozgrywkę, grafikę i audio.

## Kierunek wizualny

Styl to industrial neon: ciemnogranatowa baza, chłodne materiały map, cyjan dla drużyny niebieskiej, pomarańcz dla czerwonej, złoty dla nagród i malinowy dla błędów. Geometria pozostaje low-poly, ale dostaje czytelne sylwetki, obramowania drużyn, światła kierunkowe, miękką mgłę, drobne cząstki i kontrolowane rozbłyski. Interfejs używa jednego zestawu zmiennych CSS, jednego arkusza stylów i tej samej hierarchii paneli w menu, HUD-zie oraz ekranach wyników.

Menu ma animowany model aktualnego skina, duże przyciski: Szybka gra 5 na 5, Serwery, Trening, Skórki i skrzynki, Wyposażenie, Konto, Statystyki, Ustawienia. HUD pokazuje zdrowie, pancerz, broń, amunicję, gotówkę, wynik drużyn, czas, minimapę, kill feed i krótkie komunikaty. Komunikaty odliczania, kupowania, Victory i Defeat nie zasłaniają celownika ani całej mapy.

## Architektura klienta

Obecny `main.ts` zostanie rozdzielony na moduły uruchamiania gry, wejścia, sesji sieciowej, HUD-u, menu, sklepu, audio i renderowania map. Style tworzone obecnie w TypeScript zostaną przeniesione do plików CSS. Każdy moduł będzie miał jeden zakres odpowiedzialności i testowalne funkcje formatujące stan interfejsu.

Klient interpoluje pozycje innych graczy, ale nie ustala trafień, pieniędzy ani wyniku. Sterowanie używa Pointer Lock, ukrywa kursor podczas gry i odzyskuje go po Escape. Ruch W/S/A/D ma równą prędkość, nie przyspiesza po skosie i nie przechodzi przez geometrię.

## Serwer i przebieg meczu

Serwer pozostaje źródłem prawdy. Przebieg 5 na 5 to: lobby, 10 sekund odliczania, 15 sekund kupowania, gra, wynik i restart rundy. W fazie odliczania i kupowania ruch oraz strzelanie są zablokowane. Zakupy sprawdzają fazę, saldo i dostępność broni. Pistolet i nóż są zawsze dostępne, pozostałe bronie wymagają zakupu.

Boty równoważą drużyny do pięciu osób, poruszają się po mapie, wybierają przeciwników, strzelają tylko do wrogów i odradzają się zgodnie z regułami meczu. Serwer waliduje częstotliwość wiadomości, wartości wejścia, broń, obrażenia i ochronę po odrodzeniu.

## Broń i odczucie strzelania

Zestaw obejmuje nóż, pistolet, pistolet maszynowy, karabin, snajperkę i strzelbę. Każda broń ma własne obrażenia, szybkostrzelność, magazynek, zapas amunicji, zasięg, rozrzut, odrzut kamery, dźwięk i animację przeładowania. Trafienie ma krótki znacznik, eliminacja wpis w kill feedzie, a brak amunicji nie uruchamia efektu strzału.

## Muzyka i efekty dźwiękowe

Muzyka jest elektroniczna, instrumentalna i dopasowana do industrialnego stylu. Potrzebne są osobne pętle: spokojne menu, napięcie podczas kupowania, dynamiczny mecz oraz krótkie zakończenia Victory i Defeat. Przejścia używają płynnego ściszania zamiast nakładania kilku utworów.

Pliki będą zapisane jako zoptymalizowane `.ogg` oraz awaryjnie `.mp3`. Każdy zewnętrzny utwór i efekt musi mieć licencję pozwalającą na użycie w grze; `public/audio/LICENSES.md` zapisze autora, źródło, licencję i wymagane uznanie autorstwa. Nie wolno używać muzyki, głosów ani efektów skopiowanych z Counter-Strike. Ustawienia oddzielnie kontrolują głośność główną, muzykę, efekty i interfejs.

Efekty obejmują kroki zależne od ruchu, strzały sześciu broni, przeładowanie, pusty magazynek, trafienie, otrzymanie obrażeń, eliminację, odliczanie, zakup, komunikat drużynowy, otwarcie skrzynki i wynik meczu. Audio uruchamia się dopiero po pierwszej interakcji użytkownika, zgodnie z ograniczeniami przeglądarek.

## Konta, skórki i skrzynki

Profil przechowuje nazwę, statystyki, coiny, skrzynki, posiadane skórki, wybraną skórkę i wyposażenie. Zwycięstwo przyznaje coiny tylko raz dla identyfikatora meczu. Kupno skrzynki i jej otwarcie to osobne działania. Duplikat daje określony zwrot coinów. Kod konta pozwala odzyskać profil na innym komputerze.

## Stabilność i obsługa błędów

Rozłączenie pokazuje czytelny stan ponownego łączenia i nie pozostawia zablokowanej myszy. Błąd audio nie zatrzymuje meczu. Brak pliku muzycznego wycisza tylko dany utwór. Nieudany zakup pozostawia poprzednią broń i pokazuje przyczynę. Interfejs działa w rozdzielczościach od 1280×720 oraz skaluje HUD przy mniejszych ekranach.

## Weryfikacja

Każda zmiana zachowania zaczyna się od testu, który najpierw nie przechodzi. Po każdym etapie są uruchamiane testy klienta, serwera, pakietu wspólnego i kontrola typów. Testy Playwright sprawdzają menu, szybkie 5 na 5, odliczanie, kupowanie, sterowanie, trening, skórki/skrzynki, ustawienia audio oraz Victory/Defeat. Ostatni etap obejmuje ręczną kontrolę obrazu i dźwięku w uruchomionej grze pod `http://127.0.0.1:5173/`.

## Kryteria ukończenia

Gra uruchamia się bez błędów konsoli, kursor pozostaje przechwycony podczas meczu, ruch i kolizje są stabilne, wszystkie bronie działają zgodnie z konfiguracją, mecz 5 na 5 przechodzi pełny cykl, boty wypełniają drużyny, konto i kolekcja zachowują dane, a menu, HUD, muzyka i efekty tworzą jeden spójny styl. Wszystkie testy i kontrola typów muszą przejść przed wdrożeniem do folderu `C:\Users\lukas\Desktop\online`.
