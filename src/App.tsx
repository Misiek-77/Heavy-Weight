import { lazy, Suspense, type CSSProperties } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ExerciseDetail, ExercisesScreen } from './screens/Exercises';
import { HistoryScreen, WorkoutDetail } from './screens/History';
import { TrainingScreen } from './screens/TrainingScreen';
import { useResting } from './state/restTimer';
import { useStore } from './state/store';
import { RestBar, TabBar } from './ui/Chrome';
import { Icon } from './ui/Icon';

// Screens not needed to log a workout load on first visit, so the app starts faster. The service worker
// precaches their files, so they still open offline.
const PlansScreen = lazy(() => import('./screens/Plans').then((m) => ({ default: m.PlansScreen })));
const PlanEditor = lazy(() => import('./screens/Plans').then((m) => ({ default: m.PlanEditor })));
const ProgressScreen = lazy(() => import('./screens/Progress').then((m) => ({ default: m.ProgressScreen })));
const RecordsScreen = lazy(() => import('./screens/ProgressDetails').then((m) => ({ default: m.RecordsScreen })));
const CompareScreen = lazy(() => import('./screens/ProgressDetails').then((m) => ({ default: m.CompareScreen })));
const PhotosScreen = lazy(() => import('./screens/ProgressDetails').then((m) => ({ default: m.PhotosScreen })));
const SummaryScreen = lazy(() => import('./screens/Summary').then((m) => ({ default: m.SummaryScreen })));
const SettingsScreen = lazy(() => import('./screens/Settings').then((m) => ({ default: m.SettingsScreen })));

export function App() {
  const { error, dismissError } = useStore();
  const resting = useResting();
  // Leaves room at the bottom of the page for the rest bar while it is showing.
  const style = { '--rest-space': resting ? '72px' : '0px' } as CSSProperties;

  return (
    <HashRouter>
      <div className="app" style={style}>
        {error && (
          <div className="banner" role="alert">
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" className="icon-btn" aria-label="Zamknij komunikat" onClick={dismissError}>
              <Icon name="close" />
            </button>
          </div>
        )}
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<TrainingScreen />} />
          <Route path="/plany" element={<PlansScreen />} />
          <Route path="/plany/:id" element={<PlanEditor />} />
          <Route path="/historia" element={<HistoryScreen />} />
          <Route path="/historia/:id" element={<WorkoutDetail />} />
          <Route path="/postepy" element={<ProgressScreen />} />
          <Route path="/postepy/podsumowanie" element={<SummaryScreen />} />
          <Route path="/postepy/rekordy" element={<RecordsScreen />} />
          <Route path="/postepy/porownanie" element={<CompareScreen />} />
          <Route path="/postepy/zdjecia" element={<PhotosScreen />} />
          <Route path="/cwiczenia" element={<ExercisesScreen />} />
          <Route path="/cwiczenia/:id" element={<ExerciseDetail />} />
          <Route path="/ustawienia" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        <RestBar />
        <TabBar />
      </div>
    </HashRouter>
  );
}
