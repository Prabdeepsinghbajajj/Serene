import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import type { PersonalityType } from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Step data                                                                   */
/* -------------------------------------------------------------------------- */

const PERSONALITY_OPTIONS: {
  emoji: string
  label: string
  description: string
  value: PersonalityType
}[] = [
  { emoji: '🌿', label: 'Creating & sharing', description: 'Art, writing, music', value: 'creative' },
  { emoji: '🍃', label: 'Nature & outdoors', description: 'Walks, gardens, sky', value: 'nature_lover' },
  { emoji: '🏡', label: 'Home & family', description: 'Warmth, togetherness', value: 'homebody' },
  { emoji: '📚', label: 'Learning & ideas', description: 'Books, questions, growth', value: 'intellectual' },
  { emoji: '🌍', label: 'Adventure & travel', description: 'New places, new people', value: 'adventurer' },
  { emoji: '🤍', label: 'Caring for others', description: 'Support, empathy, community', value: 'caregiver' },
]

const TIME_OPTIONS: { emoji: string; label: string; value: string }[] = [
  { emoji: '🌅', label: 'Mornings', value: 'morning' },
  { emoji: '☀️', label: 'Afternoons', value: 'afternoon' },
  { emoji: '🌙', label: 'Evenings', value: 'evening' },
  { emoji: '✨', label: 'It varies', value: 'varies' },
]

/* -------------------------------------------------------------------------- */
/*  Screen                                                                      */
/* -------------------------------------------------------------------------- */

export default function OnboardingScreen() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [personality, setPersonality] = useState<PersonalityType | null>(null)
  const [timePreference, setTimePreference] = useState<string | null>(null)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const dot1W = useRef(new Animated.Value(24)).current
  const dot2W = useRef(new Animated.Value(8)).current
  const dot3W = useRef(new Animated.Value(8)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dot1W, { toValue: step === 1 ? 24 : 8, useNativeDriver: false }),
      Animated.spring(dot2W, { toValue: step === 2 ? 24 : 8, useNativeDriver: false }),
      Animated.spring(dot3W, { toValue: step === 3 ? 24 : 8, useNativeDriver: false }),
    ]).start()
  }, [step, dot1W, dot2W, dot3W])

  function goToStep(next: 1 | 2 | 3) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setStep(next)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    })
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      setSaveError('Camera roll permission is needed to pick a photo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
      setSaveError(null)
    }
  }

  async function handleFinish(skipAvatar = false) {
    setSaving(true)
    setSaveError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let avatarUrl: string | null = null

      if (!skipAvatar && avatarUri) {
        const ext = avatarUri.split('.').pop()?.split('?')[0] ?? 'jpg'
        const path = `${user.id}/avatar.${ext}`

        // Fetch the local file as a blob and upload
        const response = await fetch(avatarUri)
        const blob = await response.blob()

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }

      const { error: userError } = await supabase
        .from('users')
        .update({
          personality_type: personality,
          onboarding_completed: true,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', user.id)
      if (userError) throw userError

      const { error: profileError } = await supabase
        .from('personality_profiles')
        .update({ time_preferences: { preferred_time: timePreference } })
        .eq('user_id', user.id)
      if (profileError) throw profileError

      router.replace('/(tabs)/')
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
      setSaving(false)
    }
  }

  /* ---- Step dots (animated pill) ---- */
  const dots = (
    <View style={styles.dots}>
      {([dot1W, dot2W, dot3W] as Animated.Value[]).map((widthAnim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { width: widthAnim },
            (i + 1) === step ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  )

  /* ---- Back button ---- */
  const backBtn = step > 1 ? (
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => goToStep((step - 1) as 1 | 2 | 3)}
    >
      <Text style={styles.backBtnText}>← Back</Text>
    </TouchableOpacity>
  ) : null

  /* ---- Selection card factory ---- */
  function SelectCard({
    emoji, label, description, selected, onPress,
  }: {
    emoji: string
    label: string
    description?: string
    selected: boolean
    onPress: () => void
  }) {
    return (
      <TouchableOpacity
        style={[styles.selectCard, selected && styles.selectCardActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {selected && (
          <View style={styles.checkBadge}>
            <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
          </View>
        )}
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
        {description && <Text style={styles.cardDesc}>{description}</Text>}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {dots}

        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ---- STEP 1: Personality ---- */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Tell us a little about yourself</Text>
                <Text style={styles.stepSubtitle}>
                  Your companion will use this to understand you — not to target you. This stays with you.
                </Text>
              </View>

              <View style={styles.grid}>
                {PERSONALITY_OPTIONS.map((opt) => (
                  <SelectCard
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    description={opt.description}
                    selected={personality === opt.value}
                    onPress={() => setPersonality(opt.value)}
                  />
                ))}
              </View>

              {personality && (
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() => goToStep(2)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ---- STEP 2: Time preference ---- */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {backBtn}
              <Text style={styles.stepTitle}>
                When do you usually have time to yourself?
              </Text>

              <View style={styles.grid}>
                {TIME_OPTIONS.map((opt) => (
                  <SelectCard
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={timePreference === opt.value}
                    onPress={() => setTimePreference(opt.value)}
                  />
                ))}
              </View>

              {timePreference && (
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() => goToStep(3)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ---- STEP 3: Avatar ---- */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              {backBtn}
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Add a photo — or skip for now</Text>
                <Text style={styles.stepSubtitle}>
                  You can always add one later from your profile.
                </Text>
              </View>

              {/* Avatar picker */}
              <View style={styles.avatarRow}>
                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={pickAvatar}
                  activeOpacity={0.8}
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>Tap to add photo</Text>
                  )}
                </TouchableOpacity>
              </View>

              {saveError && (
                <Text style={styles.saveError}>{saveError}</Text>
              )}

              <View style={styles.finishGroup}>
                <TouchableOpacity
                  style={[styles.continueBtn, saving && styles.btnDisabled]}
                  onPress={() => handleFinish(false)}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator color="#F5F0E8" size="small" />
                          <Text style={styles.continueBtnText}>Setting up your space…</Text>
                        </View>
                      )
                    : <Text style={styles.continueBtnText}>Finish</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => handleFinish(true)}
                  disabled={saving}
                >
                  <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A18' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 36,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: '#8ABD80' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.15)' },

  backBtn: { marginBottom: 20 },
  backBtnText: { fontSize: 14, color: 'rgba(245,240,232,0.35)' },

  stepContainer: { gap: 28 },
  stepHeader: { gap: 8 },
  stepTitle: {
    fontSize: 28,
    color: '#F5F0E8',
    fontWeight: '300',
    lineHeight: 36,
  },
  stepSubtitle: {
    fontSize: 15,
    color: 'rgba(245,240,232,0.45)',
    lineHeight: 22,
  },

  /* 2-column grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectCard: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  selectCardActive: {
    backgroundColor: 'rgba(78,122,68,0.15)',
    borderColor: 'rgba(138,189,128,0.4)',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4E7A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 24, marginBottom: 4 },
  cardLabel: {
    fontSize: 13,
    color: '#F5F0E8',
    fontWeight: '500',
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 11,
    color: 'rgba(245,240,232,0.4)',
    lineHeight: 15,
  },

  continueBtn: {
    backgroundColor: '#4E7A44',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#F5F0E8',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.55 },

  avatarRow: { alignItems: 'center' },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(138,189,128,0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.35)',
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  saveError: {
    fontSize: 14,
    color: '#D4883A',
    textAlign: 'center',
  },
  finishGroup: { gap: 12 },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.3)',
  },
})
