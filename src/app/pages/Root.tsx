import { Outlet } from 'react-router';
import TopBar from '../components/TopBar';
import { useAppTheme } from '../lib/theme';

export default function Root() {
  const { tokens } = useAppTheme();
  return (
    <div className={`min-h-screen bg-gradient-to-br ${tokens.bgGradient} pt-20`}>
      <TopBar />
      <Outlet />
    </div>
  );
}
