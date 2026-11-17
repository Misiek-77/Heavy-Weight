/**
 * Image prompts for the "which muscles work" illustration of every built-in exercise, built from the
 * muscles listed in src/domain/guides.ts so the picture always matches the text and the tags.
 *
 *   node scripts/muscle-prompts.mjs            print all prompts as JSON { id: prompt }
 */
import { guideFor } from '../src/domain/guides.ts';
import { POSES } from './illustration-poses.mjs';

/** English anatomy names for the muscle names used in the guides. */
const ENGLISH = {
  'klatka piersiowa': 'chest (pectoralis major)',
  'górna część klatki': 'upper chest (clavicular pectoralis)',
  barki: 'shoulders (all three heads of the deltoids)',
  'przednie barki': 'front deltoids',
  'boczne barki': 'side deltoids',
  'tylne barki': 'rear deltoids',
  'rotatory barku': 'rotator cuff (infraspinatus and teres minor, back of the shoulder blade)',
  czworoboczny: 'trapezius',
  'czworoboczny (góra)': 'upper trapezius',
  'środek pleców': 'mid back (rhomboids and middle trapezius)',
  'górna część pleców': 'upper back (trapezius and rhomboids)',
  'najszerszy grzbietu': 'latissimus dorsi',
  'prostowniki grzbietu': 'lower back (erector spinae)',
  biceps: 'biceps',
  triceps: 'triceps',
  przedramiona: 'forearms',
  'ramienno-promieniowy': 'brachioradialis (top of the forearm)',
  brzuch: 'abdominals (rectus abdominis)',
  'skośne brzucha': 'obliques',
  'zginacze bioder': 'hip flexors',
  pośladki: 'glutes',
  'czworogłowe uda': 'quadriceps',
  'tył ud': 'hamstrings',
  łydki: 'calves (gastrocnemius)',
  'łydki (płaszczkowaty)': 'calves (soleus, the lower calf)',
};

const english = (muscles) =>
  muscles.map((m) => {
    if (!ENGLISH[m]) throw new Error(`No English name for "${m}"`);
    return ENGLISH[m];
  });

/** The prompt for one exercise, by id without the `seed-` prefix. */
export function musclePrompt(key) {
  const guide = guideFor(`seed-${key}`);
  if (!guide) throw new Error(`No guide for ${key}`);
  const primary = english(guide.primary).join(', ');
  const secondary = guide.secondary.length ? english(guide.secondary).join(', ') : 'none';
  return (
    'Generate one image in landscape 4:3 format: an anatomical muscle chart for a fitness app. ' +
    'Two views of the same faceless male figure standing side by side at the same size: on the left the FRONT view, ' +
    'on the right the BACK view, both in a neutral upright pose with the arms hanging slightly away from the body ' +
    'and the feet hip-width apart, the whole body from head to feet visible with a margin. ' +
    'The muscles are drawn as clean flat vector shapes with thin dark outlines, anatomically correct and symmetrical. ' +
    `Main working muscles, coloured bright lime green (#c8f031) on whichever view shows them: ${primary}. ` +
    `Assisting muscles, coloured pale lime green (#e3f2a6): ${secondary}. ` +
    'Every other muscle is light neutral grey, the skin and outlines are the same neutral grey style. ' +
    'Plain uniform off-white background (#f7f7f3). No text, no labels, no numbers, no arrows, no legend, no logos, no watermark. ' +
    'Keep exactly the same figure, pose, proportions and colours as a reusable template, so that charts for different exercises differ only in which muscles are green.'
  );
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  console.log(JSON.stringify(Object.fromEntries(Object.keys(POSES).map((k) => [k, musclePrompt(k)]))));
}
