import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/database';

// Anon key public'tir (her client'a gömülür); veri erişimi RLS ile korunur.
// Env yoksa fallback kullanılır ki app hiçbir build kanalında bağlantısız kalmasın.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zylxpaxhrqximbvokrvm.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bHhwYXhocnF4aW1idm9rcnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTk2NjQsImV4cCI6MjA5NTI3NTY2NH0.saXQB2zX8u3Lr-_pvRIEziSVvCUZnGeyO6pw4haFBtc';

// JWT token'ları SecureStore'da sakla (Keychain/Keystore)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
