# PolyStrike — pakiet modeli, 30 września 2026

## Wykonane zmiany

- Sześć broni: zamknięte, fazowane profile zamiast zwykłych pudełek, okrągłe lufy, odrębne proporcje receiverów, magazynków i kolb; snajperka ma cylindryczną lunetę, strzelba dodatkową rurę magazynka, nóż zwężające się ostrze i gardę.
- Dłonie i rękawy: fazowane kształty, zachowane punkty chwytu i animacje przeładowania/pompy.
- Trzy warianty postaci: fazowane kamizelki, kończyny, rękawice, buty i ładownice, gogle, maski i zestawy słuchawkowe; bardziej rozpoznawalna broń trzecioosobowa.
- Cele treningowe: tarcze sylwetkowe z dwustronnym oznaczeniem i stojakiem zamiast różowych cylindrów. Wszystkie części przechowują identyfikator celu.
- Budynki wszystkich sześciu map: detale fasad i wyposażenie dachów. Pięć nowoczesnych map ma osadzone na podstawach urządzenia dachowe i wyciągi; Cytadela zachowuje historyczne blanki. W późniejszej kontroli pełnego zestawu powtarzane cienkie detale fasad przywrócono do lekkiej geometrii, aby zachować budżet widoku mapy (patrz UI_PACKAGE_2026-09-30.md).
- Punkt wylotu strzału wynika z faktycznych granic cylindrycznej lufy. Ozdoby postaci nie rozszerzają celów trafienia; kolizje map nadal należą do wspólnego planu klienta i serwera.

Modele są oryginalnie generowane w projekcie. Nie pobrano ani nie dołączono zewnętrznych modeli. Zachowano istniejące skiny i tryby.

## Sprawdzenie

- Pełne testy jednostkowe: 301/301; po końcowej korekcie ponownie 28/28 testów modeli, skinów i map.
- Kontrola typów i build: przeszły po końcowych zmianach.
- Chrome: 17/17 testów — sześć map, poruszanie/pauza, strzelanie/przeładowanie, skiny, zasoby GPU, stały viewport oraz katalog modeli bez postprocessingu.
- Po korekcie podstaw dachowych i końcówek kolb: ponownie 5/5 testów Chrome.
- Katalog broni: 13–44 wywołań renderowania i 352–1256 trójkątów na model. Nie jest to pomiar czasu GPU.
- Przejrzano rzeczywiste zrzuty katalogu broni, postaci i architektury. Przegląd wykrył unoszenie urządzeń nad dachami jednospadowymi; poprawiono osadzenie i dodano podstawy.

## Ograniczenia

Pozostaje wcześniejsze ostrzeżenie buildu o paczce silnika Three.js powyżej 500 kB. Pakiet nie obejmuje publikacji ani importu animowanych modeli z zewnętrznych sklepów. Testy Chrome nie oznaczają sprawdzenia każdej konfiguracji sprzętu i przeglądarki.
