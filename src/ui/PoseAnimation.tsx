import { useState, type CSSProperties } from 'react';

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The image as a CSS value. The URL is made absolute first: a relative url() inside a custom property is
 * resolved by Safari against the stylesheet that uses it (in assets/), not against the page, so the
 * animation stayed blank on iPhone while working in Chrome.
 */
const cssImage = (src: string) => ({ '--pose-image': `url("${new URL(src, document.baseURI).href}")` }) as CSSProperties;

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
          <span className="pose-strip" style={cssImage(framesSrc)} />
        </div>
      ) : (
        <div className="pose-stage" role="img" aria-label={alt} style={cssImage(src)}>
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
