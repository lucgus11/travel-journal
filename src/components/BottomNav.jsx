import { NavLink, useLocation } from 'react-router-dom';
import { Home, MapPin, Search, Settings, Compass } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Accueil', exact: true },
  { to: '/trips', icon: Compass, label: 'Voyages' },
  { to: '/search', icon: Search, label: 'Recherche' },
  { to: '/settings', icon: Settings, label: 'Réglages' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => {
          const active = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all min-w-0"
              style={{ color: active ? 'var(--gold-main)' : 'var(--text-muted)' }}
            >
              <div
                className="relative p-2 rounded-xl transition-all"
                style={{
                  background: active ? 'rgba(212,168,83,0.12)' : 'transparent',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ boxShadow: '0 0 12px rgba(212,168,83,0.3)' }}
                  />
                )}
              </div>
              <span
                className="text-xs font-medium transition-all"
                style={{ fontSize: '10px', fontFamily: 'Nunito' }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
