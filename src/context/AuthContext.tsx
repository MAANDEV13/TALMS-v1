'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_DB } from '@/lib/mockDb';

export type UserRole = 'admin' | 'officer' | 'director' | 'general_director' | 'minister';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Mock DB
    MOCK_DB.init();

    // Check local storage for session
    const savedUser = localStorage.getItem('talms_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    const users = MOCK_DB.get('users');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const sessionUser: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      };
      setUser(sessionUser);
      localStorage.setItem('talms_session', JSON.stringify(sessionUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('talms_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
