# PolyStrike — projekt przebudowy

## Cel

Zastąpić obecną, narastająco poprawianą wersję jedną spójną grą przeglądarkową: oryginalnym shooterem low-poly dla maksymalnie 10 osób, z trybem 5 na 5, botami i czytelnym przebiegiem rundy.

## Zasady

- Gra jest autorska: nie używa nazw, map, modeli ani interfejsu Counter-Strike.
- Jedna runda ma kolejność: lobby, odliczanie, kupowanie, gra, wyniki.
- Serwer jest źródłem prawdy dla fazy meczu, życia, punktów, pieniędzy i broni.
- Klient odpowiada za render Three.js, sterowanie, HUD i menu.
- Sterowanie: mysz z blokadą kursora, WASD, Shift, R, 1–6. W treningu nie ma latania ani wyjścia poza arenę.

## Ekrany

Menu ma wyłącznie: Szybka gra 5 na 5, Serwery, Trening, Skórki i skrzynki, Wyposażenie, Konto, Ustawienia. Szybka gra domyślnie uruchamia 5 na 5 z dziewięcioma botami.

HUD pokazuje zdrowie, wybraną broń i amunicję, wynik drużyn, czas rundy, minimapę, krótkie komunikaty zespołowe oraz wynik VICTORY/DEFEAT. Podczas fazy kupowania widoczny jest panel z gotówką, cenami i wybraną bronią.

## Mecz

5 na 5 trwa dziesięć minut. Drużyny są równoważone, boty uzupełniają wolne miejsca. Po 10 sekundach odliczania następuje 15 sekund kupowania. Gracze nie mogą wtedy chodzić ani strzelać. Zwycięża drużyna z większą liczbą eliminacji po czasie lub pierwsza z limitem eliminacji. Wygrana zapisuje statystyki i daje coiny.

## Ekonomia i kolekcja

Każdy gracz rozpoczyna rundę z 800 kredytami. Pistolet i nóż są bezpłatne; PM, karabin, strzelba i snajperka mają ceny. Serwer waliduje zakup, saldo i fazę. Co 300 coinów gracz kupuje skrzynkę, a otwarcie daje skórkę lub zwrot za duplikat. Konto można przenosić kodem.

## Sprawdzanie

Każda reguła serwera ma test jednostkowy. Automatyczne testy przeglądarkowe sprawdzają wejście do meczu, odliczanie/kupowanie oraz trening. Przed udostępnieniem uruchamiane są testy, kontrola typów i testy przeglądarkowe.
