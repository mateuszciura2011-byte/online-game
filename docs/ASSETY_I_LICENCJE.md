# Assety i licencje PolyStrike

## Zasada projektu

Do gry trafiają wyłącznie assety, które mają jasną licencję pozwalającą na użycie w grze. Każdy importowany model, tekstura i utwór dostaje wpis w manifeście: źródło, autor, licencja, data pobrania i optymalizowana wersja pliku.

## Dozwolone źródła

- **Mixamo** — animacje postaci po potwierdzeniu warunków Adobe/Mixamo.
- **Sketchfab** — wyłącznie modele z licencją zgodną z publikacją gry; wymagane jest zachowanie atrybucji autora, gdy licencja tego wymaga.
- **Three.js** — biblioteka renderująca zgodnie z jej licencją MIT.

## Pipeline przed dodaniem do gry

1. Sprawdź licencję i zapisz jej link w manifeście.
2. Zmniejsz model GLB/GLTF, usuń nieużywane animacje i tekstury.
3. Sprawdź model na urządzeniu o słabszej grafice.
4. Dodaj wpis do napisów końcowych w grze przed publikacją.

## Muzyka i dźwięki

Menu używa spokojniejszej elektroniki, a mecz szybszej, napiętej warstwy rytmicznej. Odtwarzanie jest pojedyncze: żadna pętla nie może zostać uruchomiona drugi raz po zmianie ekranu. Utwory powinny być własne lub mieć licencję umożliwiającą użycie w grze i dystrybucję online.
