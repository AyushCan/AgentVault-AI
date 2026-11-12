import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface KillSwitchContextType {
  isActive: boolean;
  activatedAt: string | null;
  reason: string | null;
  toggleKillSwitch: (activate: boolean, reason?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const KillSwitchContext = createContext<KillSwitchContextType | undefined>(undefined);

export const KillSwitchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await api.get('/security/kill-switch');
      setIsActive(res.data.active);
      setActivatedAt(res.data.activated_at);
      setReason(res.data.reason);
    } catch (err) {
      console.error('Failed to fetch kill switch status', err);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleKillSwitch = async (activate: boolean, newReason = 'Admin Override') => {
    if (activate) {
      await api.post(`/security/kill-switch/activate?reason=${encodeURIComponent(newReason)}`);
    } else {
      await api.post('/security/kill-switch/deactivate');
    }
    await refresh();
  };

  return (
    <KillSwitchContext.Provider value={{ isActive, activatedAt, reason, toggleKillSwitch, refresh }}>
      {children}
    </KillSwitchContext.Provider>
  );
};

export const useKillSwitch = () => {
  const context = useContext(KillSwitchContext);
  if (!context) throw new Error('useKillSwitch must be used within KillSwitchProvider');
  return context;
};

