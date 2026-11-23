import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useRestTimer } from '../state/restTimer';
import { useStore } from '../state/store';
import { formatClock } from './format';
import { Icon, type IconName } from './Icon';

/** Top row of a screen: optional back link on the left, actions on the right. */
export function Header({ back, children }: { back?: string; children?: ReactNode }) {
  return (
    <div className="header">
      {back && (
        <Link className="icon-btn" to={back} aria-label="Wróć">
          <Icon name="back" />
        </Link>
      )}
      <span className="spacer" />
      {children}
    </div>
  );
}

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Trening', icon: 'dumbbell' },
  { to: '/plany', label: 'Plany', icon: 'plans' },
  { to: '/historia', label: 'Historia', icon: 'history' },
  { to: '/postepy', label: 'Postępy', icon: 'progress' },
  { to: '/cwiczenia', label: 'Ćwiczenia', icon: 'exercises' },
  { to: '/dieta', label: 'Dieta', icon: 'today' },
];

export function TabBar() {
  const { activeWorkout } = useStore();
  return (
    <div className="tabbar">
      <nav aria-label="Główna nawigacja">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            <Icon name={tab.icon} />
            {tab.label}
            {tab.to === '/' && activeWorkout && (
              <span className="dot">
                <span className="visually-hidden">(trening w toku)</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Rest countdown docked above the tab bar while a rest is running. */
export function RestBar() {
  const rest = useRestTimer();
  if (rest.remaining === null) return null;
  return (
    <div className="restbar" role="timer" aria-label="Przerwa">
      <div className="restbar-progress" style={{ width: `${Math.min(100, (rest.remaining / rest.total) * 100)}%` }} />
      <div className="restbar-inner">
        <div className="restbar-time">
          <small>Przerwa</small>
          {formatClock(rest.remaining)}
        </div>
        <button type="button" className="btn btn-small" onClick={() => rest.add(-15)}>
          −15 s
        </button>
        <button type="button" className="btn btn-small" onClick={() => rest.add(15)}>
          +15 s
        </button>
        <button type="button" className="btn btn-small btn-quiet" onClick={rest.stop}>
          Pomiń
        </button>
      </div>
    </div>
  );
}
