import '../global.css'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Phase 1: resolve session, then flip loading off so Stack mounts
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  // Phase 2: navigate only after Stack is mounted (loading=false)
  useEffect(() => {
    if (loading) return
    if (session) {
      // Check onboarding before sending to tabs
      supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          router.replace(
            profile?.onboarding_completed ? '/(tabs)' : '/(auth)/onboarding'
          )
        })
    } else {
      router.replace('/(auth)/login')
    }
  }, [loading, session])

  // Loading state: show spinner on dark background (Stack not mounted yet)
  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{
          flex: 1,
          backgroundColor: '#1A1A18',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ActivityIndicator color="#8ABD80" size="large" />
        </View>
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  )
}
