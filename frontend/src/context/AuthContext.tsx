import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  demoLogin: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agentvault_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('agentvault_user');
    const savedToken = localStorage.getItem('agentvault_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem('agentvault_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('agentvault_token', newToken);
    localStorage.setItem('agentvault_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('agentvault_token');
    localStorage.removeItem('agentvault_user');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async () => {
    const res = await api.post('/auth/demo-login');
    login(res.data.access_token, res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, demoLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
