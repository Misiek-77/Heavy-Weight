import { guideFor } from '../domain/guides';

/** Built-in exercises (id without the `seed-` prefix) that have an illustration in public/exercises. */
const ILLUSTRATED = new Set(['bench-press', 'incline-bench-press', 'db-bench-press', 'incline-db-press', 'squat']);

/** Illustration, worked muscles, steps and common mistakes for a built-in exercise. Renders nothing for custom ones. */
export function ExerciseGuide({ exerciseId, name }: { exerciseId: string; name: string }) {
  const guide = guideFor(exerciseId);
  if (!guide) return null;
  const key = exerciseId.slice('seed-'.length);

  return (
    <div className="guide">
      {ILLUSTRATED.has(key) && (
        <img
          className="guide-image"
          src={`${import.meta.env.BASE_URL}exercises/${key}.jpg`}
          width={960}
          height={717}
          loading="lazy"
          alt={`${name}: pozycja początkowa i końcowa, pracujące mięśnie zaznaczone na zielono.`}
        />
      )}

      <h3 className="label">Pracujące mięśnie</h3>
      <ul className="tags">
        {guide.primary.map((m) => (
          <li key={m} className="tag primary">
            {m}
            <span className="visually-hidden"> (główny)</span>
          </li>
        ))}
        {guide.secondary.map((m) => (
          <li key={m} className="tag">
            {m}
            <span className="visually-hidden"> (pomocniczy)</span>
          </li>
        ))}
      </ul>

      <h3 className="label">Wykonanie</h3>
      <ol className="steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h3 className="label">Najczęstsze błędy</h3>
      <ul className="mistakes">
        {guide.mistakes.map((mistake) => (
          <li key={mistake}>{mistake}</li>
        ))}
      </ul>
    </div>
  );
}
