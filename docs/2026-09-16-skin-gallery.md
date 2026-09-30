# Galeria skinów — wykonany etap planu

Menu główne oraz kolekcja korzystają ze wspólnych, autorskich portretów SVG w czterech paletach: Rekrut, Neon, Mróz i Złoty Szturm. Są to ilustracje podglądowe 2D, nie nowy model postaci w meczu.

W kolekcji można obejrzeć zablokowany skin bez kupowania i bez zmiany wyposażenia. Wyposażenie ma osobny przycisk, pozostaje ograniczone do posiadanych skinów i nadal jest sprawdzane przez serwer. Podgląd pokazuje stan posiadania oraz informację o czysto kosmetycznym charakterze wyglądu. Wybór podglądu przewija do jego panelu.

Usunięto starszy handler skinów: wykonywał dodatkowe pobranie profilu i mógł nadpisać nową galerię po spóźnionej odpowiedzi. Dodano ochronę przed aktualizacją zamkniętej kolekcji oraz komunikat błędu przy nieudanym wyposażaniu lub wczytywaniu.

Nowe scenariusze przeglądarkowe sprawdzają podgląd zablokowanego skina bez zmiany aktywnego wyposażenia oraz pojedyncze pobranie profilu przez kolekcję. Zmieniony test skrzynek sprawdza obecność czterech kart zamiast nieaktualnego nagłówka.

Poza tym etapem pozostaje autoryzowana synchronizacja wyglądu postaci między graczami, nowe animacje i dalsza przebudowa wyposażenia. Nie zmieniano cen ani prawdopodobieństw nagród ze skrzynek.
