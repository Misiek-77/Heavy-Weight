import { useRef, useState } from 'react';
import { parseBackup, serializeBackup, serializeCombined } from '../data/backup';
import { historyCsv } from '../data/csv';
import { importHistoryCsv } from '../data/importCsv';
import type { AppData } from '../domain/types';
import { useStore } from '../state/store';
import { WEIGHT_UNITS, type WeightUnit } from '../domain/types';
import { getTheme, setTheme, useSystemDark, type Theme } from '../state/theme';
import { Header } from '../ui/Chrome';
import { formatClock, plural } from '../ui/format';
import { Icon } from '../ui/Icon';
import { saveFile } from '../ui/saveFile';
import { Confirm, Sheet } from '../ui/Sheet';

const REST_STEP = 15;
const REST_MIN = 15;
const REST_MAX = 600;

type Message = { kind: 'ok' | 'error'; text: string } | null;

export function SettingsScreen() {
  const store = useStore();
  const systemDark = useSystemDark();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [pending, setPending] = useState<AppData | null>(null);
  /** The file being imported also holds the nutrition diary, which is restored in that app. */
  const [pendingCombined, setPendingCombined] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  /** A Strong or Hevy export waiting for confirmation, and the unit its weights are in (Strong does not say). */
  const [csvText, setCsvText] = useState<string | null>(null);
  const [csvUnit, setCsvUnit] = useState<WeightUnit>(store.settings.unit);
  const csvImport = csvText === null ? null : importHistoryCsv(csvText, store, csvUnit, new Date().toISOString());

  const themes: { value: Theme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Jasny' },
    { value: 'dark', label: 'Ciemny' },
  ];

  const finishedCount = store.workouts.filter((w) => w.finishedAt).length;

  const setRest = (restSeconds: number) =>
    store.saveSettings({ ...store.settings, restSeconds: Math.min(REST_MAX, Math.max(REST_MIN, restSeconds)) });

  async function exportData(both = false) {
    const { exercises, plans, workouts, measurements, goals, settings } = store;
    const now = new Date();
    const data = { exercises, plans, workouts, measurements, goals, settings };
    const combined = both ? await serializeCombined(data, now.toISOString()) : null;
    const result = await saveFile(
      new Blob([combined ? combined.text : serializeBackup(data, now.toISOString())], { type: 'application/json' }),
      `${both ? 'trening-i-jadlospis' : 'trening'}-kopia-${now.toISOString().slice(0, 10)}.json`,
      both ? 'Kopia zapasowa obu aplikacji' : 'Kopia zapasowa treningów',
    );
    if (result === 'cancelled') return;
    // Remembered so the backup reminder knows the data is safe for a while.
    const { backupSnoozedUntil: _snooze, ...rest } = settings;
    store.saveSettings({ ...rest, lastBackupAt: now.toISOString() });
    const done = result === 'shared' ? 'Kopia zapasowa została zapisana.' : 'Kopia zapasowa została pobrana.';
    setMessage({
      kind: 'ok',
      text: combined && !combined.withNutrition ? `${done} Danych Jadłospisu nie widać z tej aplikacji (nie był otwierany na tym urządzeniu albo iPhone trzyma dane obu aplikacji z ekranu początkowego osobno), więc w pliku są tylko treningi.` : done,
    });
  }

  async function exportCsv() {
    const csv = historyCsv(store.workouts, store.exercises, store.settings.unit);
    const result = await saveFile(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `trening-historia-${new Date().toISOString().slice(0, 10)}.csv`,
      'Historia treningów',
    );
    if (result !== 'cancelled') setMessage({ kind: 'ok', text: 'Historia została zapisana jako plik CSV.' });
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (result.ok) {
      setMessage(null);
      setPendingCombined(!!result.combined?.withNutrition);
      setPending(result.data);
    } else {
      setMessage({ kind: 'error', text: result.error });
    }
  }

  async function importData(data: AppData) {
    try {
      await store.replaceAll(data);
      setMessage({
        kind: 'ok',
        text: pendingCombined
          ? 'Treningi zostały zaimportowane. Jadłospis z tego pliku wczytasz w aplikacji Jadłospis: Cele → Importuj.'
          : 'Dane zostały zaimportowane.',
      });
    } catch {
      setMessage({ kind: 'error', text: 'Nie udało się zapisać importowanych danych. Dotychczasowe dane są nienaruszone.' });
    }
  }

  return (
    <main className="screen">
      <Header back="/" />
      <h1 className="title">Ustawienia</h1>

      <section className="section">
        <h2 className="label">Motyw</h2>
        <div className="segmented" role="group" aria-label="Motyw">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={theme === t.value}
              onClick={() => {
                setTheme(t.value);
                setThemeState(t.value);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {theme === 'system' && (
          <p className="muted small" style={{ marginTop: 8 }}>
            Zgodnie z ustawieniem urządzenia, obecnie {systemDark ? 'ciemny' : 'jasny'}.
          </p>
        )}
      </section>

      <section className="section">
        <h2 className="label">Jednostki ciężaru</h2>
        <div className="segmented" role="group" aria-label="Jednostki ciężaru">
          {WEIGHT_UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              aria-pressed={store.settings.unit === unit}
              onClick={() => store.saveSettings({ ...store.settings, unit })}
            >
              {unit === 'kg' ? 'Kilogramy (kg)' : 'Funty (lb)'}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          Dotyczy ciężarów, objętości i wagi ciała. Zapisane wyniki przeliczają się same; obwody zostają w centymetrach.
        </p>
      </section>

      <section className="section">
        <h2 className="label">Przerwa między seriami</h2>
        <div className="item" style={{ minHeight: 0, padding: 0 }}>
          <span className="item-main muted small">Stoper startuje po odhaczeniu serii.</span>
          <div className="stepper" role="group" aria-label="Czas przerwy">
            <button
              type="button"
              className="icon-btn"
              aria-label="Krótsza przerwa"
              disabled={store.settings.restSeconds <= REST_MIN}
              onClick={() => setRest(store.settings.restSeconds - REST_STEP)}
            >
              <Icon name="minus" />
            </button>
            <output>{formatClock(store.settings.restSeconds)}</output>
            <button
              type="button"
              className="icon-btn"
              aria-label="Dłuższa przerwa"
              disabled={store.settings.restSeconds >= REST_MAX}
              onClick={() => setRest(store.settings.restSeconds + REST_STEP)}
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
        <label className="item" style={{ minHeight: 0, padding: '14px 0 0' }}>
          <span className="item-main muted small">Sygnał dźwiękowy po zakończeniu przerwy. Na Androidzie telefon dodatkowo zawibruje.</span>
          <input
            type="checkbox"
            className="switch"
            checked={store.settings.restSound}
            onChange={(e) => store.saveSettings({ ...store.settings, restSound: e.target.checked })}
          />
        </label>
      </section>

      <section className="section">
        <h2 className="label">Dane</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Wszystko jest zapisane tylko na tym urządzeniu. Na iPhonie „Eksportuj” otwiera udostępnianie: wybierz „Zachowaj w Plikach” i iCloud Drive, a kopia będzie bezpieczna nawet po utracie telefonu.
        </p>
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => void exportData()}>
            Eksportuj
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Importuj
          </button>
        </div>
        <button type="button" className="btn btn-block" style={{ marginTop: 8 }} onClick={() => void exportData(true)}>
          Eksportuj obie aplikacje (z Jadłospisem)
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          Jeden plik z treningami i jadłospisem z tego telefonu. Wczytany tutaj przywraca treningi, a wczytany w Jadłospisie — dziennik jedzenia.
        </p>
        <p className="muted small" style={{ margin: '16px 0 12px' }}>
          Historię treningów możesz też pobrać jako arkusz (CSV) do Excela lub Arkuszy Google. To tylko odczyt, nie
          zastępuje kopii zapasowej.
        </p>
        <button type="button" className="btn" disabled={finishedCount === 0} onClick={() => void exportCsv()}>
          Pobierz historię (CSV)
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void readFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {message && (
          <p className={message.kind === 'error' ? 'note error' : 'note'} role="status" style={{ marginTop: 12 }}>
            {message.text}
          </p>
        )}
      </section>

      <section className="section">
        <h2 className="label">Z innej aplikacji</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Przenieś historię ze Strong albo Hevy: w tamtej aplikacji wyeksportuj dane do pliku CSV i wybierz go tutaj. Treningi
          zostaną dodane do obecnych, a ćwiczenia dopasowane po nazwie.
        </p>
        <button type="button" className="btn" onClick={() => csvInput.current?.click()}>
          Importuj ze Strong lub Hevy
        </button>
        <input
          ref={csvInput}
          type="file"
          accept="text/csv,.csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void file.text().then(setCsvText);
          }}
        />
      </section>

      <Sheet open={csvText !== null} onClose={() => setCsvText(null)} title="Import historii">
        {csvImport && !csvImport.ok && (
          <div className="stack">
            <p className="note error">{csvImport.error}</p>
            <button type="button" className="btn btn-block" onClick={() => setCsvText(null)}>
              Zamknij
            </button>
          </div>
        )}
        {csvImport?.ok && (
          <div className="stack">
            <p>
              Plik z aplikacji <strong>{csvImport.value.source === 'strong' ? 'Strong' : 'Hevy'}</strong>:{' '}
              {plural(csvImport.value.workouts.length, 'trening', 'treningi', 'treningów')} do dodania
              {csvImport.value.newExercises.length > 0 &&
                `, w tym ${plural(csvImport.value.newExercises.length, 'nowe ćwiczenie', 'nowe ćwiczenia', 'nowych ćwiczeń')}`}
              .
            </p>
            {csvImport.value.skipped > 0 && (
              <p className="muted small">
                {plural(csvImport.value.skipped, 'trening jest', 'treningi są', 'treningów jest')} już w aplikacji i zostanie
                pominięte.
              </p>
            )}
            {csvImport.value.newExercises.length > 0 && (
              <p className="muted small">
                Nowe ćwiczenia trafią do Twoich jako „inne”: {csvImport.value.newExercises.map((e) => e.name).join(', ')}. Partię
                mięśni możesz potem zmienić w ich edycji.
              </p>
            )}
            {csvImport.value.source === 'strong' && (
              <div>
                <span className="label">Ciężary w pliku są w</span>
                <div className="segmented" role="group" aria-label="Jednostka w pliku" style={{ marginTop: 8 }}>
                  {WEIGHT_UNITS.map((u) => (
                    <button key={u} type="button" aria-pressed={csvUnit === u} onClick={() => setCsvUnit(u)}>
                      {u === 'kg' ? 'Kilogramach' : 'Funtach'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="row-actions">
              <button type="button" className="btn" onClick={() => setCsvText(null)}>
                Anuluj
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={csvImport.value.workouts.length === 0}
                onClick={() => {
                  store.addImported(csvImport.value.newExercises, csvImport.value.workouts);
                  setMessage({ kind: 'ok', text: `Dodano ${plural(csvImport.value.workouts.length, 'trening', 'treningi', 'treningów')}.` });
                  setCsvText(null);
                }}
              >
                Dodaj
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Confirm
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => pending && void importData(pending)}
        title="Zastąpić dane?"
        message={
          pending
            ? `Plik zawiera ${plural(pending.workouts.length, 'trening', 'treningi', 'treningów')} i ${plural(
                pending.plans.length,
                'plan',
                'plany',
                'planów',
              )}. Import zastąpi wszystkie dane zapisane teraz w aplikacji.`
            : ''
        }
        confirmLabel="Zastąp dane"
      />
    </main>
  );
}
