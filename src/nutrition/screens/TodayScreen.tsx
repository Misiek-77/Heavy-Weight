import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DietTabs } from './DietTabs';
import { dateOfKey, dayKey, shiftDay } from '../../shared/date';
import { capitalize, formatGrams, formatLongDay, formatWhole, plural } from '../../shared/format';
import { Icon } from '../../shared/Icon';
import { Sheet } from '../../shared/Sheet';
import { useToday } from '../../shared/useToday';
import { newId } from '../../shared/id';
import { copyDay, copyEntries, pastDays, pastMeals } from '../domain/diary';
import { dayTotals, entryNutrients, goalsForDay } from '../domain/nutrients';
import { MEALS, type DiaryEntry, type Meal } from '../domain/types';
import { useNutrition } from '../state/nutritionContext';
import { useTrainingLink } from '../state/training';
import { AmountForm, EmptyArt, KcalRing, MacroBars, MEAL_LABEL } from './parts';

/** The diary of one day: energy and macros against the goals, and what was eaten at each meal. */
export function TodayScreen() {
  const store = useNutrition();
  const today = dayKey(useToday());
  const [params, setParams] = useSearchParams();
  const date = params.get('dzien') ?? today;
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [copyTo, setCopyTo] = useState<Meal | null>(null);
  const totals = dayTotals(store.entries, date);
  const { workoutDays } = useTrainingLink();
  const bonus = store.settings.trainingBonusKcal;
  const trainingDay = workoutDays.has(date);
  const goals = goalsForDay(store.settings.goals, bonus, trainingDay);
  const water = store.water.find((w) => w.date === date)?.ml ?? 0;
  const waterGoal = store.settings.waterGoalMl;
  const past = copyTo ? pastMeals(store.entries, date, copyTo) : [];
  const [copyingDay, setCopyingDay] = useState(false);
  const days = copyingDay ? pastDays(store.entries, date) : [];
  const { fiber, sugar, salt } = totals.day;
  /** The daily salt limit the WHO recommends, in grams. */
  const SALT_LIMIT = 5;
  const dayName = (key: string) => (key === shiftDay(today, -1) ? 'Wczoraj' : capitalize(formatLongDay(dateOfKey(key))));
  const go = (key: string) => setParams(key === today ? {} : { dzien: key }, { replace: true });

  return (
    <main className="screen">
      <DietTabs />
      <div className="day-nav">
        <button type="button" className="icon-btn" aria-label="Poprzedni dzień" onClick={() => go(shiftDay(date, -1))}>
          <Icon name="back" />
        </button>
        <div className="day-title">
          <h1 className="title">{date === today ? 'Dziś' : date === shiftDay(today, -1) ? 'Wczoraj' : capitalize(formatLongDay(dateOfKey(date)).split(',')[0])}</h1>
          <span className="muted small">{formatLongDay(dateOfKey(date))}</span>
        </div>
        <button type="button" className="icon-btn" aria-label="Następny dzień" disabled={date >= today} onClick={() => go(shiftDay(date, 1))}>
          <Icon name="forward" />
        </button>
      </div>

      {trainingDay && (
        <p className="training-day" role="note">
          <Icon name="bolt" />
          {bonus > 0 ? `Dzień treningowy: cel wyższy o ${formatWhole(bonus)} kcal (z węglowodanów).` : 'Dzień treningowy. Dodatek kalorii ustawisz w Celach.'}
        </p>
      )}
      <section className="section day-summary">
        <KcalRing eaten={totals.day.kcal} goal={goals.kcal} />
        <div className="day-summary-side">
          <p>
            <strong>{formatWhole(totals.day.kcal)}</strong> <span className="muted">/ {formatWhole(goals.kcal)} kcal</span>
          </p>
          <MacroBars totals={totals.day} goals={goals} />
          <p className="micro-line">
            Błonnik {fiber === undefined ? '—' : `${formatGrams(fiber)} g`} · Cukry {sugar === undefined ? '—' : `${formatGrams(sugar)} g`} ·{' '}
            <span className={salt !== undefined && salt > SALT_LIMIT ? 'over' : undefined}>Sól {salt === undefined ? '—' : `${formatGrams(salt)} g`}</span>
          </p>
        </div>
      </section>
      {salt !== undefined && salt > SALT_LIMIT && (
        <p className="note error" role="status">
          Soli jest już {formatGrams(salt)} g, a WHO zaleca najwyżej {SALT_LIMIT} g dziennie. Dużo soli mają wędliny, sery żółte, pieczywo i dania gotowe.
        </p>
      )}

      <section className="section water" aria-label="Woda">
        <Icon name="water" />
        <div className="water-main">
          <p>
            <strong>{formatWhole(water)}</strong> <span className="muted">/ {formatWhole(waterGoal)} ml wody</span>
          </p>
          <span className="bar-track" aria-hidden="true">
            <span className="bar-fill water-fill" style={{ width: `${Math.min(100, (water / Math.max(1, waterGoal)) * 100)}%` }} />
          </span>
        </div>
        <button type="button" className="icon-btn" aria-label="Odejmij szklankę wody (250 ml)" disabled={water <= 0} onClick={() => store.setWater({ date, ml: Math.max(0, water - 250) })}>
          <Icon name="minus" />
        </button>
        <button type="button" className="btn btn-small" aria-label="Dodaj szklankę wody (250 ml)" onClick={() => store.setWater({ date, ml: water + 250 })}>
          <Icon name="plus" />
          250 ml
        </button>
      </section>

      {!store.entries.some((e) => e.date === date) && (
        <EmptyArt image="meal" title={date === today ? 'Nic jeszcze nie zapisano' : 'Pusty dzień'}>
          Dodaj produkt do posiłku albo skopiuj posiłek z innego dnia przyciskiem „Kopiuj”.
        </EmptyArt>
      )}

      {MEALS.map((meal) => {
        const entries = store.entries.filter((e) => e.date === date && e.meal === meal).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return (
          <section className="section meal" key={meal}>
            <div className="meal-head">
              <h2 className="label">{MEAL_LABEL[meal]}</h2>
              <span className="muted small">{formatWhole(totals.meals[meal].kcal)} kcal</span>
            </div>
            {entries.length > 0 && (
              <ul className="list">
                {entries.map((e) => {
                  const n = entryNutrients(e);
                  return (
                    <li key={e.id}>
                      <button type="button" className="item" onClick={() => setEditing(e)}>
                        <span className="item-main">
                          <span className="item-title">{e.name}</span>
                          <span className="item-sub">
                            {formatGrams(e.grams)} g · B {formatGrams(n.protein)} · T {formatGrams(n.fat)} · W {formatGrams(n.carbs)}
                          </span>
                        </span>
                        <span className="item-end">{formatWhole(n.kcal)} kcal</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="meal-actions">
              <Link className="btn btn-small btn-quiet add-food" to={`/dieta/dodaj?posilek=${meal}&dzien=${date}`}>
                <Icon name="plus" />
                Dodaj
              </Link>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setCopyTo(meal)}>
                <Icon name="copy" />
                Kopiuj
              </button>
            </div>
          </section>
        );
      })}

      <button type="button" className="btn btn-block btn-quiet" style={{ marginTop: 12 }} onClick={() => setCopyingDay(true)}>
        <Icon name="copy" />
        Kopiuj cały dzień z…
      </button>

      <Sheet open={copyingDay} onClose={() => setCopyingDay(false)} title="Kopiuj cały dzień">
        {days.length === 0 ? (
          <p className="empty">W ostatnich dwóch tygodniach nie ma dni do skopiowania.</p>
        ) : (
          <ul className="list">
            {days.map((d) => (
              <li key={d.date}>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    store.saveEntries(copyDay(d.entries, date, new Date().toISOString(), newId));
                    setCopyingDay(false);
                  }}
                >
                  <span className="item-main">
                    <span className="item-title">{dayName(d.date)}</span>
                    <span className="item-sub">
                      {plural(d.entries.length, 'pozycja', 'pozycje', 'pozycji')} · B {formatGrams(d.totals.protein)} g
                    </span>
                  </span>
                  <span className="item-end">{formatWhole(d.totals.kcal)} kcal</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small" style={{ marginTop: 8 }}>
          Wszystko z wybranego dnia zostanie dodane do {date === today ? 'dzisiejszego' : 'tego'} dnia, w tych samych posiłkach.
        </p>
      </Sheet>

      <Sheet open={copyTo !== null} onClose={() => setCopyTo(null)} title={copyTo ? `Kopiuj do: ${MEAL_LABEL[copyTo].toLowerCase()}` : ''}>
        {past.length === 0 ? (
          <p className="empty">W ostatnich dwóch tygodniach nie ma posiłków do skopiowania.</p>
        ) : (
          <ul className="list">
            {past.map((p) => (
              <li key={`${p.date}-${p.meal}`}>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    if (copyTo) store.saveEntries(copyEntries(p.entries, date, copyTo, new Date().toISOString(), newId));
                    setCopyTo(null);
                  }}
                >
                  <span className="item-main">
                    <span className="item-title">
                      {dayName(p.date)} · {MEAL_LABEL[p.meal]}
                    </span>
                    <span className="item-sub">{p.entries.map((e) => e.name).join(', ')}</span>
                  </span>
                  <span className="item-end">{formatWhole(p.totals.kcal)} kcal</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing?.name ?? ''}>
        {editing && (
          <AmountForm
            product={{ name: editing.name, per100: editing.per100, portions: store.products.find((p) => p.id === editing.productId)?.portions ?? [] }}
            initialGrams={editing.grams}
            submitLabel="Zapisz"
            onSubmit={(grams) => {
              store.saveEntry({ ...editing, grams });
              setEditing(null);
            }}
            onRemove={() => {
              store.removeEntry(editing.id);
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </main>
  );
}
