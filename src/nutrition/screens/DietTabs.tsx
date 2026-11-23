import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dieta', label: 'Dziennik', end: true },
  { to: '/dieta/postepy', label: 'Postępy' },
  { to: '/dieta/produkty', label: 'Produkty' },
  { to: '/dieta/ustawienia', label: 'Cele' },
];

/** The diet's own sections, at the top of each of them; the app's tab bar has one "Dieta" tab for all four. */
export function DietTabs() {
  return (
    <nav className="diet-tabs" aria-label="Dieta">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
