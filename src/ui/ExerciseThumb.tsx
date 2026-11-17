import { ILLUSTRATED } from './illustrated';

/**
 * Small illustration shown next to an exercise name. Decorative: the name beside it already says what it is.
 * Exercises without an illustration (custom ones) get an empty tile so rows stay aligned.
 */
export function ExerciseThumb({ exerciseId, large }: { exerciseId: string; large?: boolean }) {
  const key = exerciseId.startsWith('seed-') ? exerciseId.slice('seed-'.length) : '';
  const className = large ? 'thumb thumb-large' : 'thumb';
  if (!ILLUSTRATED.has(key)) return <span className={className} aria-hidden="true" />;
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}exercises/thumbs/${key}.jpg`}
      width={320}
      height={239}
      loading="lazy"
      decoding="async"
      alt=""
    />
  );
}
