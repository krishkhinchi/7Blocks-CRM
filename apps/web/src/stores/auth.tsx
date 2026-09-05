import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_REP';
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: 'ADMIN' | 'MANAGER' | 'SALES_REP') => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('7blocks_access_token');
    const saved = localStorage.getItem('7blocks_user');
    if (!token || !saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('7blocks_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('7blocks_access_token');
      const storedUser = localStorage.getItem('7blocks_user');
      if (!storedToken || !storedUser) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('7blocks_user');
        localStorage.removeItem('7blocks_access_token');
        localStorage.removeItem('7blocks_refresh_token');
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res?.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('7blocks_user', JSON.stringify(res.data.data));
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('7blocks_user');
          localStorage.removeItem('7blocks_access_token');
          localStorage.removeItem('7blocks_refresh_token');
        } else {
          // If offline or transient network error, retain stored session
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = res.data.data;
    setUser(user);
    setToken(accessToken);
    localStorage.setItem('7blocks_user', JSON.stringify(user));
    localStorage.setItem('7blocks_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('7blocks_refresh_token', refreshToken);
    }
  };

  const signup = async (name: string, email: string, password: string, role: 'ADMIN' | 'MANAGER' | 'SALES_REP' = 'SALES_REP') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user, accessToken, refreshToken } = res.data.data;
    setUser(user);
    setToken(accessToken);
    localStorage.setItem('7blocks_user', JSON.stringify(user));
    localStorage.setItem('7blocks_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('7blocks_refresh_token', refreshToken);
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('7blocks_user');
    localStorage.removeItem('7blocks_access_token');
    localStorage.removeItem('7blocks_refresh_token');
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('7blocks_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res?.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('7blocks_user', JSON.stringify(res.data.data));
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, isAdmin, isManager, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
