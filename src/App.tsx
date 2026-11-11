import type { CSSProperties } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ExerciseDetail, ExercisesScreen } from './screens/Exercises';
import { HistoryScreen, WorkoutDetail } from './screens/History';
import { PlanEditor, PlansScreen } from './screens/Plans';
import { SettingsScreen } from './screens/Settings';
import { TrainingScreen } from './screens/TrainingScreen';
import { useRestTimer } from './state/restTimer';
import { useStore } from './state/store';
import { RestBar, TabBar } from './ui/Chrome';
import { Icon } from './ui/Icon';

export function App() {
  const { error, dismissError } = useStore();
  const resting = useRestTimer().remaining !== null;
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
        <Routes>
          <Route path="/" element={<TrainingScreen />} />
          <Route path="/plany" element={<PlansScreen />} />
          <Route path="/plany/:id" element={<PlanEditor />} />
          <Route path="/historia" element={<HistoryScreen />} />
          <Route path="/historia/:id" element={<WorkoutDetail />} />
          <Route path="/cwiczenia" element={<ExercisesScreen />} />
          <Route path="/cwiczenia/:id" element={<ExerciseDetail />} />
          <Route path="/ustawienia" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RestBar />
        <TabBar />
      </div>
    </HashRouter>
  );
}
