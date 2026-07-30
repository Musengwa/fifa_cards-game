import { Outlet } from 'react-router';

export default function Root() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-green-950">
      <Outlet />
    </div>
  );
}
