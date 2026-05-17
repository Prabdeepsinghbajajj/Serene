import '../global.css'
import { useEffect, useRef, useState } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  // Phase 1: resolve session, then flip loading off so Stack mounts
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.log('[auth] Session error, clearing:', error.message)
        supabase.auth.signOut().then(() => {
          setSession(null)
          setLoading(false)
        })
        return
      }
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session)
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Phase 2: navigate only after Stack is mounted (loading=false)
  useEffect(() => {
    if (loading) return
    if (session) {
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

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Animated.Text style={[styles.splashText, { opacity: pulseAnim }]}>
            Serene
          </Animated.Text>
        </View>
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#111410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    fontSize: 48,
    fontStyle: 'italic',
    color: '#8ABD80',
    letterSpacing: 1,
  },
})
