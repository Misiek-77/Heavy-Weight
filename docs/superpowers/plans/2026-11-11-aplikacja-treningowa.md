# Aplikacja do treningu siłowego — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Minimalistyczna aplikacja webowa (PWA) do zapisywania treningu siłowego, planów, historii z postępami i bazy ćwiczeń, z danymi lokalnie na urządzeniu.

**Architecture:** Czysta warstwa `domain/` (TypeScript bez Reacta) liczy statystyki i operacje na treningu. Jedyny dostęp do danych to interfejs `Repository` z implementacją na IndexedDB. Jeden kontekst Reacta (`StoreProvider`) trzyma całość danych w pamięci i zapisuje każdą zmianę przez repozytorium; ekrany czytają tylko z niego.

**Tech Stack:** React 18, TypeScript, Vite, vite-plugin-pwa, react-router-dom (HashRouter), idb, Vitest, zwykły CSS ze zmiennymi.

**Spec:** `docs/superpowers/specs/2026-11-11-aplikacja-treningowa-design.md`

## Global Constraints

- Interfejs po polsku, ciężar w kg.
- `src/domain/` i `src/data/repository.ts` nie importują Reacta ani API przeglądarki.
- Identyfikatory UUID, daty ISO 8601, każdy rekord ma `updatedAt`.
- Najwyżej jeden trening bez `finishedAt`; zapisywany po każdej zmianie.
- Ćwiczeń nie kasujemy, tylko `archived: true`.
- Szacowane 1RM: `weight * (1 + reps / 30)`, dla 1 powtórzenia równe ciężarowi.
- Statystyki tylko z zakończonych treningów i odhaczonych serii.
- Domyślna przerwa 90 s. Cele dotykowe min. 44 px. Kolumna maks. 480 px.
- Motyw: `<meta name="color-scheme">` + `light-dark()`, nadpisanie w `localStorage["color-scheme"]`; domyślnie system.
- Okna modalne: natywny `<dialog>` + `showModal()`, `closedby="any"` z zapasową obsługą kliknięcia poza oknem.

## Review Focus

1. Liczba z przecinkiem (`62,5`) w polu ciężaru → zapisane 62.5; `-5` i `abc` odrzucone. (Task 2: `parseNumber`)
2. Seria 0 kg (masa ciała) × 10 powt. → liczy się do historii, 1RM = 0, nic się nie wywraca; wykres nie dzieli przez zero. (Task 2: `stats`)
3. Zakończenie treningu bez żadnej odhaczonej serii → trening nie trafia do historii. (Task 3: `finishWorkout` zwraca `null`)
4. Start planu zawierającego zarchiwizowane ćwiczenie oraz historia z takim ćwiczeniem → nazwa nadal widoczna, plan startuje. (Task 3: `createWorkout`)
5. Import pliku, który jest poprawnym JSON-em, ale nie kopią aplikacji (np. `{}` albo trening wskazujący nieistniejące ćwiczenie) → błąd, dane bez zmian. (Task 4: `parseBackup`)

---

### Task 1: Szkielet projektu

**Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `scripts/make-icons.mjs`, `public/icon-192.png`, `public/icon-512.png`

- [ ] Vite + React + TS, Vitest (`npm test` = `vitest run`), `vite-plugin-pwa` z manifestem (`name: "Trening"`, `lang: "pl"`, `display: "standalone"`, ikony 192/512).
- [ ] `index.html`: `lang="pl"`, `<meta name="color-scheme" content="light dark">` i zaraz po nim skrypt inline ustawiający `content` z `localStorage["color-scheme"]`.
- [ ] `npm run build` przechodzi. Commit.

### Task 2: Domena — typy, liczby, statystyki

**Files:** `src/domain/types.ts`, `src/domain/id.ts`, `src/domain/number.ts`, `src/domain/stats.ts`, testy `src/domain/number.test.ts`, `src/domain/stats.test.ts`

**Produces:**
- Typy `Exercise`, `Plan`, `PlanItem`, `Workout`, `WorkoutEntry`, `WorkoutSet`, `Settings { restSeconds }`, `AppData { exercises, plans, workouts, settings }`, `MuscleGroup`, `Equipment`.
- `newId(): string` (z zapasem na brak `crypto.randomUUID`).
- `parseNumber(text: string): number | null`
- `epley1RM(weight: number, reps: number): number`
- `workoutVolume(w: Workout): number`
- `finishedWorkouts(ws: Workout[]): Workout[]` (malejąco po `startedAt`)
- `lastPerformance(ws: Workout[], exerciseId: string): WorkoutSet[]`
- `exerciseRecords(ws, exerciseId): { maxWeight: {weight, reps, date} | null; best1RM: {value, date} | null; maxVolume: {value, date} | null }`
- `progressSeries(ws, exerciseId): { date: string; value: number }[]` (rosnąco)
- `newRecordExerciseIds(workout: Workout, earlier: Workout[]): string[]`

- [ ] Testy: `parseNumber("62,5") === 62.5`, `"62.5"`, `""`→null, `"-5"`→null, `"abc"`→null; `epley1RM(100,1)===100`, `epley1RM(100,10)≈133.33`, `epley1RM(0,10)===0`; objętość pomija nieodhaczone serie; rekordy i seria progresu ignorują trening aktywny; `lastPerformance` bierze najnowszy zakończony trening; `newRecordExerciseIds` wykrywa lepsze 1RM i nie zgłasza rekordu przy pierwszym w życiu 0 kg.
- [ ] Testy czerwone → implementacja → zielone. Commit.

### Task 3: Domena — operacje na treningu, dane startowe

**Files:** `src/domain/workout.ts`, `src/domain/workout.test.ts`, `src/domain/seed.ts`

**Produces:**
- `createWorkout(opts: { plan?: Plan; name: string; now: string; history: Workout[] }): Workout`
- `addEntry(w, exerciseId, history): Workout`, `removeEntry(w, entryIndex)`
- `addSet(w, entryIndex)`, `updateSet(w, entryIndex, setIndex, patch: Partial<WorkoutSet>)`, `removeSet(w, entryIndex, setIndex)`
- `finishWorkout(w, now): Workout | null`
- `SEED_EXERCISES: Exercise[]` (ok. 60, stałe id `seed-*`), `SEED_PLANS: Plan[]` (Push, Pull, Legs)

Wszystkie funkcje zwracają nowy obiekt (bez mutacji) i ustawiają `updatedAt`.

- [ ] Testy: start z planu tworzy `targetSets` serii na ćwiczenie, wypełnionych z `lastPerformance` (seria i-ta, a gdy brak — ostatnia dostępna; bez historii 0/0), wszystkie `done: false`; `addSet` kopiuje ciężar i powtórzenia poprzedniej serii; `finishWorkout` usuwa nieodhaczone serie i puste ćwiczenia, ustawia `finishedAt`; bez odhaczonych serii zwraca `null`; plan z ćwiczeniem spoza listy nadal tworzy trening; każdy `exerciseId` w `SEED_PLANS` istnieje w `SEED_EXERCISES`, id są unikalne.
- [ ] Czerwone → implementacja → zielone. Commit.

### Task 4: Dane — repozytorium, kopia zapasowa

**Files:** `src/data/repository.ts`, `src/data/idbRepository.ts`, `src/data/backup.ts`, `src/data/backup.test.ts`

**Produces:**
- `interface Repository { loadAll(): Promise<AppData>; putExercise(e); putPlan(p); deletePlan(id); putWorkout(w); deleteWorkout(id); putSettings(s); replaceAll(d: AppData): Promise<void> }`
- `createIdbRepository(): Repository` (baza `trening`, wersja 1, magazyny `exercises`, `plans`, `workouts`, `settings`)
- `serializeBackup(data: AppData, now: string): string` → `{ app: "trening", version: 1, exportedAt, data }`
- `parseBackup(text: string): { ok: true; data: AppData } | { ok: false; error: string }`

- [ ] Testy `parseBackup`: runda `serialize → parse` zwraca te same dane; nie-JSON, `{}`, zły `app`, brak tablic, seria z ujemnym ciężarem, trening z `exerciseId` spoza `exercises` → `ok: false` z polskim komunikatem.
- [ ] Czerwone → implementacja → zielone. Commit.

### Task 5: Powłoka aplikacji

**Files:** `src/styles/tokens.css`, `src/styles/app.css`, `src/state/store.tsx`, `src/state/restTimer.tsx`, `src/state/theme.ts`, `src/ui/*` (`Sheet`, `NumberField`, `Icon`, `Header`, `TabBar`, `RestBar`, `ConfirmDialog`, `LineChart`, `format.ts`), `src/App.tsx`

**Produces:**
- `useStore()`: `{ ready, error, exercises, plans, workouts, settings, activeWorkout, saveExercise, savePlan, removePlan, saveWorkout, removeWorkout, saveSettings, replaceAll }`. Przy pustej bazie zapisuje `SEED_EXERCISES` i `SEED_PLANS`. Błąd zapisu ustawia `error` (baner), stan w pamięci zostaje.
- `useRestTimer()`: `{ remaining, total, start(seconds), add(delta), stop() }`; po dojściu do zera `navigator.vibrate?.(200)`.
- `getTheme() / setTheme("system" | "light" | "dark")`.
- Trasy: `/`, `/plany`, `/plany/:id`, `/historia`, `/historia/:id`, `/cwiczenia`, `/cwiczenia/:id`, `/ustawienia`.

- [ ] Tokeny kolorów przez `light-dark()`, `color-scheme` mapowane z `<meta>` selektorem `:has()`. Dolna nawigacja z `env(safe-area-inset-bottom)`.
- [ ] `npm run build` przechodzi. Commit.

### Task 6: Ekrany

**Files:** `src/screens/TrainingScreen.tsx`, `ActiveWorkout.tsx`, `ExercisePicker.tsx`, `PlansScreen.tsx`, `PlanEditor.tsx`, `HistoryScreen.tsx`, `WorkoutDetail.tsx`, `ExercisesScreen.tsx`, `ExerciseDetail.tsx`, `SettingsScreen.tsx`

- [ ] Trening: start pusty / z planu; aktywny trening wg specyfikacji; odhaczenie serii z `reps > 0` startuje stoper; „Zakończ” → podsumowanie (czas, objętość, rekordy) albo pytanie o odrzucenie, gdy `finishWorkout` zwróci `null`; „Anuluj trening” po potwierdzeniu.
- [ ] Plany: lista, edytor (nazwa, ćwiczenia, liczba serii, góra/dół, usuń).
- [ ] Historia: lista, szczegóły, usuwanie.
- [ ] Ćwiczenia: filtr partii, wyszukiwarka, dodawanie/edycja/archiwizacja własnych, widok postępów z wykresem i rekordami.
- [ ] Ustawienia: motyw (System pokazuje „obecnie jasny/ciemny”), przerwa, eksport, import z potwierdzeniem.
- [ ] `npm test` i `npm run build` przechodzą. Commit.

### Task 7: Weryfikacja w przeglądarce

- [ ] Szerokość telefonu, oba motywy: plan → trening → odhaczenie serii → stoper → zakończenie → historia → wykres ćwiczenia.
- [ ] Odświeżenie w trakcie treningu zachowuje stan.
- [ ] Eksport, potem import tego samego pliku; import błędnego pliku pokazuje komunikat.
- [ ] Brak błędów w konsoli.
