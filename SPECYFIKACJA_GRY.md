# Specyfikacja gry „PolyStrike”

## 1. Cel projektu

Stworzenie działającej w przeglądarce, trójwymiarowej gry FPS online w stylu low-poly. Jednocześnie gra maksymalnie 10 osób. Projekt oferuje dwa tryby rozgrywki, sześć klas broni, lobby, system odradzania i tabelę wyników.

Pierwsza wersja ma działać na komputerach w aktualnych wersjach Chrome, Edge i Firefox. Sterowanie dotykowe, pełne konta z odzyskiwaniem hasła, płatności prawdziwymi pieniędzmi, ranking sezonowy i boty nie należą do pierwszej wersji.

## 2. Technologia

- klient: TypeScript, Vite i Three.js,
- serwer gry: Node.js, TypeScript i Colyseus,
- testy: Vitest dla logiki oraz Playwright dla głównego przepływu w przeglądarce,
- wspólne typy i konfiguracja: osobny pakiet `shared`,
- profile i ekwipunek: PostgreSQL na produkcji oraz SQLite w lokalnym środowisku testowym,
- komunikacja: WebSocket obsługiwany przez Colyseus,
- animacje humanoidów: klipy przygotowane lub retargetowane w Adobe Mixamo,
- źródła modeli: własne modele low-poly oraz odpowiednio licencjonowane zasoby ze Sketchfab,
- optymalizacja modeli: kontrola budżetów i kompresja GLB/GLTF z użyciem GLB Shrink lub równoważnego pipeline'u,
- dźwięk: Web Audio API z osobnym mikserem muzyki, efektów i interfejsu,
- wdrożenie docelowe: statyczny klient HTTPS oraz stale działający serwer Node.js z WSS.

Serwer jest autorytatywny: decyduje o trafieniach, obrażeniach, śmierci, odrodzeniu, amunicji, czasie meczu i wyniku. Klient wysyła wejście gracza i przewidywane akcje, ale nie może sam przyznać sobie trafienia ani punktu.

## 3. Tryby gry

### 3.1. Drużynowy 5 na 5

- dwie drużyny: niebieska i czerwona,
- maksymalnie 5 graczy w każdej drużynie,
- serwer przydziela gracza do mniej licznej drużyny,
- czas meczu: 10 minut,
- cel: pierwsza drużyna z 50 eliminacjami wygrywa,
- po upływie czasu wygrywa drużyna z większą liczbą eliminacji,
- remis po czasie pozostaje remisem,
- odrodzenie po 3 sekundach w punkcie należącym do własnej drużyny,
- ogień sojuszniczy jest wyłączony.

### 3.2. Każdy na każdego

- maksymalnie 10 graczy,
- czas meczu: 10 minut,
- pierwszy gracz z 30 eliminacjami wygrywa,
- po upływie czasu wygrywa gracz z największą liczbą eliminacji,
- przy remisie wygrywa gracz z mniejszą liczbą śmierci; jeśli nadal jest remis, wynik pozostaje remisowy,
- odrodzenie po 3 sekundach w bezpiecznym, wolnym punkcie mapy.

Mecz może rozpocząć się od 2 graczy. Puste miejsca mogą zostać zajęte w trakcie meczu. Dołączający gracz zaczyna z zerowym wynikiem.

## 4. Przebieg rozgrywki

1. Przy pierwszym uruchomieniu gra tworzy anonimowy profil, a gracz wpisuje nazwę o długości od 3 do 16 znaków.
2. W menu gracz wybiera szybką rozgrywkę, utworzenie serwera albo dołączenie do serwera.
3. W szybkiej rozgrywce wybiera tryb, a system wyszukuje publiczny pokój z wolnym miejscem albo tworzy nowy.
4. Przy tworzeniu serwera ustala nazwę, tryb, mapę, widoczność i opcjonalny kod dostępu.
5. Przy dołączaniu wybiera serwer z listy albo wpisuje kod zaproszenia.
6. Gracz trafia do lobby i wybiera główną broń.
7. Po minimum 2 graczach rozpoczyna się 10-sekundowe odliczanie.
8. Mecz trwa do osiągnięcia limitu wyniku albo końca czasu.
9. Ekran końcowy pokazuje `VICTORY` albo `DEFEAT`, nagrodę i tabelę wyników.
10. Po 15 sekundach gracze wracają do lobby; mogą też wyjść od razu.

Gracz zawsze posiada nóż i pistolet. Przed odrodzeniem wybiera jedną broń główną: pistolet maszynowy, karabin, snajperkę albo strzelbę.

## 5. Broń i balans początkowy

Wartości są punktem startowym do testów. Obrażenia dotyczą trafienia w tułów; trafienie w głowę ma mnożnik 2,0, a trafienie w kończynę mnożnik 0,75.

| Broń | Obrażenia | Szybkostrzelność | Magazynek | Zapas | Przeładowanie | Zasięg pełnych obrażeń |
|---|---:|---:|---:|---:|---:|---:|
| Nóż | 60 | 1,2 ataku/s | — | — | — | 2 m |
| Pistolet | 25 | 4 strzały/s | 12 | 48 | 1,4 s | 25 m |
| Pistolet maszynowy | 18 | 12 strzałów/s | 30 | 120 | 1,8 s | 18 m |
| Karabin | 30 | 8 strzałów/s | 30 | 90 | 2,2 s | 40 m |
| Snajperka | 85 | 0,8 strzału/s | 5 | 20 | 2,8 s | 100 m |
| Strzelba | 10 × 8 śrutów | 1 strzał/s | 6 | 30 | 0,55 s za nabój | 8 m |

Pozostałe reguły:

- zdrowie gracza: 100,
- po śmierci zdrowie i amunicja są przywracane,
- nóż nie zużywa amunicji,
- broń palna korzysta z hitscanu; strzelba wykonuje osiem niezależnych promieni,
- odrzut i rozrzut są obliczane według tych samych parametrów po stronie klienta i serwera,
- po przekroczeniu zasięgu pełnych obrażeń obrażenia stopniowo spadają do 60% wartości bazowej,
- trafienie nieżywego gracza, sojusznika w trybie drużynowym lub gracza w trakcie ochrony po odrodzeniu nie zadaje obrażeń,
- ochrona po odrodzeniu trwa 1,5 sekundy i znika po oddaniu strzału.

## 6. Sterowanie i interfejs

- `WASD`: ruch,
- mysz: obrót kamery i celowanie,
- lewy przycisk myszy: atak,
- prawy przycisk myszy: celowanie,
- `Shift`: sprint,
- `Space`: skok,
- `R`: przeładowanie,
- `1`, `2`, `3` lub kółko myszy: zmiana broni,
- `Tab`: tabela wyników,
- `Esc`: ustawienia i wyjście z meczu.

HUD pokazuje celownik, zdrowie, aktywną broń, amunicję, czas meczu, wynik, komunikat o eliminacji i skróconą listę zabójstw. Menu ustawień pozwala zmienić czułość myszy, głośność i jakość grafiki.

### 6.1. Menu główne

Menu zawiera przyciski: `Szybka rozgrywka`, `Utwórz serwer`, `Dołącz do serwera`, `Skiny`, `Wyposażenie` i `Ustawienia`. Pośrodku ekranu znajduje się aktualny model gracza w wybranym skinie. Model wykonuje spokojną animację bezczynności i obraca się po przeciągnięciu myszą.

Lista serwerów pokazuje nazwę, tryb, mapę, liczbę graczy, maksymalną liczbę graczy, ping i informację o kodzie dostępu. Prywatny serwer nie pojawia się na publicznej liście i jest dostępny przez sześcioliterowy kod zaproszenia.

### 6.2. Ekran wyniku

Zwycięzca widzi duży animowany napis `VICTORY`, 100 zdobytych coinów i tabelę wyników. Pozostali widzą `DEFEAT` oraz tabelę wyników. W 5 na 5 zwycięża i otrzymuje nagrodę cała drużyna; w FFA zwycięża tylko pierwszy gracz. Gracz, który opuści mecz przed zakończeniem, nie otrzymuje coinów.

## 7. Skiny, wyposażenie, coiny i skrzynki

- zwycięstwo daje 100 coinów,
- skrzynka kosztuje 300 coinów i zawiera jeden skin,
- szanse rzadkości wynoszą: zwykły 60%, rzadki 30%, epicki 9%, legendarny 1%,
- powtórzony skin automatycznie zamienia się na 50 coinów,
- zakup, losowanie, saldo i własność skinów są obliczane wyłącznie na serwerze,
- profil startuje z jednym podstawowym skinem i zerowym saldem,
- wybrany skin oraz wybrane uzbrojenie są zapisywane na profilu,
- ekran skinów pokazuje kolekcję, rzadkość, podgląd 3D i przycisk wyposażenia,
- ekran wyposażenia pozwala wybrać skin i domyślną broń główną,
- skrzynki są kupowane wyłącznie za coiny zdobyte w grze; wersja 1.0 nie obsługuje płatności prawdziwymi pieniędzmi.

Anonimowy profil korzysta z losowego, tajnego tokenu zapisanego w przeglądarce i jego skrótu przechowywanego na serwerze. Utrata danych przeglądarki oznacza utratę dostępu do profilu; pełne konta i odzyskiwanie profilu mogą zostać dodane po wersji 1.0.

## 8. Mapy i styl low-poly

Pierwsza wersja zawiera dwie mapy:

- `Depot`: symetryczny magazyn dla trybu 5 na 5, z trzema głównymi drogami i osłonami,
- `Crossroads`: zwarta arena dla trybu każdy na każdego, z pierścieniem zewnętrznym i podwyższonym środkiem.

Każda mapa ma co najmniej 12 punktów odrodzenia, czytelne granice, brak miejsc pozwalających wyjść poza planszę i uproszczoną geometrię kolizji. Styl wykorzystuje płaskie kolory, proste bryły, lekkie cienie i ograniczoną paletę. Gracz powinien być wyraźnie widoczny na tle mapy.

### 8.1. Pipeline modeli, animacji i licencji

- Mixamo może dostarczać animacje humanoidów: idle, chód, sprint, skok, lądowanie, przeładowanie, śmierć, emotki i pozy zwycięstwa,
- wszystkie klipy są retargetowane do jednego szkieletu PolyStrike, przycinane, kompresowane i łączone w kontrolowany graf stanów,
- Sketchfab może dostarczać dekoracje, broń, skrzynki i elementy architektury tylko po sprawdzeniu licencji konkretnego modelu,
- preferowane licencje to CC0, CC BY oraz zakupiona licencja pozwalająca na użycie w grze; zasoby CC BY muszą trafić do `CREDITS.md`,
- zasobów z licencją zakazującą zastosowania komercyjnego nie używa się, aby nie blokować przyszłej publikacji gry,
- pliki źródłowe nie są publicznie redystrybuowane osobno od gry, jeśli licencja tego zabrania,
- każdy model ma wpis w manifeście zawierający autora, adres źródła, licencję, datę pobrania, liczbę trójkątów, rozmiar tekstur i rozmiar pliku,
- przed dodaniem do wydania model przechodzi optymalizację: usunięcie zbędnych danych, redukcję geometrii, atlasowanie lub zmniejszenie tekstur oraz kompresję Draco/Meshopt i WebP/KTX2,
- budżet zwykłego obiektu to maksymalnie 8 000 trójkątów i 150 KB po kompresji; model gracza może mieć maksymalnie 25 000 trójkątów i 500 KB bez animacji,
- jedna mapa nie może wymagać pobrania więcej niż 20 MB skompresowanych zasobów przed rozpoczęciem meczu.

### 8.2. Efekty wizualne

Wersja 1.0 zawiera pulowane efekty błysku lufy, smug pocisków, uderzeń w różne materiały, iskier, łusek, dymu, odłamków oraz cząsteczek ekranu `VICTORY`. Efekty nie mogą zasłaniać celu ani zmieniać wyniku symulacji. Dostępne są poziomy jakości `niski`, `średni` i `wysoki`, które zmieniają wyłącznie gęstość, czas życia oraz rozdzielczość efektów.

### 8.3. Muzyka i dźwięk przestrzenny

- menu otrzymuje główny elektroniczny motyw PolyStrike,
- lobby korzysta ze spokojniejszej wersji motywu,
- `Depot` używa industrialnej elektroniki,
- `Crossroads` używa szybkich bębnów i energicznej elektroniki,
- trening korzysta z lekkiego, minimalistycznego rytmu,
- `Frostbase` otrzymuje chłodny ambient elektroniczny,
- `Harbor` otrzymuje cięższą elektronikę z morskim tłem,
- `Neon District` otrzymuje synthwave,
- ekran `VICTORY`, ekran `DEFEAT` i otwieranie skrzynki mają krótkie, osobne sygnały muzyczne,
- podczas ostatnich 60 sekund lub przy małej różnicy punktów włącza się intensywniejsza warstwa utworu bez rozpoczynania go od początku,
- muzyka każdej lokalizacji ma co najmniej dwa warianty wybierane bez natychmiastowego powtarzania,
- efekty kroków, broni i uderzeń są przestrzenne; muzyka i komunikaty UI pozostają niespatializowane,
- PolyStrike nie zawiera czatu głosowego ani tekstowego; komunikacja odbywa się wyłącznie przez koło szybkich komunikatów i znaczniki drużynowe na mapie,
- używana jest wyłącznie muzyka własna, zamówiona albo objęta licencją pozwalającą na publikację gry; autor i licencja są zapisywani w `CREDITS.md`.

### 8.4. Materiały referencyjne i świadome wykluczenia

| Materiał | Decyzja dla PolyStrike |
|---|---|
| `mrdoob/three.js` | główna biblioteka renderowania |
| `boona13/glb-shrink` | punkt odniesienia dla pipeline'u kompresji modeli |
| `achrefelouafi/SnowSystemThreeJS` | inspiracja dla opadów na mapie `Frostbase` |
| `majidmanzarpour/threejs-vfx` i pakiety umiejętności Three.js | inspiracja dla pulowanych efektów i walidacji grafiki, nie zależność runtime |
| `codedgar/three-fenestra` | kandydat do tanich wnętrz okien na `Neon District`, po teście wydajności i zgodności wersji Three.js |
| `brunosimon/infinite-world`, `fable5-world-demo`, `glacial-valley` | referencje kompozycji i proceduralnego terenu; bez nieskończonego świata w meczu |
| `pmndrs/ecctrl` | referencja ruchu i animacji; nie jest kontrolerem produkcyjnym, ponieważ PolyStrike nie używa React Three Fiber i wymaga autorytatywnego ruchu serwera |
| `owenyuwono/poseidon` | nie używać jako podstawy wody; wymaga WebGPU bez zapasowego WebGL, więc `Harbor` otrzyma lżejszą wodę analityczną |
| `sparkjsdev/spark` | nie używać w mapach meczu; Gaussian Splatting nie pasuje do stylu low-poly i zwiększa koszt renderowania oraz pobierania |
| `UP2You` | nie używać do tworzenia awatarów graczy w obecnym zakresie ze względu na prywatność, koszt przetwarzania i niespójność stylu |
| proceduralny pająk i izometryczne buildery świata | zachować wyłącznie jako inspiracje techniczne; nie należą do rozgrywki FPS |

## 9. Model sieciowy

- serwer aktualizuje stan pokoju 20 razy na sekundę,
- klient renderuje 60 klatek na sekundę, jeśli urządzenie na to pozwala,
- lokalny ruch korzysta z predykcji klienta i korekty serwera,
- ruch innych graczy jest interpolowany z krótkim buforem,
- serwer przechowuje 200 ms historii pozycji do kompensacji opóźnienia podczas strzału,
- wiadomości wejściowe zawierają rosnący numer sekwencji i czas klienta,
- serwer ogranicza częstotliwość wejść, strzałów, zmiany broni i wiadomości lobby,
- rozłączenie rezerwuje miejsce przez 30 sekund; ponowne połączenie przywraca gracza do meczu,
- po 30 sekundach gracz jest usuwany z pokoju.

## 10. Struktura projektu

```text
online/
├── package.json
├── pnpm-workspace.yaml
├── apps/
│   ├── client/        # Three.js, UI, wejście, dźwięk i predykcja
│   └── server/        # pokoje Colyseus, profile i autorytatywna symulacja
├── packages/
│   └── shared/        # typy wiadomości, konfiguracja broni i reguły meczu
├── database/
│   └── migrations/    # wersjonowane zmiany profili, coinów i ekwipunku
├── tests/
│   └── e2e/           # testy przepływu dwóch klientów
└── docs/
    ├── SPECYFIKACJA_GRY.md
    └── PLAN_IMPLEMENTACJI.md
```

## 11. Obsługa błędów

- nieudane połączenie pokazuje jasny komunikat i przycisk ponowienia,
- pełny pokój powoduje automatyczne wyszukanie innego pokoju,
- nieprawidłowy lub wygasły kod serwera pokazuje komunikat i pozostawia gracza na ekranie dołączania,
- zakup skrzynki przy saldzie poniżej 300 coinów jest odrzucany bez zmiany salda,
- niepoprawna nazwa jest odrzucana przed połączeniem,
- brak odpowiedzi serwera przez 5 sekund pokazuje ostrzeżenie o połączeniu,
- zerwanie połączenia uruchamia maksymalnie trzy próby ponownego połączenia,
- serwer zapisuje błędy pokoju, lecz błąd jednego pokoju nie może zakończyć całego procesu,
- klient nie wykonuje niezweryfikowanych danych jako kodu i wyświetla nazwy graczy wyłącznie jako tekst.

## 12. Kryteria wersji 1.0

Wersja 1.0 jest gotowa, gdy:

- 10 graczy może rozegrać pełny mecz w obu trybach,
- wszystkie sześć rodzajów broni działa zgodnie z konfiguracją,
- serwer odrzuca strzały oddawane zbyt szybko, bez amunicji albo przez martwego gracza,
- wynik, czas, śmierć, odrodzenie i koniec meczu są identyczne u wszystkich klientów,
- ponowne połączenie w ciągu 30 sekund działa,
- gra utrzymuje co najmniej 60 FPS na komputerze ze średniej klasy zintegrowaną grafiką przy 10 graczach,
- przy opóźnieniu 100 ms rozgrywka pozostaje sterowalna, a korekty ruchu nie powodują ciągłego skakania pozycji,
- test automatyczny uruchamia dwa klienty, dołącza ich do jednego pokoju, rozpoczyna mecz i potwierdza synchronizację wyniku,
- szybka rozgrywka, tworzenie serwera, lista publiczna i dołączanie kodem działają,
- zwycięzca otrzymuje dokładnie 100 coinów tylko raz, a przegrany i gracz wychodzący wcześniej nie otrzymują nagrody,
- zakup skrzynki odejmuje dokładnie 300 coinów, zapisuje wylosowany skin lub zwraca 50 coinów za duplikat,
- menu wyświetla animowany model z aktualnie wyposażonym skinem,
- animacje gracza przechodzą bez widocznych przeskoków między idle, chodem, sprintem, skokiem, przeładowaniem i śmiercią,
- każdy zewnętrzny model oraz utwór ma udokumentowane źródło, autora i zgodną licencję,
- wszystkie modele mieszczą się w budżetach geometrii, tekstur i pobierania,
- muzyka zmienia się zgodnie z ekranem lub mapą, a suwaki muzyki, efektów i interfejsu działają niezależnie,
- poziom jakości niski ogranicza VFX bez zmiany trafień, obrażeń ani widoczności graczy,
- klient i serwer można uruchomić lokalnie jedną udokumentowaną sekwencją poleceń.

Wersja 1.0 zawiera również tryb treningowy ze statycznymi celami, obserwowanie żyjących graczy po śmierci oraz trwałe statystyki profilu: rozegrane mecze, zwycięstwa, eliminacje, śmierci, celność i czas gry.

## 13. Mapa rozwoju po wersji 1.0

### 13.1. Aktualizacja 1.1 — progresja i aktywność

- poziom profilu oraz doświadczenie zdobywane za ukończenie meczu, wynik i zwycięstwo,
- trzy zadania dzienne i trzy zadania tygodniowe generowane na serwerze,
- osiągnięcia z jednorazowymi nagrodami w coinach,
- głosowanie na następną mapę po meczu.

### 13.2. Aktualizacja 1.2 — funkcje społecznościowe

- zaproszenia do znajomych, lista znajomych i status dostępności,
- drużyna licząca maksymalnie pięciu graczy i wspólne wyszukiwanie meczu,
- zapraszanie znajomych do serwera prywatnego,
- zgłaszanie graczy z wyborem powodu,
- blokowanie zaproszeń i kontaktu od wybranego gracza,
- panel administracyjny do przeglądania zgłoszeń i nakładania czasowych blokad.

### 13.3. Aktualizacja 1.3 — nowe tryby

- `Control`: drużyny zdobywają punkty za utrzymanie wyznaczonego obszaru,
- `Capture the Flag`: drużyny kradną flagę przeciwnika i donoszą ją do własnej bazy,
- `Gun Game`: po każdej eliminacji gracz otrzymuje następną broń z ustalonej kolejności,
- `Knife Only`: wszyscy posiadają wyłącznie nóż,
- `Snipers Only`: wszyscy posiadają wyłącznie snajperkę i nóż.

Każdy tryb ma osobną konfigurację, testy zakończenia meczu i listę zgodnych map. Serwer, a nie klient, kontroluje cele oraz wynik.

### 13.4. Aktualizacja 1.4 — personalizacja

- skiny broni niezwiększające obrażeń ani celności,
- emotki uruchamiane poza walką,
- pozy zwycięstwa na ekranie wyników,
- zawieszki do broni,
- kosmetyczne animacje eliminacji bez zasłaniania pola widzenia,
- wizytówki i ramki profilu,
- edytor koloru, wielkości, przerwy i grubości celownika,
- trzy nazwane zestawy wyposażenia z bronią, skinem postaci, skinami broni, zawieszką i celownikiem.

Wszystkie elementy personalizacji są kosmetyczne i nie zapewniają przewagi w walce.

### 13.5. Aktualizacja 1.5 — mapy i oprawa audiowizualna

- `Frostbase`: zimowa baza z lekkim śniegiem, oszronionymi powierzchniami i ograniczeniem gęstości opadów wokół celownika,
- `Harbor`: portowa arena z lekką wodą analityczną, odbiciem nieba i bez kosztownego oceanu FFT,
- `Neon District`: nocna dzielnica z neonami, tanimi pozornymi wnętrzami okien i kontrolowanym bloomem,
- osobny zestaw ambience, kroków powierzchniowych, pogłosu i co najmniej dwóch utworów dla każdej mapy,
- efekty pogody mają trzy poziomy jakości i są kosmetyczne; serwer nie synchronizuje pojedynczych cząsteczek,
- każda mapa przechodzi test czytelności przeciwnika bez post-processingu, test 10 graczy i budżet minimum 60 FPS.

### 13.6. Aktualizacja 1.6 — onboarding, dostępność i platforma

- interaktywny samouczek pierwszego uruchomienia: ruch, celowanie, strzał, przeładowanie, zmiana broni i cel meczu,
- rozbudowana strzelnica ze wszystkimi broniami, ruchomymi celami, pomiarem DPS, celności i czasu eliminacji oraz podglądem skinów,
- tryby kolorów dla najczęstszych odmian daltonizmu oraz niezależne kolory drużyn, celownika i trafień,
- regulowane FOV od 70° do 110°, ograniczenie kołysania kamery, błysków, drgań i intensywności efektów,
- napisy efektów dźwiękowych i komunikatów, pełna zmiana klawiszy oraz osobne suwaki muzyki, strzałów, kroków i UI,
- obsługa kontrolera przez Gamepad API; lekka asysta spowalniająca celownik jest dostępna tylko w trybach nierankingowych,
- automatyczny wybór regionu według mediany trzech pomiarów opóźnienia oraz ręczna zmiana regionu,
- instalacja jako PWA, wersjonowana pamięć podręczna i pobieranie wymaganej mapy przed rozpoczęciem meczu.

### 13.7. Aktualizacja 1.7 — killcam, replay i komunikacja taktyczna

- serwer zapisuje skompresowane snapshoty 10 Hz oraz zdarzenia meczu potrzebne do odtworzenia,
- killcam pokazuje ostatnie 8 sekund z perspektywy przeciwnika i można go pominąć,
- pełny replay meczu ma sterowanie czasem, zmianę gracza, kamerę swobodną i znaczniki eliminacji,
- najlepsze akcje są wybierane według jawnego wyniku uwzględniającego serię eliminacji, cele trybu i krótki odstęp czasu,
- koło komunikatów zawiera: przeciwnik, pomoc, idziemy tutaj, broń, obrona i wycofanie,
- gracz może oznaczyć pozycję lub przeciwnika; znacznik ma limit częstotliwości, czas życia i jest widoczny tylko dla drużyny,
- replay jest źródłem dowodów dla zgłoszeń i anty-cheatu, ale nie zastępuje autorytatywnego stanu meczu.

### 13.8. Aktualizacja 1.8 — pełne konta i postęp między urządzeniami

- anonimowy profil można bezpiecznie połączyć z kontem bez utraty coinów, skinów ani statystyk,
- konto korzysta ze zweryfikowanego adresu e-mail i hasła przechowywanego wyłącznie jako skrót Argon2id,
- dostępne są potwierdzenie e-mail, ograniczone czasowo odzyskiwanie hasła, wylogowanie wszystkich urządzeń i rotacja sesji,
- postęp, ustawienia, wyposażenie i statystyki są synchronizowane między urządzeniami,
- użytkownik może pobrać kopię swoich danych i zlecić usunięcie konta,
- operacje łączenia profilu, otwierania skrzynek i nagród są idempotentne oraz zapisywane w dzienniku audytowym.

### 13.9. Aktualizacja 2.0 — rozgrywka rankingowa

- osobna kolejka rankingowa 5 na 5,
- wymagany poziom 10 i co najmniej 20 ukończonych zwykłych meczów,
- ocena umiejętności ukryta oraz widoczna ranga: Brąz, Srebro, Złoto, Platyna, Diament i Mistrz,
- mecze kwalifikacyjne na początku sezonu,
- sezony trwające 12 tygodni,
- tabela najlepszych graczy według regionu i świata,
- kara czasowa i utrata punktów za opuszczenie meczu,
- reset częściowy rangi między sezonami,
- nagrody sezonowe są wyłącznie kosmetyczne.

### 13.10. Aktualizacja 2.1 — klany, turnieje i wydarzenia

- klan ma maksymalnie 50 członków, nazwę, skrót, symbol, role i dziennik zmian,
- turnieje graczy obsługują drabinki dla 4, 8 lub 16 drużyn, gotowość składów i automatyczne raportowanie wyniku z serwera,
- prywatny serwer pozwala zmienić tylko bezpieczną listę reguł: mapę, tryb, limity, czas, dostępne bronie i ogień sojuszniczy,
- wydarzenia sezonowe mają datę rozpoczęcia i zakończenia, osobną rotację trybów oraz kosmetyczne nagrody,
- wyzwania społecznościowe sumują zatwierdzone zdarzenia wszystkich graczy i nie ufają licznikom klienta.

### 13.11. Aktualizacja 2.2 — boty zastępujące rozłączonych graczy

- bot działa wyłącznie na serwerze i korzysta z prostego drzewa zachowań, nawigacji oraz ograniczonej percepcji,
- bot zajmuje miejsce gracza po rozłączeniu i znika natychmiast po skutecznym reconnectcie,
- bot ma trzy poziomy trudności, ale nigdy nie zna pozycji niewidocznego przeciwnika,
- boty są wyłączone w kolejce rankingowej i turniejach,
- eliminacje botów liczą się do wyniku meczu, lecz nie zwiększają zadań wymagających eliminacji gracza.

### 13.12. Aktualizacja 2.3 — edytor i mapy społeczności

- edytor działa w przeglądarce, używa siatki oraz zatwierdzonych modułów low-poly bez możliwości uruchamiania własnego kodu,
- mapa musi zawierać granice, punkty odrodzenia, cele trybu, uproszczone kolizje i limit zasobów,
- walidator sprawdza osiągalność punktów, odległości respawnów, wyjście poza planszę, liczbę trójkątów, rozmiar pobierania i zgodność licencji,
- publikacja tworzy niezmienną wersję mapy, miniaturę, autora, opis i listę zmian,
- mapy są moderowane przed wejściem do publicznej rotacji,
- po meczu gracz może oddać jedną ocenę; właściciel mapy nie może oceniać własnej pracy.

### 13.13. Aktualizacja 2.4 — rozszerzony anty-cheat i odwołania

- serwer wykrywa niemożliwą prędkość, szybkostrzelność, amunicję, pozycję, kąt obrotu oraz trafienie bez zgodnej linii strzału,
- analiza statystyczna oznacza nienaturalną celność, czas reakcji i śledzenie celu do ręcznej kontroli, ale sama nie nakłada trwałej blokady,
- przypadek zawiera replay, zdarzenia serwera, wersję klienta i reguły, które zostały naruszone,
- kary mają powód, dowody, autora decyzji, czas rozpoczęcia, czas zakończenia i historię zmian,
- gracz może złożyć jedno odwołanie do danej kary, a moderator rozpatrujący odwołanie nie może być autorem pierwotnej decyzji,
- system nie instaluje sterownika, nie skanuje prywatnych plików i nie wykonuje inwazyjnych kontroli urządzenia.

### 13.14. Aktualizacja 2.5 — mistrzostwo broni, medale i kontrakty

- każda broń ma osobny poziom mistrzostwa zwiększany wyłącznie przez zatwierdzone zdarzenia meczu,
- poziomy mistrzostwa odblokowują wyłącznie kosmetyki, wizytówki, zawieszki i oznaczenia profilu,
- medale meczowe obejmują: headshot, podwójną i potrójną eliminację, serię, zemstę, przerwanie serii, obronę oraz przejęcie celu,
- kontrakty broni mają konkretne warunki, np. trafienia w głowę, eliminacje z dystansu lub ukończone mecze z daną bronią,
- postęp kontraktu nie może wymagać szkodzenia własnej drużynie ani celowego przegrywania,
- nagroda kontraktu jest przyznawana tylko raz i nie zwiększa obrażeń ani innych parametrów broni.

### 13.15. Aktualizacja 2.6 — przebieg meczu, AFK i komentator

- drużyna może rozpocząć głosowanie nad poddaniem po upływie 5 minut; wymagane jest co najmniej 4 z 5 głosów,
- jedno głosowanie może trwać 30 sekund, a następne można rozpocząć po 3 minutach,
- gracz bez wejścia i ruchu przez 90 sekund otrzymuje ostrzeżenie, a po kolejnych 30 sekundach zostaje zastąpiony botem,
- powrót gracza przed końcem meczu usuwa bota i przywraca miejsce,
- tryb komentatora pokazuje oba zespoły, wynik, cele, ekonomię nagród i opóźnione pozycje graczy,
- publiczny widz turnieju otrzymuje obraz opóźniony o co najmniej 120 sekund, aby nie pomagać zawodnikom,
- panel komentatora nie udostępnia możliwości zmiany stanu meczu.

### 13.16. Aktualizacja 2.7 — interaktywne i częściowo zniszczalne mapy

- mapy mogą zawierać autorytatywne drzwi, windy i ruchome platformy ze zsynchronizowanym stanem,
- wybuchowe beczki zadają obrażenia według odległości, mają ostrzeżenie wizualne i jednoznaczny właściciel zdarzenia,
- wybrane osłony mają maksymalnie trzy stany zniszczenia zamiast pełnej fizyki destrukcji,
- zagrożenia mapy, takie jak pociąg, kruchy lód lub zamykane przejścia, działają według deterministycznego harmonogramu serwera,
- stan interaktywnych elementów jest zapisywany w replayu,
- elementy nie mogą blokować punktów odrodzenia ani tworzyć niemożliwego do opuszczenia obszaru,
- prywatny serwer może wyłączyć zagrożenia mapy przed rozpoczęciem meczu.

### 13.17. Aktualizacja 2.8 — prezentacja, lokalizacja i integracje

- tryb fotograficzny działa wyłącznie w replayu i pozwala zmienić kamerę, FOV, głębię ostrości oraz ukryć interfejs,
- centrum aktualności pobiera podpisany manifest wersji, pokazuje opis zmian i nigdy nie wykonuje kodu pobranego z treści,
- interfejs od początku tej aktualizacji obsługuje język polski i angielski oraz formatowanie liczb i dat według locale,
- publiczny profil internetowy pokazuje wyłącznie informacje wybrane przez gracza: nazwę, rangę, osiągnięcia, mistrzostwo broni i statystyki,
- API turniejowe udostępnia tylko odczyt wyników, drabinek i publicznych profili, korzysta z kluczy, limitów oraz wersjonowania,
- codzienna rotacja map i trybów specjalnych jest podpisana przez serwer i nie obejmuje trybu rankingowego,
- system najlepszych akcji może automatycznie utworzyć krótki klip z replayu, ale publikacja zawsze wymaga decyzji gracza.

### 13.18. Aktualizacja 2.9 — dopracowanie, diagnostyka i odporność

- gracz może uruchomić animację oglądania aktualnej broni; animacja jest przerywana przez strzał, przeładowanie lub zmianę broni,
- przed meczem wyświetlana jest krótka prezentacja drużyn z nazwami, skinami i wyposażeniem,
- po meczu zwycięzcy pojawiają się na podium z wyposażonymi skinami i wybranymi pozami,
- rozgrzewka trwa maksymalnie 60 sekund, pozwala dołączać graczom i nie nalicza wyniku, statystyk, zadań ani amunicji profilu,
- lista serwerów pozwala oznaczać ulubione pozycje i przechowuje historię ostatnich 20 serwerów,
- pierwszy start i ręczne polecenie uruchamiają krótki benchmark dobierający jakość cieni, VFX, tekstur, rozdzielczości i post-processingu,
- panel połączenia pokazuje ping, jitter, utratę pakietów, region i jakość synchronizacji bez ujawniania prywatnych adresów innych graczy,
- po odświeżeniu karty lub awarii klient odtwarza token sesji i próbuje wrócić do aktywnego meczu przez 30 sekund,
- ustawienia celownika i wyposażenia można udostępniać za pomocą wersjonowanych kodów bez danych konta,
- wybrane mapy otrzymują warianty dnia, nocy, deszczu i zimy, ale geometria kolizji oraz pozycje celów pozostają identyczne,
- strzelnica zawiera wyzwania czasowe i lokalnego ducha najlepszego przejazdu lub wyniku,
- lektor odtwarza krótkie komunikaty systemowe, np. ostatnia minuta, seria eliminacji i rozpoczęcie dogrywki; nie jest to czat,
- centrum statusu pokazuje dostępność regionów, zaplanowane przerwy i trwające incydenty,
- po powtarzającej się awarii gra proponuje tryb bezpieczny z minimalnymi ustawieniami grafiki i wyłączonym post-processingiem.

### 13.19. Wersja 3.0 — bezpieczeństwo operacyjne, utrzymanie i zgodność

- raportowanie awarii jest domyślnie ograniczone do danych technicznych, usuwa tokeny i dane osobowe oraz można je wyłączyć,
- anonimowa telemetria wydajności i korzystania z funkcji wymaga jasnej zgody oraz posiada osobne ustawienie,
- baza profili, ekonomii i konfiguracji ma szyfrowane kopie zapasowe z harmonogramem, retencją i kontrolą dostępu,
- automatyczny test regularnie odtwarza kopię do odizolowanego środowiska i porównuje liczbę oraz sumy kontrolne rekordów,
- monitoring obejmuje dostępność, opóźnienie, błędy, wykorzystanie CPU i pamięci, kolejki, liczbę pokojów oraz kondycję bazy,
- alarmy mają właściciela, priorytet, instrukcję reakcji i ograniczenie duplikatów,
- infrastruktura skaluje liczbę procesów pokojów według obciążenia i nigdy nie przenosi aktywnego meczu bez obsługi reconnectu,
- publiczne endpointy mają limity, ochronę przed nadużyciami, kontrolę rozmiaru wiadomości i możliwość awaryjnego blokowania ruchu,
- aktualizacje serwera są wdrażane stopniowo; aktywne mecze mogą zakończyć się na starszej zgodnej wersji,
- każde wydanie ma automatyczny rollback, jeśli wskaźniki błędów lub reconnectów przekroczą ustalone progi,
- flagi funkcji pozwalają włączać nowy system według środowiska, regionu i procentu kont bez zmiany ekonomii po stronie klienta,
- środowiska lokalne, testowe, staging i produkcyjne mają oddzielne bazy, sekrety, domeny i klucze,
- panel ekonomii pokazuje historię zmian coinów i przedmiotów, źródło transakcji oraz umożliwia kontrolowaną korektę z podwójną autoryzacją,
- gracz może przeglądać i usuwać dane zgodnie z obowiązującą polityką, a operacja pozostawia wyłącznie wymagany, zminimalizowany ślad audytowy,
- regulamin, polityka prywatności, polityka zachowania, ograniczenia wiekowe i kontrola rodzicielska muszą przejść niezależny przegląd prawny przed publikacją,
- plan techniczny nie zastępuje porady prawnej; ostateczne wymagania zależą od krajów publikacji, sposobu monetyzacji i wieku odbiorców.
