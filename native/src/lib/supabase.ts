import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

if (!SUPABASE_CONFIGURED) {
  // Build zamanı env vars'lar yoksa development sırasında uyarı,
  // production'da sessizce devam (UI hardcoded fallback'lere düşer).
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanımsız — ' +
    'tüm DB çağrıları başarısız olacak ve UI fallback veriye düşecek.'
  );
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Env yoksa placeholder URL ile init et (crash etmesin, çağrılar fail olur)
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
