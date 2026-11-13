import { useState, type CSSProperties } from 'react';

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface PoseAnimationProps {
  /** Start and end pose side by side. */
  src: string;
  /** Four consecutive frames of the movement in one row, when the exercise has them. */
  framesSrc?: string;
  alt: string;
}

/**
 * Exercise illustration that can play the movement. With a frame strip it steps through the four frames
 * there and back; without one it cross-fades between the two halves of the two-pose image.
 */
export function PoseAnimation({ src, framesSrc, alt }: PoseAnimationProps) {
  const [moving, setMoving] = useState(() => !prefersReducedMotion());

  return (
    <figure className="pose">
      {!moving ? (
        <img className="guide-image" src={src} width={960} height={717} loading="lazy" alt={alt} />
      ) : framesSrc ? (
        <div className="pose-stage" role="img" aria-label={alt}>
          <span className="pose-strip" style={{ '--pose-image': `url("${framesSrc}")` } as CSSProperties} />
        </div>
      ) : (
        <div className="pose-stage" role="img" aria-label={alt} style={{ '--pose-image': `url("${src}")` } as CSSProperties}>
          <span className="pose-frame pose-start" />
          <span className="pose-frame pose-end" />
        </div>
      )}
      <button type="button" className="btn btn-small btn-quiet" aria-pressed={moving} onClick={() => setMoving(!moving)}>
        {moving ? 'Pokaż obie pozycje' : 'Pokaż ruch'}
      </button>
    </figure>
  );
}
