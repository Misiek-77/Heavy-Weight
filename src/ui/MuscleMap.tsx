import type { ReactNode } from 'react';
import type { ExerciseGuide } from '../domain/guides';
import { involvement, type Involvement, type Region } from '../domain/muscles';

type Levels = Partial<Record<Region, Involvement>>;

/** Draws the left half of a figure and mirrors it, so both sides always match. */
function Mirrored({ children }: { children: ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform="translate(100 0) scale(-1 1)">{children}</g>
    </>
  );
}

/** Neutral body shape shared by the front and back views (left half; the torso spans both). */
function Body() {
  return (
    <g className="mm-body">
      <ellipse cx="50" cy="14" rx="8" ry="10" />
      <rect x="45.5" y="22" width="9" height="9" />
      <path d="M26 33 Q50 28 74 33 L70 60 Q66 76 66 90 L67 108 L33 108 L34 90 Q34 76 30 60 Z" />
      <Mirrored>
        <line x1="25.5" y1="38" x2="21.5" y2="64" strokeWidth="11" />
        <line x1="21.5" y1="66" x2="17.5" y2="95" strokeWidth="8.5" />
        <circle cx="16.5" cy="101.5" r="4.2" />
        <line x1="42" y1="110" x2="41.5" y2="150" strokeWidth="15.5" />
        <line x1="41.5" y1="154" x2="40.5" y2="197" strokeWidth="10.5" />
        <ellipse cx="39.5" cy="205" rx="6.5" ry="3.6" />
      </Mirrored>
    </g>
  );
}

/** One muscle region; its class says how hard it works in the exercise. */
function Muscle({ id, levels, children }: { id: Region; levels: Levels; children: ReactNode }) {
  return <g className={`mm-muscle ${levels[id] ?? ''}`}>{children}</g>;
}

function Front({ levels }: { levels: Levels }) {
  return (
    <svg viewBox="0 0 100 212" aria-hidden="true">
      <Body />
      <Mirrored>
        <Muscle id="traps" levels={levels}>
          <path d="M46 28.5 L38.5 33.5 L46 33.5 Z" />
        </Muscle>
        <Muscle id="deltFront" levels={levels}>
          <ellipse cx="27" cy="38.5" rx="6.3" ry="7" />
        </Muscle>
        <Muscle id="chestUpper" levels={levels}>
          <path d="M49 35.5 L37 36 Q33.5 37.5 33.8 42 L49 42 Z" />
        </Muscle>
        <Muscle id="chestLower" levels={levels}>
          <path d="M49 43.2 L33.8 43.2 Q34 50.5 40 52 Q46 53 49 50.5 Z" />
        </Muscle>
        <Muscle id="biceps" levels={levels}>
          <ellipse cx="23.3" cy="53" rx="4.4" ry="8.6" transform="rotate(8 23.3 53)" />
        </Muscle>
        <Muscle id="forearms" levels={levels}>
          <ellipse cx="19.4" cy="80" rx="3.5" ry="11.5" transform="rotate(8 19.4 80)" />
        </Muscle>
        <Muscle id="abs" levels={levels}>
          <rect x="43.2" y="55" width="5.8" height="8.6" rx="1.8" />
          <rect x="43.2" y="65" width="5.8" height="8.6" rx="1.8" />
          <rect x="43.2" y="75" width="5.8" height="11" rx="1.8" />
        </Muscle>
        <Muscle id="obliques" levels={levels}>
          <path d="M41.6 55 L35.2 56.5 Q34.6 72 36.6 86 L41.6 86 Z" />
        </Muscle>
        <Muscle id="hipFlexors" levels={levels}>
          <path d="M36.5 90 L48.8 90 L47 103 L37.5 101 Z" />
        </Muscle>
        <Muscle id="quads" levels={levels}>
          <ellipse cx="41.7" cy="130" rx="6.4" ry="19.5" />
        </Muscle>
        <Muscle id="calves" levels={levels}>
          <ellipse cx="40.9" cy="172" rx="4.2" ry="13" />
        </Muscle>
      </Mirrored>
    </svg>
  );
}

function Back({ levels }: { levels: Levels }) {
  return (
    <svg viewBox="0 0 100 212" aria-hidden="true">
      <Body />
      <Mirrored>
        <Muscle id="traps" levels={levels}>
          <path d="M50 26.5 L46 28.5 L35.5 35 L44.2 38 L50 52 Z" />
        </Muscle>
        <Muscle id="deltBack" levels={levels}>
          <ellipse cx="27" cy="38.5" rx="6.3" ry="7" />
        </Muscle>
        <Muscle id="midBack" levels={levels}>
          <path d="M43.4 39.2 L34.6 36.6 Q33.2 44 35.6 49.6 L47.4 49.6 Z" />
        </Muscle>
        <Muscle id="lats" levels={levels}>
          <path d="M35.4 51 L47.8 51 L49 55 L49 72 L43.4 78 Q36.4 66 35.4 51 Z" />
        </Muscle>
        <Muscle id="lowerBack" levels={levels}>
          <path d="M49 74.4 L44 80 L43 91 L49 91 Z" />
        </Muscle>
        <Muscle id="triceps" levels={levels}>
          <ellipse cx="23.3" cy="53" rx="4.4" ry="8.6" transform="rotate(8 23.3 53)" />
        </Muscle>
        <Muscle id="forearms" levels={levels}>
          <ellipse cx="19.4" cy="80" rx="3.5" ry="11.5" transform="rotate(8 19.4 80)" />
        </Muscle>
        <Muscle id="glutes" levels={levels}>
          <path d="M49 93 L36 93 Q33.6 101 36 108.5 Q42 112 49 109 Z" />
        </Muscle>
        <Muscle id="hamstrings" levels={levels}>
          <ellipse cx="41.7" cy="133" rx="6.2" ry="17" />
        </Muscle>
        <Muscle id="calves" levels={levels}>
          <ellipse cx="40.9" cy="170" rx="4.8" ry="13" />
        </Muscle>
      </Mirrored>
    </svg>
  );
}

/** Front and back body outlines with the muscles an exercise works highlighted. */
export function MuscleMap({ guide }: { guide: ExerciseGuide }) {
  const levels = involvement(guide);
  // The tags under the map name the muscles, so the drawing itself is decorative for assistive tech.
  return (
    <div className="muscle-map">
      <figure>
        <Front levels={levels} />
        <figcaption>Przód</figcaption>
      </figure>
      <figure>
        <Back levels={levels} />
        <figcaption>Tył</figcaption>
      </figure>
    </div>
  );
}
