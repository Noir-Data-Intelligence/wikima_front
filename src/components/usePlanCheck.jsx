import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useDemoMode } from './DemoModeContext';

// PAYMENT DISABLED: All plan checks bypass — full free access for all users
export function usePlanCheck() {
  const { isDemoMode } = useDemoMode();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const checkLimit = () => ({ allowed: true });
  const incrementUsage = async () => {};
  const getPlanLimits = () => ({});
  const isAdmin = () => user?.role === 'admin';

  return {
    user,
    loading,
    checkLimit,
    incrementUsage,
    getPlanLimits,
    refreshUser: () => {},
    isAdmin
  };
}