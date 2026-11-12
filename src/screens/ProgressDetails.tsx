import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { newId } from '../domain/id';
import { allRecords, compareMonths, recordEvents } from '../domain/insights';
import { dayKey } from '../domain/summary';
import { MUSCLE_GROUPS, type Photo } from '../domain/types';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { ExerciseThumb } from '../ui/ExerciseThumb';
import { formatDay, formatWeight, formatWhole } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Confirm } from '../ui/Sheet';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Best results of every exercise, and the list of times a best was beaten. */
export function RecordsScreen() {
  const store = useStore();
  const records = useMemo(() => allRecords(store.workouts, store.exercises), [store.workouts, store.exercises]);
  const events = useMemo(() => recordEvents(store.workouts, store.timedIds), [store.workouts, store.timedIds]);

  return (
    <main className="screen">
      <Header back="/postepy" />
      <h1 className="title">Rekordy</h1>
      <p className="subtitle">Najlepsze wyniki z każdego ćwiczenia. Serie rozgrzewkowe się nie liczą.</p>

      {records.length === 0 ? (
        <p className="empty">Zakończ pierwszy trening, żeby zobaczyć rekordy.</p>
      ) : (
        <>
          <section className="section">
            <h2 className="label">Ostatnio pobite</h2>
            {events.length === 0 ? (
              <p className="empty">Jeszcze żaden wynik nie został poprawiony. Pierwszy trening ćwiczenia to punkt wyjścia.</p>
            ) : (
              <ul className="list">
                {events.slice(0, 20).map((e, i) => {
                  const unit = store.timedIds.has(e.exerciseId) ? 's' : 'kg';
                  return (
                    <li key={i}>
                      <Link className="item" to={`/historia/${e.workoutId}`}>
                        <span className="item-main">
                          <span className="item-title">{store.exerciseName(e.exerciseId)}</span>
                          <span className="item-sub" style={{ display: 'block' }}>
                            {formatDay(e.date)} · {formatWeight(e.previous)} → {formatWeight(e.value)} {unit}
                          </span>
                        </span>
                        <span className="delta up">
                          +{formatWeight(Math.round((e.value - e.previous) * 100) / 100)} {unit}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="section">
            <h2 className="label">Wszystkie ćwiczenia</h2>
            <ul className="list">
              {records.map(({ exercise, records: r, date }) => (
                <li key={exercise.id}>
                  <Link className="item" to={`/cwiczenia/${exercise.id}`}>
                    <ExerciseThumb exerciseId={exercise.id} />
                    <span className="item-main">
                      <span className="item-title">{exercise.name}</span>
                      <span className="item-sub" style={{ display: 'block' }}>
                        {exercise.timed
                          ? `${r.longest!.reps} s`
                          : `${formatWeight(r.maxWeight!.weight)} kg × ${r.maxWeight!.reps} · 1RM ${formatWeight(Math.round(r.best1RM!.value * 10) / 10)} kg`}
                        {' · '}
                        {formatDay(date)}
                      </span>
                    </span>
                    <span className="item-end">
                      <Icon name="forward" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

const monthName = new Intl.DateTimeFormat('pl-PL', { month: 'long' });

/** This month so far against the whole previous month. */
export function CompareScreen() {
  const store = useStore();
  const now = useMemo(() => new Date(), []);
  const { current, previous } = useMemo(() => compareMonths(store.workouts, store.exercises, now), [store.workouts, store.exercises, now]);
  const thisMonth = capitalize(monthName.format(now));
  const lastMonth = capitalize(monthName.format(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
  const groups = MUSCLE_GROUPS.filter((g) => g !== 'inne' || current.setsByGroup[g] + previous.setsByGroup[g] > 0);

  return (
    <main className="screen">
      <Header back="/postepy" />
      <h1 className="title">Porównanie miesięcy</h1>
      <p className="subtitle">
        {thisMonth} do dziś obok całego miesiąca {lastMonth.toLowerCase()}.
      </p>

      <section className="section">
        <table className="compare">
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Miara</span>
              </th>
              <th scope="col">{lastMonth}</th>
              <th scope="col">{thisMonth}</th>
              <th scope="col">Zmiana</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Treningi" before={previous.workouts} after={current.workouts} />
            <CompareRow label="Objętość (kg)" before={previous.volume} after={current.volume} />
            <CompareRow label="Serie" before={previous.sets} after={current.sets} />
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2 className="label">Serie na partię mięśni</h2>
        <table className="compare">
          <thead className="visually-hidden">
            <tr>
              <th scope="col">Partia</th>
              <th scope="col">{lastMonth}</th>
              <th scope="col">{thisMonth}</th>
              <th scope="col">Zmiana</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <CompareRow key={g} label={capitalize(g)} before={previous.setsByGroup[g]} after={current.setsByGroup[g]} />
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function CompareRow({ label, before, after }: { label: string; before: number; after: number }) {
  const change = after - before;
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{formatWhole(before)}</td>
      <td>{formatWhole(after)}</td>
      <td className={change > 0 ? 'delta up' : change < 0 ? 'delta down' : 'delta'}>
        {change === 0 ? '—' : `${change > 0 ? '+' : '−'}${formatWhole(Math.abs(change))}`}
      </td>
    </tr>
  );
}

const MAX_SIDE = 1280;

/** Shrinks a camera photo so a few years of weekly pictures still fit comfortably on the device. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', 0.85),
  );
}

/** Physique photos by date, with any two shown side by side. */
export function PhotosScreen() {
  const { photos: storage } = useStore();
  const today = useMemo(() => dayKey(new Date()), []);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [date, setDate] = useState(today);
  const [picked, setPicked] = useState<string[]>([]);
  const [removing, setRemoving] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    storage.list().then(
      (list) => setPhotos(list.sort((a, b) => b.date.localeCompare(a.date))),
      () => setError('Nie udało się wczytać zdjęć.'),
    );
  useEffect(() => {
    void reload();
    // Loaded once; later changes go through `reload` after each save or delete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One object URL per photo for as long as the list is on screen.
  const urls = useMemo(() => new Map((photos ?? []).map((p) => [p.id, URL.createObjectURL(p.image)])), [photos]);
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);

  async function add(file: File | undefined) {
    if (!file || !date) return;
    setError(null);
    try {
      await storage.save({ id: newId(), date, image: await shrink(file) });
      await reload();
    } catch {
      setError('Nie udało się zapisać zdjęcia. Spróbuj z innym plikiem.');
    }
  }

  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current.slice(-1), id]));
  const compared = picked
    .map((id) => photos?.find((p) => p.id === id))
    .filter((p): p is Photo => !!p)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="screen">
      <Header back="/postepy" />
      <h1 className="title">Zdjęcia sylwetki</h1>
      <p className="subtitle">Zostają tylko na tym urządzeniu i nie trafiają do kopii zapasowej.</p>

      <section className="section stack">
        <label className="field">
          <span>Data zdjęcia</span>
          <input className="input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="btn btn-block">
          <Icon name="plus" />
          Dodaj zdjęcie
          <input
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={(e) => {
              void add(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {error && (
          <p className="muted small" role="alert">
            {error}
          </p>
        )}
      </section>

      {compared.length === 2 && (
        <section className="section">
          <h2 className="label">Porównanie</h2>
          <div className="photo-compare">
            {compared.map((p) => (
              <figure key={p.id}>
                <img src={urls.get(p.id)} alt={`Zdjęcie sylwetki z dnia ${formatDay(p.date)}`} />
                <figcaption>{formatDay(p.date)}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="label">Wszystkie zdjęcia</h2>
        {photos === null ? null : photos.length === 0 ? (
          <p className="empty">Nie masz jeszcze zdjęć. Rób je w tym samym miejscu i świetle, wtedy łatwiej je porównać.</p>
        ) : (
          <>
            <p className="muted small" style={{ marginTop: 8 }}>
              Dotknij dwóch zdjęć, żeby zobaczyć je obok siebie.
            </p>
            <ul className="photo-grid">
              {photos.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="photo"
                    aria-pressed={picked.includes(p.id)}
                    aria-label={`Zdjęcie z dnia ${formatDay(p.date)}: wybierz do porównania`}
                    onClick={() => toggle(p.id)}
                  >
                    <img src={urls.get(p.id)} alt="" loading="lazy" />
                  </button>
                  <div className="photo-caption">
                    <span>{formatDay(p.date)}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Usuń zdjęcie z dnia ${formatDay(p.date)}`}
                      onClick={() => setRemoving(p)}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Confirm
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          setPicked((current) => current.filter((id) => id !== removing.id));
          void storage.remove(removing.id).then(reload);
        }}
        title="Usunąć zdjęcie?"
        message="Zdjęcie zostanie trwale usunięte z urządzenia. Tej operacji nie można cofnąć."
        confirmLabel="Usuń zdjęcie"
      />
    </main>
  );
}
