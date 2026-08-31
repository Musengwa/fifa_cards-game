import { Outlet, useLocation } from 'react-router';
import TopBar from '../components/TopBar';
import { useAppTheme } from '../lib/theme';
import { isAuthenticated } from '../lib/auth';

export default function Root() {
  const { tokens } = useAppTheme();
  const location = useLocation();
  const showTopBar = isAuthenticated() && location.pathname !== '/create-card';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tokens.bgGradient} ${showTopBar ? 'pt-20' : ''}`}>
      {showTopBar && <TopBar />}
      <Outlet />
    </div>
  );
}
