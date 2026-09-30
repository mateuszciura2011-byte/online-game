# Wyposażenie profilu w meczu

W trybie wszyscy na wszystkich serwer odczytuje wybraną broń główną z
uwierzytelnionego profilu i przekazuje ją w stanie meczu. Przeglądarka nie
ustawia już samodzielnie broni z profilu po rozpoczęciu meczu, więc nie może
na chwilę pokazywać innej broni niż serwer.

Tryby drużynowe i Ładunek zachowują pistolet na wejściu: broń główną wybiera
się tam w fazie zakupów. Brak lub błędny token daje pistolet. Wyposażenie nie
jest przekazywane jako zaufane pole od klienta.

Testy obejmują rozstrzygnięcie profilu, wolny mecz, tryb drużynowy i rzeczywisty
start meczu w przeglądarce. Lokalny serwer testowy został ponownie uruchomiony,
aby test faktycznie używał nowej wersji.
