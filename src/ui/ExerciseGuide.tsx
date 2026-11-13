import { guideFor } from '../domain/guides';
import { ANIMATED, ILLUSTRATED } from './illustrated';
import { MuscleMap } from './MuscleMap';
import { PoseAnimation } from './PoseAnimation';

/** Illustration (where one exists), muscle map, worked muscles, steps and common mistakes for a built-in exercise. Renders nothing for custom ones. */
export function ExerciseGuide({ exerciseId, name }: { exerciseId: string; name: string }) {
  const guide = guideFor(exerciseId);
  if (!guide) return null;
  const key = exerciseId.slice('seed-'.length);

  return (
    <div className="guide">
      {ILLUSTRATED.has(key) && (
        <PoseAnimation
          src={`${import.meta.env.BASE_URL}exercises/${key}.jpg`}
          framesSrc={ANIMATED.has(key) ? `${import.meta.env.BASE_URL}exercises/frames/${key}.jpg` : undefined}
          alt={`${name}: pozycja początkowa i końcowa, pracujące mięśnie zaznaczone na zielono.`}
        />
      )}

      <h3 className="label">Pracujące mięśnie</h3>
      <MuscleMap guide={guide} />
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
