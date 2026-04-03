import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import Toast from '../common/Toast';
import InstallBanner from '../common/InstallBanner';
import OfflineBanner from '../common/OfflineBanner';

// Pages without bottom nav
const FULLSCREEN_ROUTES = ['/trips/new'];

export default function Layout() {
  const { toast, online, installPrompt } = useApp();
  const location = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some(r => location.pathname === r) ||
    (location.pathname.includes('/entry/new')) ||
    (location.pathname.includes('/entry/') && location.pathname !== '/');

  return (
    <div className="flex flex-col min-h-dvh bg-animated grain">
      {/* Top bar with offline indicator */}
      {!online && <OfflineBanner />}

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto ${isFullscreen ? '' : 'pb-20'}`}>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      {!isFullscreen && <BottomNav />}

      {/* Toast notifications */}
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} />}

      {/* Install banner */}
      {installPrompt && !isFullscreen && <InstallBanner />}
    </div>
  );
}
