# Trening

Dziennik treningu siłowego: plany, serie, przerwy, rekordy i postępy. Działa w przeglądarce i offline,
a wszystkie dane zostają na urządzeniu.

## Uruchomienie na komputerze

```bash
npm install
npm run dev        # wersja robocza, http://localhost:5173
npm test           # testy
npm run build      # gotowa aplikacja w folderze dist
```

## Publikacja

Aplikacja to zestaw plików statycznych z folderu `dist`, więc działa na każdym hostingu z HTTPS
(HTTPS jest wymagany, żeby działała offline i dała się zainstalować).

- **GitHub Pages:** wypchnij repozytorium na GitHub, a potem w repozytorium wybierz
  Settings → Pages → Source: „GitHub Actions”. Każdy push na `main` lub `master` uruchamia testy i publikuje
  aplikację (`.github/workflows/deploy.yml`).
- **Netlify:** przeciągnij folder `dist` na stronę Netlify Drop albo podłącz repozytorium
  (ustawienia są w `netlify.toml`).

## Instalacja na iPhonie

1. Otwórz adres aplikacji w **Safari**.
2. Stuknij „Udostępnij”, potem „Do ekranu początkowego”.
3. Uruchamiaj ją z ikony. Po pierwszym otwarciu działa bez internetu.

Aplikacja z ekranu początkowego ma własne dane, oddzielne od Safari. Dane z innego urządzenia przeniesiesz
kopią zapasową: Ustawienia → Eksportuj na starym, Importuj na nowym. Na iPhonie koniec przerwy sygnalizuje
dźwięk, bez wibracji, i nie gra on przy zablokowanym ekranie (czas liczy się dalej poprawnie).

## Grafiki ćwiczeń

Ilustracje, animacje i mapy mięśni są w `public/exercises`. Skrypty do ich importu i obróbki są w `scripts`
(opis na początku każdego pliku).
