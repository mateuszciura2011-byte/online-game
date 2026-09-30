# PolyStrike — odświeżenie całego UI

## Zakres

Nowy wspólny styl istniejących ekranów: główne menu, szybka rozgrywka, tworzenie/dołączanie do serwera, konto, statystyki, wyposażenie, skiny/skrzynki, ustawienia, HUD, wyniki, pauza, sklep rundy i ekran śmierci. Ciemne powierzchnie, miętowo-turkusowy akcent, spokojniejsze cienie, czytelna hierarchia i wspólne stany przycisków. Nie zmieniono zasad gry ani systemu przechwytywania myszy.

- Menu w dwóch kolumnach na szerokim ekranie, z opisami działań i grupą wyboru treningu.
- Panele mają przewijany korpus i własny przyklejony pasek zamknięcia.
- Otwarcie panelu blokuje tło przez inert; Tab/Shift+Tab zostają wewnątrz, Escape zamyka, a fokus wraca do przycisku otwierającego. Start gry zamyka panel bez przejmowania fokusu od sterowania.
- Karty wyposażenia i zakupów zachowują rzeczywiste ceny, status wyboru i istniejące podglądy.
- Podczas zakupów nieprzezroczysty sklep przejmuje widok; po zakończeniu fazy HUD wraca.
- Układ sprawdzono przy 320/375/768/1280 px szerokości oraz przy 1024×500.

## Wyniki sprawdzenia

- Test fokusu: najpierw odtworzył brak przeniesienia fokusu (czerwony), po poprawce przeszedł.
- Pierwszy pełny przebieg Chrome: 79/83. Wykryto nachodzenie zamknięcia na opis, przekroczenie budżetu geometrii fasad z poprzedniego pakietu, zależność testu od starego rozmiaru fontu oraz wpływ visibility:hidden na odczyt amunicji w sklepie.
- Wszystkie cztery przyczyny rozwiązano. Test komunikatu sprawdza teraz rzeczywiste granice karty zamiast konkretnej wartości fontu.
- Końcowy przebieg 32 odpowiednich testów Chrome: 32/32; obejmuje cztery wcześniejsze niepowodzenia, wszystkie panele, sklep, klawiaturę, tworzenie/dołączanie do meczu, komunikaty, viewporty i reakcje na błędy profilu.
- Końcowe testy jednostkowe: 301/301. Kontrola typów i build: przeszły.
- Przegląd kodu wykrył brak blokady klawiatury w tle panelu; po poprawce nie zgłoszono istotnych usterek. Obejrzano rzeczywiste zrzuty ekranu.

## Korekta wydajności modeli

Test widoku mapy wykazał 35 384 trójkąty przy budżecie poniżej 20 000. Wielokrotnie powtarzane cienkie listwy fasad ponownie korzystają z lekkiej geometrii, bez fazowania subpikselowych krawędzi. Wyposażenie dachów i modele broni/postaci zachowują fazowane profile. Test budżetu mapy po korekcie przeszedł bez zmiany limitu.

## Ograniczenia

Nie powtarzano całego zestawu 83 testów po końcowej korekcie; powtórzono 32 testy zależne od zmienionych obszarów. Ekran śmierci w teście nowego UI jest jawnie fixturem prezentacyjnym; rzeczywisty test odrodzenia przeszedł w pełnym przebiegu. Nie wykonano audytu czytnika ekranowego ani każdej konfiguracji sprzętu. Pozostaje wcześniejsze ostrzeżenie o paczce Three.js większej niż 500 kB. Nie opublikowano gry.
