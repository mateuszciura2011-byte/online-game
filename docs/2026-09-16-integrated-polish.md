# Zintegrowany pakiet poprawy gry

## Zmienione elementy

- Każda broń ma inną siłę wizualnego odrzutu i dwuwarstwowy syntetyczny dźwięk strzału. Poziomy respektują ustawienia głośności głównej i efektów.
- Nóż nie dziedziczy rozmiaru poprzednio trzymanej broni. Przełączenie broni resetuje jej odrzut i ruch przeładowania.
- Geometria i materiały poprzedniej broni oraz poprzedniej mapy są zwalniane podczas zmiany. Nie jest to pełny audyt zużycia pamięci wszystkich efektów.
- Test wszystkich sześciu map ujawnił punkty startowe wewnątrz lamp i dekoracyjnych budynków na pięciu arenach. Odsunięto kolidujące dekoracje; układ głównych osłon i wspólne dane kolizji pozostają bez zmian. Billboard Crossroads przesunięto razem z budynkiem.
- Ustawienia mają cztery czytelne sekcje, wartości suwaków aktualizowane na żywo, przycisk próby dźwięku i układ jednokolumnowy na węższym ekranie.
- Niepoprawne zapisane wartości ustawień są ograniczane do bezpiecznych zakresów lub zastępowane domyślnymi.

## Weryfikacja

198 testów klienta, serwera i wspólnych reguł przeszło. Kontrola TypeScript klienta i kompilacja produkcyjna przeszły. Pełny zestaw 23 testów przeglądarkowych przeszedł: obejmuje rozgrywkę, sprint, broń, pauzę, zakup, profile, ekwipunek, ustawienia oraz renderowanie sygnałów audio i wyciszenie. Obejrzano zrzuty ustawień dla szerokiego i wąskiego ekranu; następnie zmniejszono zbędne odstępy suwaków.

Niezależny przegląd nie znalazł istotnych problemów integracyjnych; wskazane położenie billboardu poprawiono. Kompilacja nadal ostrzega o głównej paczce JavaScript przekraczającej 500 kB.

## Granice

To spójny pakiet, nie deklaracja braku wszystkich błędów gry. Badanie punktów startowych nie dowodzi zgodności każdej dekoracji z kolizjami na całej mapie. Nie dodawano nowych modeli zewnętrznych, muzyki ani mechanik botów w tym pakiecie; wcześniejsze poprawki botów zostały objęte regresją. Dźwięki sprawdzono przez renderowanie Web Audio, nie przez subiektywną ocenę odsłuchową.
