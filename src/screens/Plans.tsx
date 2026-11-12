import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { newId } from '../domain/id';
import { PLAN_TEMPLATES, plansFromTemplate } from '../domain/templates';
import type { Plan, PlanItem } from '../domain/types';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { ExerciseThumb } from '../ui/ExerciseThumb';
import { ExercisePicker } from '../ui/ExerciseBrowser';
import { plural } from '../ui/format';
import { Icon } from '../ui/Icon';
import { NumberField } from '../ui/NumberField';
import { Confirm } from '../ui/Sheet';
import { PlanWizard, WeekSchedule } from './PlanTools';

export function PlansScreen() {
  const { plans, savePlan } = useStore();
  const [wizard, setWizard] = useState(false);
  return (
    <main className="screen">
      <Header>
        <Link className="icon-btn" to="/plany/nowy" aria-label="Nowy plan">
          <Icon name="plus" />
        </Link>
      </Header>
      <h1 className="title">Plany</h1>
      <p className="subtitle">Szablony, z których zaczynasz trening jednym dotknięciem.</p>

      <div className="section">
        {plans.length === 0 ? (
          <p className="empty">Nie masz jeszcze żadnego planu.</p>
        ) : (
          <ul className="list">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link className="item" to={`/plany/${plan.id}`}>
                  <span className="item-main">
                    <span className="item-title">{plan.name}</span>
                    <span className="item-sub" style={{ display: 'block' }}>
                      {plural(plan.items.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')} ·{' '}
                      {plural(
                        plan.items.reduce((n, i) => n + i.targetSets, 0),
                        'seria',
                        'serie',
                        'serii',
                      )}
                    </span>
                  </span>
                  <span className="item-end">
                    <Icon name="forward" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link className="btn btn-block" to="/plany/nowy" style={{ marginTop: 20 }}>
          <Icon name="plus" />
          Nowy plan
        </Link>
        <button type="button" className="btn btn-block" style={{ marginTop: 10 }} onClick={() => setWizard(true)}>
          Kreator planu
        </button>
      </div>

      <WeekSchedule />
      <PlanWizard open={wizard} onClose={() => setWizard(false)} />

      <section className="section">
        <h2 className="label">Gotowe plany</h2>
        <ul className="list">
          {PLAN_TEMPLATES.map((template) => {
            const missing = plansFromTemplate(template, plans, new Date().toISOString());
            return (
              <li key={template.id}>
                <div className="item">
                  <span className="item-main">
                    <span className="item-title">{template.name}</span>
                    <span className="item-sub" style={{ display: 'block' }}>
                      {template.description}
                    </span>
                    <span className="item-sub" style={{ display: 'block' }}>
                      {template.plans.map((p) => p.name).join(' · ')}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-small"
                    disabled={missing.length === 0}
                    aria-label={`Dodaj plany: ${template.name}`}
                    onClick={() => missing.forEach(savePlan)}
                  >
                    {missing.length === 0 ? 'Dodane' : 'Dodaj'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

const MAX_SETS = 10;

export function PlanEditor() {
  const { id } = useParams();
  const { plans } = useStore();
  const existing = plans.find((p) => p.id === id);
  if (id !== 'nowy' && !existing) return <Navigate to="/plany" replace />;
  // Keyed so that opening another plan starts from a fresh draft.
  return <PlanForm key={id} existing={existing} />;
}

function PlanForm({ existing }: { existing?: Plan }) {
  const store = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(existing?.name ?? '');
  const [items, setItems] = useState<PlanItem[]>(existing?.items ?? []);
  const [dialog, setDialog] = useState<'picker' | 'delete' | null>(null);

  const patch = (index: number, change: Partial<PlanItem>) =>
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...change } : item)));
  const move = (index: number, by: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  function save() {
    const now = new Date().toISOString();
    // Tidy what was typed: a range the right way round, no empty targets, no superset hanging off the last exercise.
    const clean = items.map(({ repMin, repMax, linkNext, ...item }, i) => {
      const [low, high] = [repMin, repMax].filter((n): n is number => !!n && n > 0).sort((a, b) => a - b);
      return {
        ...item,
        ...(low ? { repMin: low, repMax: high ?? low } : {}),
        ...(linkNext && i < items.length - 1 ? { linkNext: true } : {}),
      };
    });
    store.savePlan({ id: existing?.id ?? newId(), name: name.trim(), items: clean, createdAt: existing?.createdAt ?? now, updatedAt: now });
    navigate('/plany');
  }

  return (
    <main className="screen">
      <Header back="/plany">
        {existing && (
          <button type="button" className="icon-btn" aria-label="Usuń plan" onClick={() => setDialog('delete')}>
            <Icon name="trash" />
          </button>
        )}
      </Header>
      <h1 className="title">{existing ? 'Edytuj plan' : 'Nowy plan'}</h1>

      <div className="section">
        <label className="field">
          <span>Nazwa planu</span>
          <input
            className="input"
            value={name}
            placeholder="np. Góra A"
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </div>

      <section className="section">
        <h2 className="label">Ćwiczenia</h2>
        {items.length === 0 ? (
          <p className="empty">Plan jest pusty. Dodaj pierwsze ćwiczenie.</p>
        ) : (
          <ul className="list">
            {items.map((item, index) => {
              const exercise = store.exerciseName(item.exerciseId);
              return (
                <li key={index}>
                  <div className="item" style={{ flexWrap: 'wrap', rowGap: 4 }}>
                    <span className="item-main thumb-link" style={{ flexBasis: '100%' }}>
                      <ExerciseThumb exerciseId={item.exerciseId} />
                      <span className="item-title">{exercise}</span>
                    </span>
                    <div className="stepper" role="group" aria-label={`${exercise}: liczba serii`}>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Mniej serii"
                        disabled={item.targetSets <= 1}
                        onClick={() => patch(index, { targetSets: item.targetSets - 1 })}
                      >
                        <Icon name="minus" />
                      </button>
                      <output>{item.targetSets}</output>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Więcej serii"
                        disabled={item.targetSets >= MAX_SETS}
                        onClick={() => patch(index, { targetSets: item.targetSets + 1 })}
                      >
                        <Icon name="plus" />
                      </button>
                      <span className="muted small" style={{ marginLeft: 6 }}>
                        serie
                      </span>
                    </div>
                    <div className="range" role="group" aria-label={`${exercise}: zakres ${store.timedIds.has(item.exerciseId) ? 'sekund' : 'powtórzeń'}`}>
                      <NumberField integer label="Od" value={item.repMin ?? 0} onChange={(repMin) => patch(index, { repMin: repMin || undefined })} />
                      <span aria-hidden="true">–</span>
                      <NumberField integer label="Do" value={item.repMax ?? 0} onChange={(repMax) => patch(index, { repMax: repMax || undefined })} />
                      <span className="muted small">{store.timedIds.has(item.exerciseId) ? 's' : 'powt.'}</span>
                    </div>
                    <span className="spacer" style={{ flex: 1 }} />
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`${exercise}: przesuń wyżej`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <Icon name="up" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`${exercise}: przesuń niżej`}
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <Icon name="down" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`${exercise}: usuń z planu`}
                      onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                  {index < items.length - 1 && (
                    <button
                      type="button"
                      className="link-btn"
                      style={{ marginBottom: 10 }}
                      aria-pressed={!!item.linkNext}
                      onClick={() => patch(index, { linkNext: !item.linkNext })}
                    >
                      {item.linkNext ? 'Superset z następnym · rozłącz' : 'Połącz w superset z następnym'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="section stack">
        <button type="button" className="btn btn-block" onClick={() => setDialog('picker')}>
          <Icon name="plus" />
          Dodaj ćwiczenie
        </button>
        <button type="button" className="btn btn-primary btn-block" disabled={name.trim() === '' || items.length === 0} onClick={save}>
          Zapisz plan
        </button>
      </div>

      <ExercisePicker
        open={dialog === 'picker'}
        onClose={() => setDialog(null)}
        onPick={(exerciseId) => setItems((list) => [...list, { exerciseId, targetSets: 3 }])}
      />
      <Confirm
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          if (existing) store.removePlan(existing.id);
          navigate('/plany');
        }}
        title="Usunąć plan?"
        message="Plan zniknie z listy. Treningi wykonane według tego planu zostaną w historii."
        confirmLabel="Usuń plan"
      />
    </main>
  );
}
