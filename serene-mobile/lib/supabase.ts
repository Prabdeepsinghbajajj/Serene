import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

if (__DEV__) {
  console.log('[supabase] URL prefix:', process.env.EXPO_PUBLIC_SUPABASE_URL?.slice(0, 40))
  console.log('[supabase] Key prefix:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20))
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
