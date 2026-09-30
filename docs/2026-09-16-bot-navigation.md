# Boty i kolizje — drugi etap

Zmiany: wybór widocznego przeciwnika przed zasłoniętym; wstrzymanie ognia przy zasłonięciu; trasa wokół narożników osłon z zapasem na promień postaci; opóźnienie reakcji po zmianie celu; zachowanie skoku i grawitacji przy zablokowanym ruchu poziomym.

Nowe testy odtworzyły strzelanie w zasłonięty cel, niewłaściwy priorytet celu i zatrzymywanie skoku przy ścianie przed poprawką. Dodatkowa symulacja prowadzi bota wokół szerokiej ściany aż do pozycji strzeleckiej, sprawdzając każdy odcinek ruchu. Test cienkiej przeszkody sprawdza dokładne przecięcie odcinka.

Po poprawce: 76 testów serwera przeszło, kontrola TypeScript serwera bez błędów. Przeszło 8 testów przeglądarkowych meczów i sterowania. Niezależny przegląd potwierdził rozbieżność promienia nawigacji i fizyki; poprawiono ją i dodano test obu końców trasy blisko ściany. Nie zmieniano modeli, UI ani ekonomii gry w tym etapie. Nawigacja jest geometryczna; boty nie mają jeszcze pamięci ostatnio widzianego celu ani zespołowego planowania osłon. Istniejące blokowanie nakładania postaci zachowano — nie jest to nowy system unikania tłoku.
