import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/client';

const TierContext = createContext();

export function TierProvider({ children }) {
  const [tier, setTier] = useState('one');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTier();
  }, []);

  const loadTier = async () => {
    try {
      const user = await api.auth.me();
      setTier(user.business_tier || 'one');
    } catch (error) {
      // Not logged in or error - default to One
      setTier('one');
    } finally {
      setLoading(false);
    }
  };

  const upgradeToCorporate = async () => {
    try {
      await api.auth.updateMe({ business_tier: 'corporate' });
      setTier('corporate');
      return true;
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
      return false;
    }
  };

  const value = {
    tier,
    isCorporate: tier === 'corporate',
    isOne: tier === 'one',
    loading,
    upgradeToCorporate,
    refreshTier: loadTier
  };

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier() {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within TierProvider');
  }
  return context;
}