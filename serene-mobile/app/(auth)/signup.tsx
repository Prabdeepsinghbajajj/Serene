import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

/* -------------------------------------------------------------------------- */
/*  Username availability (public API check)                                   */
/* -------------------------------------------------------------------------- */

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function useUsernameCheck(username: string): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>('idle')

  const check = useCallback(async (value: string) => {
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(value)) { setStatus('invalid'); return }
    setStatus('checking')
    try {
      const res = await fetch(`https://www.serene.network/api/profile/${value}`)
      setStatus(res.ok ? 'taken' : res.status === 404 ? 'available' : 'idle')
    } catch {
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    setStatus('idle')
    if (username.length < 3) return
    const t = setTimeout(() => check(username), 600)
    return () => clearTimeout(t)
  }, [username, check])

  return status
}

/* -------------------------------------------------------------------------- */
/*  Password strength                                                           */
/* -------------------------------------------------------------------------- */

function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  else if (/[0-9]/.test(password)) score = Math.max(score, 1)
  return Math.min(score, 3) as 0 | 1 | 2 | 3
}

const STRENGTH_COLORS: Record<1 | 2 | 3, string[]> = {
  1: ['rgba(242,166,90,0.8)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'],
  2: ['rgba(74,138,181,0.8)', 'rgba(74,138,181,0.8)', 'rgba(255,255,255,0.1)'],
  3: ['#8ABD80', '#8ABD80', '#8ABD80'],
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                      */
/* -------------------------------------------------------------------------- */

export default function SignupScreen() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const usernameStatus = useUsernameCheck(username)
  const strength = passwordStrength(password)

  const canSubmit =
    !loading &&
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'invalid' &&
    usernameStatus !== 'checking'

  async function handleSignUp() {
    if (!canSubmit) return
    setLoading(true)
    setServerError(null)

    // Final race-condition guard via Supabase
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    if (existing) {
      setServerError('That username was just taken. Please choose another.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          display_name: displayName.trim(),
        },
      },
    })
    setLoading(false)
    if (error) { setServerError('Something went wrong. Please try again.'); return }
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <View style={styles.root}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.blob1} />
          <View style={styles.blob2} />
        </View>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedTitle}>Check your email</Text>
            <Text style={styles.confirmedBody}>
              We sent you a confirmation link. Click it to activate your account and start your journey on Serene.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    )
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
            <Text style={styles.wordmark}>Serene</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Join Serene</Text>
                <Text style={styles.cardSubtitle}>Share what matters. Rest when you need to.</Text>
              </View>

              {/* Display name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>DISPLAY NAME</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="How you'll appear to others"
                  placeholderTextColor="rgba(245,240,232,0.22)"
                  keyboardAppearance="dark"
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>

              {/* Username */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>USERNAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    usernameStatus === 'taken' && styles.inputError,
                    usernameStatus === 'available' && styles.inputSuccess,
                  ]}
                  value={username}
                  onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="lowercase_only"
                  placeholderTextColor="rgba(245,240,232,0.22)"
                  keyboardAppearance="dark"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  returnKeyType="next"
                />
                {usernameStatus === 'checking' && (
                  <Text style={styles.hintNeutral}>Checking availability…</Text>
                )}
                {usernameStatus === 'available' && (
                  <Text style={styles.hintGood}>Username is available ✓</Text>
                )}
                {usernameStatus === 'taken' && (
                  <Text style={styles.hintError}>This username is taken.</Text>
                )}
                {usernameStatus === 'invalid' && username.length >= 3 && (
                  <Text style={styles.hintError}>
                    Lowercase letters, numbers and _ only (3–20 chars).
                  </Text>
                )}
              </View>

              {/* Email */}
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

              {/* Password + strength */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  placeholderTextColor="rgba(245,240,232,0.22)"
                  secureTextEntry
                  keyboardAppearance="dark"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                {password.length > 0 && strength > 0 && (
                  <View style={styles.strengthRow}>
                    {STRENGTH_COLORS[strength as 1 | 2 | 3].map((color, i) => (
                      <View
                        key={i}
                        style={[styles.strengthBar, { backgroundColor: color }]}
                      />
                    ))}
                  </View>
                )}
              </View>

              {serverError && <Text style={styles.error}>{serverError}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
                onPress={handleSignUp}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#F5F0E8" size="small" />
                  : <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.footerLink}>Sign in</Text>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(78,122,68,0.12)',
    top: -70,
    left: -80,
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(74,138,181,0.07)',
    bottom: 60,
    right: -70,
  },
  blob3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(47,80,39,0.09)',
    top: 340,
    right: -40,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  wordmark: {
    fontSize: 44,
    fontStyle: 'italic',
    color: '#8ABD80',
    textAlign: 'center',
    marginBottom: 36,
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
  cardHeader: { gap: 4 },
  cardTitle: {
    fontSize: 22,
    color: 'rgba(245,240,232,0.85)',
    fontWeight: '300',
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.35)',
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
  inputError: {
    borderColor: 'rgba(212,136,58,0.5)',
  },
  inputSuccess: {
    borderColor: 'rgba(138,189,128,0.4)',
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  hintNeutral: { fontSize: 12, color: 'rgba(245,240,232,0.4)' },
  hintGood: { fontSize: 12, color: '#8ABD80' },
  hintError: { fontSize: 12, color: '#D4883A' },
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
  btnDisabled: { opacity: 0.45 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: 13, color: 'rgba(245,240,232,0.35)' },
  footerLink: { fontSize: 13, color: '#8ABD80' },
  confirmedCard: {
    backgroundColor: 'rgba(78,122,68,0.12)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(78,122,68,0.2)',
    gap: 12,
  },
  confirmedTitle: {
    fontSize: 22,
    color: '#F5F0E8',
    fontWeight: '300',
  },
  confirmedBody: {
    fontSize: 15,
    color: 'rgba(245,240,232,0.6)',
    lineHeight: 24,
  },
})
