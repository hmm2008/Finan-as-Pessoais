import React from 'react';
import { usePin } from '../../contexts';
import { PinLockScreen } from './PinLockScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { unlocked } = usePin();

  if (!unlocked) {
    return <PinLockScreen />;
  }

  return <>{children}</>;
}
