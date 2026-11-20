/**
 * What each exercise illustration shows: [exercise, camera view, start pose, end pose, highlighted muscles].
 * Keys are the built-in exercise ids without the `seed-` prefix (see src/domain/seed.ts).
 */
export const POSES = {
  // Chest
  'bench-press': ['barbell bench press on a flat bench', 'side view', 'lying on the bench, arms straight, barbell held above the chest', 'elbows bent about 45 degrees from the torso, barbell touching the middle of the chest (not the neck)', 'chest, front shoulders, triceps'],
  'incline-bench-press': ['incline barbell bench press on a 30 degree incline bench', 'side view', 'lying on the incline bench, arms straight, barbell above the upper chest', 'elbows bent, barbell touching the upper chest', 'upper chest, front shoulders, triceps'],
  'db-bench-press': ['dumbbell bench press on a flat bench', 'side view', 'lying on the bench, arms straight, a dumbbell in each hand above the chest', 'elbows bent, dumbbells lowered beside the chest', 'chest, front shoulders, triceps'],
  'incline-db-press': ['incline dumbbell press on a 30 degree incline bench', 'side view', 'lying on the incline bench, arms straight, dumbbells above the upper chest', 'elbows bent, dumbbells lowered beside the upper chest', 'upper chest, front shoulders, triceps'],
  'db-fly': ['dumbbell chest fly on a flat bench', 'three-quarter front view', 'lying on the bench, arms almost straight above the chest, dumbbells close together, palms facing each other', 'arms opened wide to the sides with slightly bent elbows, dumbbells at chest height', 'chest, front shoulders'],
  'cable-fly': ['standing cable chest fly between two cable towers', 'front view', 'standing with one foot forward, arms opened wide to the sides holding the high cable handles', 'hands brought together in front of the lower chest, elbows slightly bent', 'chest, front shoulders'],
  'pec-deck': ['pec deck (butterfly) machine fly', 'three-quarter front view', 'seated upright in the machine, arms opened wide holding the handles at chest height', 'handles brought together in front of the chest', 'chest, front shoulders'],
  'chest-press-machine': ['seated chest press machine', 'side view', 'seated with the back against the pad, elbows bent, handles beside the chest', 'arms extended forward, handles pushed away from the chest', 'chest, front shoulders, triceps'],
  'push-up': ['push-up on the floor', 'side view', 'high plank, arms straight, body in one straight line from head to heels', 'elbows bent, chest just above the floor, body still in a straight line', 'chest, front shoulders, triceps, abs'],
  dip: ['dip on parallel bars', 'side view', 'supported on straight arms on the parallel bars, torso leaning slightly forward, knees bent', 'elbows bent to about 90 degrees, shoulders lowered to elbow height', 'chest, triceps, front shoulders'],

  // Back
  deadlift: ['conventional barbell deadlift', 'side view', 'hips hinged and knees bent, flat back, hands gripping the barbell on the floor close to the shins', 'standing fully upright, hips and knees locked out, barbell held at the thighs', 'glutes, hamstrings, lower back, upper back'],
  'pull-up': ['pull-up on a bar with an overhand grip slightly wider than the shoulders', 'back view', 'hanging from the bar with straight arms', 'chin above the bar, elbows pulled down to the sides', 'lats, mid back, biceps'],
  'chin-up': ['chin-up on a bar with an underhand shoulder-width grip', 'front view', 'hanging from the bar with straight arms, palms facing the athlete', 'chin above the bar, elbows pulled down in front of the ribs', 'lats, biceps, mid back'],
  'barbell-row': ['bent-over barbell row with an overhand grip slightly wider than the shoulders', 'side view', 'torso hinged forward about 45 degrees with a flat back, knees slightly bent, barbell hanging at straight arms below the knees', 'barbell pulled to the lower ribs, elbows behind the torso, back still flat', 'lats, mid back, rear shoulders, biceps'],
  'db-row': ['single-arm dumbbell row with one knee and one hand supported on a flat bench', 'side view', 'flat back parallel to the floor, the working arm hanging straight down holding a dumbbell', 'dumbbell pulled to the hip, elbow pointing up above the back', 'lats, mid back, rear shoulders, biceps'],
  'lat-pulldown': ['lat pulldown on a cable machine with a wide bar', 'back view', 'seated with thighs under the pads, arms straight up holding the wide bar', 'bar pulled down to the upper chest, elbows pointing down and slightly back', 'lats, mid back, biceps'],
  'seated-cable-row': ['seated cable row with a close-grip handle', 'side view', 'seated upright with knees slightly bent and feet on the platform, arms extended forward holding the handle', 'handle pulled to the abdomen, elbows behind the torso, chest up', 'mid back, lats, rear shoulders, biceps'],
  't-bar-row': ['T-bar row with a landmine barbell between the legs', 'side view', 'torso hinged forward about 45 degrees with a flat back, arms straight holding the handle of the loaded bar', 'handle pulled to the chest, elbows behind the torso', 'mid back, lats, rear shoulders, biceps'],
  'machine-row': ['seated row machine with a chest pad', 'side view', 'seated with the chest against the pad, arms extended forward holding the handles', 'handles pulled back beside the ribs, shoulder blades squeezed together', 'mid back, lats, rear shoulders, biceps'],
  'straight-arm-pulldown': ['standing straight-arm cable pulldown with a straight bar', 'side view', 'standing facing a high cable, torso leaning slightly forward, straight arms raised holding the bar at head height', 'straight arms pulled down in an arc until the bar touches the thighs', 'lats, rear shoulders, triceps'],
  'back-extension': ['back extension on a 45 degree roman chair', 'side view', 'hips on the pad, ankles hooked, torso hanging down towards the floor, arms crossed on the chest', 'torso raised until the body forms one straight line from head to heels', 'lower back, glutes, hamstrings'],
  shrug: ['dumbbell shrug', 'front view', 'standing upright, straight arms at the sides holding dumbbells, shoulders relaxed down', 'shoulders lifted straight up towards the ears, arms still straight', 'upper trapezius'],

  // Legs
  squat: ['barbell back squat', 'side view', 'standing upright, barbell resting on the upper back behind the neck, hands gripping the bar', 'deep squat with thighs parallel to the floor, heels down, chest up, barbell still on the upper back', 'quadriceps, glutes, hamstrings'],
  'front-squat': ['barbell front squat', 'side view', 'standing upright, barbell resting on the front of the shoulders, elbows pointing high forward', 'deep squat with an upright torso, thighs parallel to the floor, elbows still high', 'quadriceps, glutes, abs'],
  'leg-press': ['45 degree leg press machine', 'side view', 'seated reclined in the machine, feet on the platform, knees bent towards the chest', 'legs extended pushing the platform away, knees not fully locked', 'quadriceps, glutes, hamstrings'],
  'romanian-deadlift': ['Romanian deadlift with a barbell', 'side view', 'standing upright, barbell held at the thighs with straight arms', 'hips pushed far back, flat back, knees slightly bent, barbell lowered to mid-shin close to the legs', 'hamstrings, glutes, lower back'],
  lunge: ['forward lunge with dumbbells', 'side view', 'standing upright with feet together, a dumbbell in each hand at the sides', 'long step forward, both knees bent to 90 degrees, back knee just above the floor, torso upright', 'quadriceps, glutes, hamstrings'],
  'bulgarian-split-squat': ['Bulgarian split squat with dumbbells, rear foot elevated on a bench', 'side view', 'standing on the front leg with the rear foot resting on the bench behind, dumbbells at the sides', 'front knee bent to 90 degrees, rear knee lowered towards the floor, torso upright', 'quadriceps, glutes'],
  'goblet-squat': ['goblet squat holding one dumbbell vertically against the chest', 'three-quarter front view', 'standing upright, dumbbell held with both hands at the chest', 'deep squat with elbows between the knees, torso upright, heels down', 'quadriceps, glutes, abs'],
  'hack-squat': ['hack squat machine', 'side view', 'standing in the machine with the back against the sliding pad and shoulders under the shoulder pads, legs straight', 'knees bent to 90 degrees, back still against the pad, feet flat on the platform', 'quadriceps, glutes'],
  'leg-extension': ['leg extension machine', 'side view', 'seated in the machine, knees bent, shins behind the roller pad', 'legs fully extended forward, roller pad lifted', 'quadriceps'],
  'leg-curl': ['lying leg curl machine', 'side view', 'lying face down on the machine, legs straight, roller pad behind the ankles', 'knees bent, roller pad curled towards the glutes', 'hamstrings'],
  'hip-thrust': ['barbell hip thrust with the upper back on a bench', 'side view', 'upper back against the bench, hips low near the floor, barbell across the hip crease, knees bent, feet flat', 'hips lifted until the torso and thighs form a straight horizontal line, shins vertical', 'glutes, hamstrings'],
  'standing-calf-raise': ['standing calf raise on a step', 'side view', 'standing with the balls of the feet on a step, heels lowered below the step', 'raised high on the toes, legs straight', 'calves'],
  'seated-calf-raise': ['seated calf raise machine', 'side view', 'seated with the pad on the knees, balls of the feet on the platform, heels lowered', 'heels raised as high as possible', 'calves'],

  // Shoulders
  'overhead-press': ['standing barbell overhead press', 'side view', 'standing upright, barbell held at the collarbones, elbows slightly in front of the bar', 'arms locked out overhead, barbell directly above the head and mid-foot', 'shoulders, triceps, upper chest'],
  'db-shoulder-press': ['seated dumbbell shoulder press on a bench with back support', 'front view', 'seated, dumbbells held at ear height, elbows bent 90 degrees and out to the sides', 'arms extended overhead, dumbbells close together above the head', 'shoulders, triceps'],
  'arnold-press': ['seated Arnold press with dumbbells', 'front view', 'seated, dumbbells held in front of the shoulders with palms facing the athlete, elbows in front of the torso', 'arms extended overhead with palms rotated to face forward', 'shoulders, triceps'],
  'lateral-raise': ['standing dumbbell lateral raise', 'front view', 'standing upright, dumbbells at the sides of the thighs', 'arms raised out to the sides to shoulder height with slightly bent elbows', 'side shoulders'],
  'cable-lateral-raise': ['single-arm cable lateral raise at a low pulley', 'front view', 'standing sideways to the low pulley, the far hand holding the handle in front of the hips', 'the working arm raised out to the side to shoulder height', 'side shoulders'],
  'front-raise': ['standing dumbbell front raise', 'side view', 'standing upright, dumbbells in front of the thighs', 'straight arms raised forward to shoulder height', 'front shoulders'],
  'rear-delt-fly': ['bent-over dumbbell rear delt fly', 'three-quarter front view', 'torso hinged forward nearly parallel to the floor, dumbbells hanging below the chest', 'arms raised out to the sides to shoulder height with slightly bent elbows', 'rear shoulders, mid back'],
  'face-pull': ['cable face pull with a rope attachment at a high pulley', 'side view', 'standing facing the cable, arms extended forward holding the rope at face height', 'rope pulled to the face, elbows high and wide, hands beside the ears', 'rear shoulders, mid back, trapezius'],
  'upright-row': ['barbell upright row', 'front view', 'standing upright, barbell held at the thighs with a shoulder-width overhand grip', 'barbell pulled up along the body to chest height, elbows higher than the hands', 'side shoulders, trapezius'],

  // Biceps
  'barbell-curl': ['standing barbell biceps curl', 'side view', 'standing upright, arms straight, barbell at the thighs with an underhand grip', 'elbows bent and kept at the sides, barbell curled to shoulder height', 'biceps, forearms'],
  'db-curl': ['standing dumbbell biceps curl', 'front view', 'standing upright, arms straight at the sides holding dumbbells, palms facing forward', 'elbows bent and kept at the sides, dumbbells curled to shoulder height', 'biceps, forearms'],
  'hammer-curl': ['standing dumbbell hammer curl', 'side view', 'standing upright, arms straight at the sides, dumbbells held with palms facing the thighs', 'elbows bent and kept at the sides, dumbbells raised to shoulder height with palms still facing each other', 'biceps, forearms'],
  'preacher-curl': ['preacher curl with an EZ bar on a preacher bench', 'side view', 'seated, upper arms resting on the angled pad, arms almost straight holding the bar', 'elbows bent, bar curled towards the shoulders, upper arms still on the pad', 'biceps'],
  'cable-curl': ['standing cable biceps curl with a straight bar at a low pulley', 'side view', 'standing facing the low pulley, arms straight holding the bar at the thighs', 'elbows bent and kept at the sides, bar curled to shoulder height', 'biceps, forearms'],
  'incline-db-curl': ['incline dumbbell curl lying back on a 60 degree incline bench', 'side view', 'leaning back on the incline bench, arms hanging straight down behind the torso holding dumbbells', 'elbows bent, dumbbells curled to shoulder height, upper arms still pointing down', 'biceps'],

  // Triceps
  'triceps-pushdown': ['cable triceps pushdown with a straight bar at a high pulley', 'side view', 'standing facing the cable, elbows bent and tucked at the sides, bar at chest height', 'arms fully extended down, bar at the thighs, elbows still at the sides', 'triceps'],
  'skull-crusher': ['lying triceps extension (skull crusher) with an EZ bar on a flat bench', 'side view', 'lying on the bench, arms straight and vertical holding the bar above the shoulders', 'elbows bent, bar lowered to the forehead, upper arms still vertical', 'triceps'],
  'overhead-triceps-extension': ['seated overhead triceps extension holding one dumbbell with both hands', 'side view', 'seated upright, arms straight overhead holding the dumbbell', 'elbows bent and pointing up, dumbbell lowered behind the head', 'triceps'],
  'close-grip-bench-press': ['close-grip barbell bench press on a flat bench with a shoulder-width grip', 'side view', 'lying on the bench, arms straight, barbell above the chest', 'elbows bent and tucked close to the torso, barbell touching the lower chest', 'triceps, chest, front shoulders'],
  'bench-dip': ['bench dip with the hands on the edge of a bench behind the body', 'side view', 'arms straight supporting the body in front of the bench, legs extended forward, heels on the floor', 'elbows bent to 90 degrees pointing straight back, hips lowered towards the floor', 'triceps, front shoulders'],
  'rope-overhead-extension': ['overhead cable triceps extension with a rope, facing away from the pulley', 'side view', 'standing in a split stance leaning slightly forward, elbows bent beside the head, rope behind the head', 'arms extended forward and up, elbows still beside the head', 'triceps'],

  // Core
  plank: ['forearm plank', 'side view', 'kneeling on the floor with the forearms on the ground, getting into position', 'holding the plank on forearms and toes, body in one straight line from head to heels', 'abs, obliques'],
  crunch: ['abdominal crunch on the floor', 'side view', 'lying on the back, knees bent, feet flat, hands beside the head', 'shoulder blades lifted off the floor, upper spine curled, lower back still on the floor', 'abs'],
  'hanging-leg-raise': ['hanging leg raise on a pull-up bar', 'side view', 'hanging from the bar with straight arms and straight legs pointing down', 'straight legs raised forward to hip height, forming an L shape', 'abs, hip flexors'],
  'cable-crunch': ['kneeling cable crunch with a rope at a high pulley', 'side view', 'kneeling facing the cable, torso upright, rope held beside the head', 'spine curled forward, elbows moving towards the knees, hips staying in place', 'abs'],
  'russian-twist': ['Russian twist seated on the floor holding a weight plate', 'three-quarter front view', 'seated leaning back with knees bent and heels on the floor, torso rotated to the left, plate beside the left hip', 'the same seated position with the torso rotated to the right, plate beside the right hip', 'obliques, abs'],
  'ab-wheel': ['ab wheel rollout from the knees', 'side view', 'kneeling with the arms straight, ab wheel on the floor below the shoulders, back slightly rounded', 'body stretched out forward, wheel rolled far ahead, hips low, back not sagging', 'abs, lats'],

  // Whole body
  'farmer-walk': ['farmer walk carrying a heavy dumbbell in each hand', 'side view', 'standing upright holding heavy dumbbells at the sides, shoulders back', 'walking forward mid-stride with an upright torso, dumbbells still at the sides', 'forearms, trapezius, abs'],
  'kettlebell-swing': ['two-handed kettlebell swing', 'side view', 'hips hinged back, flat back, kettlebell swung back between the legs', 'standing fully upright with hips locked out, straight arms holding the kettlebell at chest height in front', 'glutes, hamstrings, lower back'],
  // Added November 2026
  'underhand-barbell-row': ['bent-over barbell row with an underhand (supinated) shoulder-width grip, palms facing forward', 'side view', 'torso hinged forward about 45 degrees with a flat back, knees slightly bent, barbell hanging at straight arms below the knees', 'barbell pulled to the belly button, elbows close to the body and behind the torso, back still flat', 'lats, mid back, biceps'],
  'close-grip-pulldown': ['close-grip lat pulldown with a V-handle on a cable machine, seated with the thighs under the pads', 'side view', 'arms fully extended overhead holding the V-handle, torso slightly leaning back', 'V-handle pulled down to the upper chest, elbows driven down and back beside the ribs', 'lats, mid back, biceps'],
  'db-pullover': ['dumbbell pullover lying on a flat bench, holding one dumbbell with both hands', 'side view', 'lying on the bench, dumbbell held with both hands above the chest, elbows slightly bent', 'dumbbell lowered in an arc behind the head to about bench height, elbows still slightly bent', 'lats, chest, triceps'],
  'sumo-deadlift': ['sumo barbell deadlift with a very wide stance, toes pointed out and a narrow grip inside the knees', 'front view', 'hips low, knees pushed out over the toes, back flat, gripping the loaded barbell on the floor', 'standing tall with the hips locked out, barbell hanging at straight arms in front of the thighs', 'glutes, quadriceps, lower back'],
  'good-morning': ['barbell good morning, barbell resting on the upper back', 'side view', 'standing tall with the barbell on the upper back, knees slightly bent', 'hips pushed back and torso hinged forward almost parallel to the floor with a flat back, knees still only slightly bent', 'hamstrings, lower back, glutes'],
  'reverse-pec-deck': ['reverse pec deck fly on a pec deck machine, seated facing the backrest pad', 'three-quarter rear view', 'chest against the pad, arms reaching forward holding the machine handles together in front', 'arms swept wide out to the sides in line with the shoulders, elbows almost straight', 'rear shoulders, mid back'],
  'ez-bar-curl': ['standing EZ-bar curl with a cambered curl bar', 'side view', 'standing tall, arms straight down holding the EZ bar in front of the thighs', 'elbows bent, EZ bar curled up to shoulder height, elbows still beside the torso', 'biceps, forearms'],
  'concentration-curl': ['seated dumbbell concentration curl on a flat bench', 'three-quarter front view', 'sitting with legs wide, back of the working arm braced against the inner thigh, dumbbell hanging at a straight arm', 'elbow bent, dumbbell curled up towards the shoulder, upper arm still braced on the thigh', 'biceps'],
  'cable-hammer-curl': ['standing rope hammer curl on a low cable pulley', 'side view', 'standing facing the low pulley, arms straight down holding the rope ends with a neutral grip, thumbs up', 'elbows bent, rope curled up to the shoulders, elbows still beside the torso', 'biceps, brachioradialis, forearms'],
  'triceps-kickback': ['dumbbell triceps kickback with one knee and one hand on a flat bench', 'side view', 'torso parallel to the floor, working upper arm along the torso, elbow bent 90 degrees, dumbbell hanging below the elbow', 'arm fully straightened backwards in line with the torso, upper arm unmoved', 'triceps'],
  'side-plank': ['forearm side plank on the floor', 'front view', 'lying on the side propped on one forearm, elbow under the shoulder, hips resting on the floor, legs straight and stacked', 'hips lifted so the body forms one straight line from head to feet, free hand on the hip', 'obliques, abs, glutes'],
};

/** Builds the image prompt for one exercise. */
export function promptFor(key) {
  const [exercise, view, start, end, muscles] = POSES[key];
  return (
    `Minimalist flat vector instructional illustration of a ${exercise}, ${view}. ` +
    `Two poses side by side of the same faceless athlete in plain sportswear: left pose is the start position (${start}); ` +
    `right pose is the end position (${end}). ` +
    `Working muscles (${muscles}) highlighted in lime green (#c8f031), the rest of the body neutral light grey. ` +
    `Thin dark outlines, plain off-white background, landscape 4:3 composition. ` +
    `Both poses, including all equipment, fit completely inside the frame with an empty margin on every side; nothing is cut off at the edges and the two poses do not overlap. ` +
    `No text, no labels, no logos, no arrows, no watermark. Anatomically correct, exactly two arms and two legs per figure, ` +
    `equipment drawn realistically and in correct proportion.`
  );
}
