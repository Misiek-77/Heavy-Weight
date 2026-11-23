import { useRef, useState } from 'react';
import { parseBackup, serializeBackup } from '../data/backup';
import { COMBINED_APP } from '../shared/otherApp';
import { historyCsv } from '../data/csv';
import { importHistoryCsv } from '../data/importCsv';
import type { AppData } from '../domain/types';
import { useStore } from '../state/store';
import { parseBackup as parseDietBackup, serializeBackup as serializeDiet } from '../nutrition/data/backup';
import type { NutritionData } from '../nutrition/domain/types';
import { useNutrition } from '../nutrition/state/nutritionContext';
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
  const diet = useNutrition();
  const systemDark = useSystemDark();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  /** What a backup file being imported would restore: workouts, the diet diary, or both (a full backup). */
  const [pending, setPending] = useState<{ training?: AppData; diet?: NutritionData } | null>(null);
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
    const at = now.toISOString();
    const { products, entries, weights, water } = diet;
    const text = both
      ? JSON.stringify(
          {
            app: COMBINED_APP,
            version: 1,
            exportedAt: at,
            trening: JSON.parse(serializeBackup(data, at)),
            jadlospis: JSON.parse(serializeDiet({ products, entries, weights, water, settings: diet.settings }, at)),
          },
          null,
          2,
        )
      : serializeBackup(data, at);
    const result = await saveFile(
      new Blob([text], { type: 'application/json' }),
      `${both ? 'trening-i-dieta' : 'trening'}-kopia-${now.toISOString().slice(0, 10)}.json`,
      both ? 'Kopia zapasowa: treningi i dieta' : 'Kopia zapasowa treningów',
    );
    if (result === 'cancelled') return;
    // Remembered so the backup reminder knows the data is safe for a while.
    const { backupSnoozedUntil: _snooze, ...rest } = settings;
    store.saveSettings({ ...rest, lastBackupAt: at });
    if (both) diet.saveSettings({ ...diet.settings, lastBackupAt: at });
    const done = result === 'shared' ? 'Kopia zapasowa została zapisana.' : 'Kopia zapasowa została pobrana.';
    setMessage({
      kind: 'ok',
      text: done,
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
    const text = await file.text();
    const result = parseBackup(text);
    // A full backup restores the diet too; a diet-only backup (also from the old Jadłospis app) only the diet.
    const dietResult = !result.ok || result.combined?.withNutrition ? parseDietBackup(text) : null;
    const dietData = dietResult?.ok ? dietResult.data : undefined;
    if (result.ok || dietData) {
      // A full backup whose diet part cannot be read: the workouts are still offered, with a word about it.
      setMessage(
        result.ok && result.combined?.withNutrition && !dietData && dietResult && !dietResult.ok
          ? { kind: 'error', text: `Część z dietą jest uszkodzona i nie zostanie zaimportowana: ${dietResult.error}` }
          : null,
      );
      setPending({ ...(result.ok ? { training: result.data } : {}), ...(dietData ? { diet: dietData } : {}) });
    } else {
      setMessage({ kind: 'error', text: result.ok ? 'Nie udało się odczytać pliku.' : result.error });
    }
  }

  async function importData(data: { training?: AppData; diet?: NutritionData }) {
    // Each part is replaced in one step of its own, so a failure leaves that part as it was.
    let trainingDone = false;
    try {
      if (data.training) {
        await store.replaceAll(data.training);
        trainingDone = true;
      }
      if (data.diet) await diet.replaceAll(data.diet);
      setMessage({
        kind: 'ok',
        text: data.training && data.diet ? 'Treningi i dieta zostały zaimportowane.' : data.diet ? 'Dieta została zaimportowana.' : 'Dane zostały zaimportowane.',
      });
    } catch {
      setMessage({
        kind: 'error',
        text: trainingDone
          ? 'Treningi zostały zaimportowane, ale diety nie udało się zapisać. Dotychczasowa dieta jest nienaruszona.'
          : 'Nie udało się zapisać importowanych danych. Dotychczasowe dane są nienaruszone.',
      });
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
          Eksportuj wszystko (treningi i dieta)
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          Jeden plik z treningami i dietą. „Importuj” przywraca z niego wszystko. Wczytuje też kopię ze starej aplikacji Jadłospis.
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
            ? [
                pending.training &&
                  `${plural(pending.training.workouts.length, 'trening', 'treningi', 'treningów')} i ${plural(pending.training.plans.length, 'plan', 'plany', 'planów')}`,
                pending.diet &&
                  `${plural(pending.diet.entries.length, 'wpis', 'wpisy', 'wpisów')} diety i ${plural(pending.diet.products.length, 'produkt', 'produkty', 'produktów')}`,
              ]
                .filter(Boolean)
                .join(', ')
                .replace(/^/, 'Plik zawiera ') +
              `. Import zastąpi ${pending.training && pending.diet ? 'wszystkie treningi i całą dietę' : pending.diet ? 'całą dietę' : 'wszystkie treningi'} zapisane teraz w aplikacji.`
            : ''
        }
        confirmLabel="Zastąp dane"
      />
    </main>
  );
}
