import React, { createContext, useContext } from 'react';
import { useAuth, AuthStatus } from '@/hooks/useAuth';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

type AuthCtxType = {
  session: Session | null;
  profile: Profile | null;
  status: AuthStatus;
  sendOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, token: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
};

const AuthCtx = createContext<AuthCtxType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthCtx.Provider value={auth}>{children}</AuthCtx.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
