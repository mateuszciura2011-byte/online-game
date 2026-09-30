# PolyStrike — przegląd rozgrywki, 16 września 2026

## Referencje

Przejrzano materiały i fragmenty wideo, nie pełne mecze:
- Counter-Strike 2: https://www.counter-strike.net/cs2/ — przewidywalna reakcja na wejście gracza.
- VALORANT: https://playvalorant.com/en-gb/news/announcements/beginners-guide/ — czytelna informacja o broni i fazie zakupów.
- BattleBit: https://joinbattlebit.com/ — czytelność low-poly i mało zasłaniający HUD.

## Wdrożony etap

- Natychmiastowy pierwszy strzał; przytrzymanie spustu dla karabinu i PM, pojedyncze strzały pistoletu.
- Wizualny tor strzału od końca lufy do punktu celowania; przeszkoda przed celem zatrzymuje treningowe trafienie. Brak iskier w pustym powietrzu.
- Przeładowanie z czasem, postępem i ruchem broni; amunicja uzupełnia się na końcu.
- Mniejszy model broni, uporządkowane informacje o amunicji, ostrzeżenie o małym zapasie i skróty sterowania.
- Sklep pośrodku ekranu, uwolniony kursor w fazie zakupów; kliknięcie karty nie strzela.
- Przeszkody i kierunek gracza na minimapie, również podczas treningu.
- Skok w treningu nie jest zerowany przez ograniczanie pozycji do mapy.
- Ponowne wejście do treningu resetuje amunicję, trafienia, ruch i stan skoku.
- Usunięcie wyścigu ustawiania domyślnego trybu szybkiej gry.
- Dekoracyjne budynki Odlewni odsunięte od miejsc startowych.

## Weryfikacja

Końcowy pełny przebieg testów przeglądarkowych zapisał status passed, bez nieudanych testów. Obejmuje strzelanie, przeładowanie, pauzę, ponowny trening i pomiar sprintu względem chodu na minimapie. Obejrzano zapisane zrzuty sklepu, treningu i skoku.

41 testów mechanik/VFX/miejsc startowych przeszło. Kontrola TypeScript i kompilacja produkcyjna przeszły. Kompilacja zgłasza ostrzeżenie o paczce JavaScript ponad 500 kB.

## Granice tego etapu

Nie jest to dowód braku wszystkich błędów gry. Nie przebudowano AI botów ani całej fizyki wszystkich map. Egzekwowanie czasu przeładowania po stronie serwera i zgodność dekoracji z kolizjami na pozostałych mapach wymagają osobnego przeglądu. Test sprintu potwierdza różnicę prędkości, nie pełną poprawność kolizji każdej mapy.
