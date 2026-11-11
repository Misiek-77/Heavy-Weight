# Aplikacja do treningu siłowego — projekt (v1)

Data: 2026-11-11

## Cel

Nowoczesna, minimalistyczna aplikacja webowa do prowadzenia treningu siłowego:
zapisywanie serii na żywo, własne plany, historia z postępami i baza ćwiczeń.
Używana głównie na telefonie, na siłowni, także bez internetu.

## Zakres

W v1:

- zapisywanie treningu na żywo,
- plany treningowe (szablony),
- historia, wykresy progresu, rekordy osobiste,
- baza ćwiczeń z możliwością dodawania własnych,
- ustawienia: motyw, domyślna przerwa, eksport/import danych.

Poza v1 (planowane później, projekt ma ich nie blokować):

- konta i synchronizacja w chmurze,
- aplikacja natywna (React Native),
- synchronizacja z aplikacją do liczenia kroków,
- moduł żywienia na wzór Fitatu.

## Technologia

- React 18 + TypeScript + Vite.
- PWA (`vite-plugin-pwa`): manifest, service worker, działanie offline, instalacja na ekranie głównym.
- Routing: `react-router` (HashRouter, żeby działało na dowolnym hostingu statycznym).
- Dane: IndexedDB przez bibliotekę `idb`.
- Style: zwykły CSS ze zmiennymi (tokeny kolorów, odstępów, typografii), bez frameworka UI.
- Wykresy: własny, prosty komponent SVG (liniowy), bez biblioteki.
- Testy: Vitest dla logiki domenowej.

## Struktura kodu

```
src/
  domain/        czysty TypeScript, bez Reacta i bez przeglądarki
    types.ts         modele danych
    stats.ts         rekordy, szacowane 1RM, objętość, serie progresu
    workout.ts       operacje na treningu (dodaj ćwiczenie/serię, zakończ)
    seedExercises.ts wbudowana lista ćwiczeń
  data/
    repository.ts    interfejs Repository (jedyna droga do danych)
    idbRepository.ts implementacja na IndexedDB
    backup.ts        eksport/import JSON
  state/           hooki Reacta łączące UI z repozytorium
  ui/              współdzielone komponenty (przycisk, arkusz, pole liczby, wykres)
  screens/         Trening, AktywnyTrening, Plany, Historia, Cwiczenia, Ustawienia
  styles/          tokeny i style globalne
```

Zasada: `domain/` i interfejs `Repository` nie zależą od Reacta ani od API
przeglądarki — to one przejdą do wersji natywnej. Wymiana zapisu na chmurę to
nowa implementacja `Repository`, bez zmian w ekranach.

## Model danych

Wszystkie identyfikatory to UUID, daty w ISO 8601, ciężar w kg.

- **Exercise**: `id`, `name`, `muscleGroup` (klatka, plecy, nogi, barki, biceps,
  triceps, brzuch, inne), `equipment` (sztanga, hantle, maszyna, wyciąg, masa
  ciała, inne), `custom: boolean`, `archived: boolean`.
- **Plan**: `id`, `name`, `items: { exerciseId, targetSets }[]`, `createdAt`.
- **Workout**: `id`, `planId?`, `name`, `startedAt`, `finishedAt?`,
  `entries: WorkoutEntry[]`.
- **WorkoutEntry**: `exerciseId`, `sets: WorkoutSet[]`.
- **WorkoutSet**: `weight`, `reps`, `done: boolean`.
- **Settings**: `restSeconds` (domyślnie 90). Motyw (`system` | `light` | `dark`) jest ustawieniem
  urządzenia, nie danych: trzymany w `localStorage`, żeby zastosować go przed pierwszym
  wyrenderowaniem strony; nie trafia do kopii zapasowej.

Trening bez `finishedAt` to trening aktywny; może istnieć najwyżej jeden.
Jest zapisywany po każdej zmianie, więc zamknięcie karty lub odświeżenie nie
gubi danych.

Każdy rekord ma `updatedAt`, a usuwanie ćwiczeń jest miękkie (`archived`) —
to przygotowanie pod późniejszą synchronizację i zachowanie spójności historii.

## Ekrany

Dolna nawigacja z czterema zakładkami; Ustawienia pod ikoną w nagłówku.

### Trening
- Bez aktywnego treningu: przycisk „Rozpocznij pusty trening” i lista planów
  do startu jednym dotknięciem.
- Aktywny trening: nazwa, czas trwania, lista ćwiczeń. Każde ćwiczenie ma
  wiersze serii: numer, wynik z poprzedniego treningu, pola `kg` i `powt.`,
  przycisk odhaczenia. Nowa seria wstępnie wypełnia się wartościami z
  poprzedniej serii lub z poprzedniego treningu.
- Odhaczenie serii uruchamia stoper przerwy (pasek u dołu, ±15 s, pominięcie).
  Po zakończeniu odliczania krótka wibracja, jeśli urządzenie ją obsługuje.
- „Dodaj ćwiczenie” otwiera wybór z bazy ćwiczeń.
- „Zakończ” zapisuje trening (pomija nieodhaczone serie) i pokazuje krótkie
  podsumowanie: czas, objętość, nowe rekordy. „Anuluj trening” usuwa go po
  potwierdzeniu.

### Plany
- Lista planów, tworzenie i edycja: nazwa, ćwiczenia, liczba serii, zmiana
  kolejności, usuwanie.
- Przy pierwszym uruchomieniu dodawane są trzy przykładowe plany
  (Push / Pull / Legs), które można edytować lub usunąć.

### Historia
- Lista zakończonych treningów (data, nazwa, czas, objętość); szczegóły
  treningu po dotknięciu, z możliwością usunięcia.
- Widok ćwiczenia: wykres najlepszego szacowanego 1RM w czasie oraz rekordy
  (najcięższa seria, najlepsze szacowane 1RM, największa objętość w treningu).

### Ćwiczenia
- Ok. 60 wbudowanych ćwiczeń, filtr po partii mięśniowej, wyszukiwarka.
- Dodawanie własnych; własne można edytować i archiwizować.
- Dotknięcie ćwiczenia prowadzi do jego widoku postępów.

### Ustawienia
- Motyw: system / jasny / ciemny.
- Domyślny czas przerwy.
- Eksport wszystkich danych do pliku JSON i import z pliku (zastępuje dane po
  potwierdzeniu; plik jest walidowany przed zapisem).

## Obliczenia

- Szacowane 1RM: wzór Epleya, `weight * (1 + reps / 30)`; dla 1 powtórzenia
  równe ciężarowi.
- Objętość: suma `weight * reps` po odhaczonych seriach.
- Rekordy liczone tylko z zakończonych treningów i odhaczonych serii.

## Wygląd

- Motyw jasny i ciemny według `prefers-color-scheme`, z ręcznym nadpisaniem.
- Jeden kolor akcentu, używany wyłącznie dla głównej akcji i stanu „zrobione”.
- Duże cyfry (tabelaryczne), dużo pustej przestrzeni, cienkie linie zamiast
  kart z cieniami, cele dotykowe min. 44 px.
- Układ pod telefon; na szerszym ekranie wyśrodkowana kolumna maks. 480 px.
- Interfejs po polsku.

## Obsługa błędów

- Błąd zapisu do IndexedDB: komunikat na ekranie, stan w pamięci zostaje,
  kolejna zmiana ponawia zapis.
- Import z niepoprawnego pliku: komunikat, dane bez zmian.
- Pola liczbowe przyjmują przecinek i kropkę; wartości ujemne i nieliczbowe
  są odrzucane.

## Testy

- Testy jednostkowe (Vitest) dla `domain/`: 1RM, objętość, rekordy, serie
  progresu, operacje na treningu, walidacja importu.
- Ręczna weryfikacja w przeglądarce w szerokości telefonu, w obu motywach:
  pełny przebieg (plan → trening → zakończenie → historia → wykres),
  odświeżenie w trakcie treningu, eksport i import.
