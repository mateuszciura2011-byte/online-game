# Boty — amunicja i kontakt z postaciami

Naprawione problemy:
- Bot po opróżnieniu magazynka nie przeładowywał broni. Teraz przeładowanie trwa zgodnie z konfiguracją danej broni i pobiera amunicję z zapasu dopiero po zakończeniu.
- Po wyczerpaniu całego zapasu broni głównej bot przechodzi na pistolet; nie otrzymuje nieskończonej amunicji.
- Stan przeładowania jest przypisany do życia postaci, więc nie przechodzi przez odrodzenie.
- Kontakt z inną postacią blokuje ruch poziomy, ale nie cofa skoku i grawitacji.

Weryfikacja: testy integracyjne odtworzyły oba pierwotne błędy przed poprawką. Po zmianach przeszło 81 testów serwera oraz kontrola TypeScript. Niezależny przegląd nowych zmian nie wykazał istotnych problemów.

Zakres: zmiany dotyczą logiki serwera. Nie dodano nowej animacji przeładowania zdalnych postaci, grupowej taktyki botów ani nowego algorytmu rozdzielania tłoku. Istniejące kolizje nadal blokują nakładanie postaci.
