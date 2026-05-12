import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email or password is incorrect.'
  if (message.includes('Email not confirmed')) return 'Please check your email to confirm your account first.'
  return 'Something went wrong. Please try again.'
}

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)

    if (error) { setError(mapAuthError(error.message)); return }
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single()
      router.replace(profile?.onboarding_completed ? '/(tabs)/' : '/(auth)/onboarding')
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'serene://auth/callback' },
    })
    setGoogleLoading(false)
    if (error) { setError('Google sign-in failed. Please try again.'); return }
    if (data?.url) await Linking.openURL(data.url)
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Text style={styles.logo}>Serene</Text>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>Your space is waiting.</Text>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(245,240,232,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(245,240,232,0.3)"
                secureTextEntry
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity
                style={styles.forgotLink}
                onPress={() => router.push('/(auth)/forgot-password' as never)}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error && <Text style={styles.error}>{error}</Text>}

            {/* Sign In */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#F5F0E8" size="small" />
                : <Text style={styles.primaryBtnText}>SIGN IN</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.secondaryBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading
                ? <ActivityIndicator color="rgba(245,240,232,0.7)" size="small" />
                : <Text style={styles.secondaryBtnText}>Continue with Google</Text>
              }
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Serene? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.footerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A18',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logo: {
    textAlign: 'center',
    fontSize: 36,
    color: '#8ABD80',
    marginBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 20,
  },
  cardHeader: { gap: 4 },
  cardTitle: {
    fontSize: 26,
    color: '#F5F0E8',
    fontWeight: '300',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.4)',
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(245,240,232,0.5)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F5F0E8',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#8ABD80',
  },
  error: {
    fontSize: 14,
    color: '#D4883A',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#4E7A44',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#F5F0E8',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnDisabled: { opacity: 0.55 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.25)',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: {
    color: 'rgba(245,240,232,0.7)',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.4)',
  },
  footerLink: {
    fontSize: 14,
    color: '#8ABD80',
  },
})
