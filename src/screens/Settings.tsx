import { useRef, useState } from 'react';
import { parseBackup, serializeBackup } from '../data/backup';
import type { AppData } from '../domain/types';
import { useStore } from '../state/store';
import { getTheme, setTheme, useSystemDark, type Theme } from '../state/theme';
import { Header } from '../ui/Chrome';
import { formatClock, plural } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Confirm } from '../ui/Sheet';

const REST_STEP = 15;
const REST_MIN = 15;
const REST_MAX = 600;

type Message = { kind: 'ok' | 'error'; text: string } | null;

export function SettingsScreen() {
  const store = useStore();
  const systemDark = useSystemDark();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [pending, setPending] = useState<AppData | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const themes: { value: Theme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Jasny' },
    { value: 'dark', label: 'Ciemny' },
  ];

  const setRest = (restSeconds: number) =>
    store.saveSettings({ ...store.settings, restSeconds: Math.min(REST_MAX, Math.max(REST_MIN, restSeconds)) });

  function exportData() {
    const { exercises, plans, workouts, settings } = store;
    const now = new Date();
    const blob = new Blob([serializeBackup({ exercises, plans, workouts, settings }, now.toISOString())], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trening-kopia-${now.toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setMessage({ kind: 'ok', text: 'Kopia zapasowa została pobrana.' });
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (result.ok) {
      setMessage(null);
      setPending(result.data);
    } else {
      setMessage({ kind: 'error', text: result.error });
    }
  }

  async function importData(data: AppData) {
    try {
      await store.replaceAll(data);
      setMessage({ kind: 'ok', text: 'Dane zostały zaimportowane.' });
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
          <span className="item-main muted small">Sygnał dźwiękowy po zakończeniu przerwy. Telefon dodatkowo zawibruje.</span>
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
          Wszystko jest zapisane tylko na tym urządzeniu. Kopia zapasowa pozwala przenieść dane albo je odzyskać.
        </p>
        <div className="row-actions">
          <button type="button" className="btn" onClick={exportData}>
            Eksportuj
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Importuj
          </button>
        </div>
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
