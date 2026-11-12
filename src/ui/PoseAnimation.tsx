import { useState, type CSSProperties } from 'react';

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Exercise illustration. Each image holds the start pose on the left and the end pose on the right;
 * "movement" mode shows one pose at a time and cross-fades between them, so the exercise reads as motion.
 */
export function PoseAnimation({ src, alt }: { src: string; alt: string }) {
  const [moving, setMoving] = useState(() => !prefersReducedMotion());

  return (
    <figure className="pose">
      {moving ? (
        <div className="pose-stage" role="img" aria-label={alt} style={{ '--pose-image': `url("${src}")` } as CSSProperties}>
          <span className="pose-frame pose-start" />
          <span className="pose-frame pose-end" />
        </div>
      ) : (
        <img className="guide-image" src={src} width={960} height={717} loading="lazy" alt={alt} />
      )}
      <button type="button" className="btn btn-small btn-quiet" aria-pressed={moving} onClick={() => setMoving(!moving)}>
        {moving ? 'Pokaż obie pozycje' : 'Pokaż ruch'}
      </button>
    </figure>
  );
}
