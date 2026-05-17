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
import { useFonts, CormorantGaramond_400Regular } from '@expo-google-fonts/cormorant-garamond'
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg'
import { supabase } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="clip">
          <Rect width="48" height="48" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip)">
        <Path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-5 7.2v6h8c4.7-4.3 7.3-10.7 7.3-17.3z" />
        <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.1 1.4-4.9 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.6 14.7 48 24 48z" />
        <Path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8.1-6.2z" />
        <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.4 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z" />
      </G>
    </Svg>
  )
}

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
  const [fontsLoaded] = useFonts({ CormorantGaramond_400Regular })

  async function handleSignIn() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(mapAuthError(error.message))
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'serene://auth/callback', skipBrowserRedirect: false },
    })
    setGoogleLoading(false)
    if (error) { setError('Google sign-in failed. Please try again.'); return }
    if (data?.url) await Linking.openURL(data.url)
  }

  return (
    <View style={styles.root}>
      {/* ── Mesh gradient blobs ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.wordmark,
                fontsLoaded && { fontFamily: 'CormorantGaramond_400Regular' },
              ]}
            >
              Serene
            </Text>
            <Text style={styles.tagline}>your quiet space</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(245,240,232,0.22)"
                  keyboardType="email-address"
                  keyboardAppearance="dark"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(245,240,232,0.22)"
                  secureTextEntry
                  keyboardAppearance="dark"
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

              {error && <Text style={styles.error}>{error}</Text>}

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

              {!__DEV__ ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <TouchableOpacity
                    style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
                    activeOpacity={0.85}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color="rgba(245,240,232,0.7)" size="small" />
                    ) : (
                      <View style={styles.googleRow}>
                        <GoogleIcon />
                        <Text style={styles.googleBtnText}>Continue with Google</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.devNote}>
                  Google sign-in available in the full app
                </Text>
              )}

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
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111410',
  },
  blob1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(78,122,68,0.13)',
    top: -90,
    right: -90,
  },
  blob2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(47,80,39,0.10)',
    top: 260,
    left: -110,
  },
  blob3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(74,138,181,0.07)',
    bottom: 80,
    right: -60,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  wordmark: {
    fontSize: 52,
    fontStyle: 'italic',
    color: '#8ABD80',
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.28)',
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 52,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(16,20,14,0.90)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 18,
  },
  cardTitle: {
    fontSize: 20,
    color: 'rgba(245,240,232,0.6)',
    fontWeight: '300',
    marginBottom: 2,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: 'rgba(245,240,232,0.32)',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#F5F0E8',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 12,
    color: 'rgba(138,189,128,0.65)',
  },
  error: {
    fontSize: 13,
    color: '#D4883A',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#4E7A44',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4E7A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  btnDisabled: { opacity: 0.5 },
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
    fontSize: 12,
    color: 'rgba(255,255,255,0.15)',
  },
  googleBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleBtnText: {
    color: 'rgba(245,240,232,0.65)',
    fontSize: 14,
  },
  devNote: {
    color: 'rgba(245,240,232,0.25)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.35)',
  },
  footerLink: {
    fontSize: 13,
    color: '#8ABD80',
  },
})
