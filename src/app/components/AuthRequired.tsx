import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { isAuthenticated } from '../lib/auth';

interface AuthRequiredProps {
  children: ReactNode;
}

/** Keeps game and group pages private while card creation remains public. */
export default function AuthRequired({ children }: AuthRequiredProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          openLogin: true,
          redirectTo: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return <>{children}</>;
}
