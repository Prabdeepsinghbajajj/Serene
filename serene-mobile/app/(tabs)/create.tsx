import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import { Camera, FileText, ImageIcon, X } from 'lucide-react-native'

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

type ContentType = 'photo' | 'text' | 'slow_post'
type MoodTag = 'joyful' | 'grateful' | 'peaceful' | 'reflective' | 'creative' | 'adventurous'

const MOODS: { tag: MoodTag; label: string; color: string; bg: string }[] = [
  { tag: 'joyful',      label: 'Joyful',      color: '#D4883A', bg: 'rgba(212,136,58,0.15)' },
  { tag: 'grateful',    label: 'Grateful',    color: '#8ABD80', bg: 'rgba(78,122,68,0.18)' },
  { tag: 'peaceful',    label: 'Peaceful',    color: '#A8C8E0', bg: 'rgba(74,138,181,0.18)' },
  { tag: 'reflective',  label: 'Reflective',  color: '#8ABD80', bg: 'rgba(47,80,39,0.25)' },
  { tag: 'creative',    label: 'Creative',    color: '#E8845A', bg: 'rgba(232,132,90,0.18)' },
  { tag: 'adventurous', label: 'Adventurous', color: '#A8C8E0', bg: 'rgba(74,138,181,0.22)' },
]

interface PostCreateResponse {
  post_id: string
  ai_companion_message: string
}

/* -------------------------------------------------------------------------- */
/*  Step indicator                                                             */
/* -------------------------------------------------------------------------- */

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.stepDots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i + 1 === step && styles.dotActive]}
        />
      ))}
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Create screen                                                              */
/* -------------------------------------------------------------------------- */

export default function CreateScreen() {
  const [step, setStep] = useState(1)
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [mood, setMood] = useState<MoodTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companionMessage, setCompanionMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep(1)
    setContentType(null)
    setMediaUri(null)
    setCaption('')
    setMood(null)
    setCompanionMessage(null)
    setError(null)
  }, [])

  /* ── Step 1: content type ── */

  const handleTypeSelect = (type: ContentType) => {
    setContentType(type)
    setStep(2)
  }

  /* ── Step 2: media / text ── */

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri)
    }
  }, [])

  const uploadMedia = useCallback(async (uri: string): Promise<string> => {
    const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg'
    const mimeType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`

    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id ?? 'unknown'
    const filePath = `${userId}/${Date.now()}.${ext}`

    const formData = new FormData()
    formData.append('file', { uri, name: `upload.${ext}`, type: mimeType } as unknown as Blob)

    const response = await fetch(
      `https://fjfdundcziicyxbrsvgs.supabase.co/storage/v1/object/posts/${filePath}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-upsert': 'true' },
        body: formData,
      }
    )
    if (!response.ok) {
      const err = await response.text()
      console.error('Upload error:', err)
      throw new Error('Upload failed. Please try again.')
    }
    return `https://fjfdundcziicyxbrsvgs.supabase.co/storage/v1/object/public/posts/${filePath}`
  }, [])

  /* ── Step 4: submit ── */

  const handleSubmit = useCallback(async () => {
    if (!contentType || !mood) return
    setIsSubmitting(true)
    setError(null)
    try {
      let mediaUrls: string[] = []
      if (mediaUri && contentType === 'photo') {
        const url = await uploadMedia(mediaUri)
        mediaUrls = [url]
      }

      const isTextPost = contentType === 'text' || contentType === 'slow_post'

      const data = await apiFetch<PostCreateResponse>('/api/creator/post', {
        method: 'POST',
        body: JSON.stringify({
          content_type: contentType,
          caption: isTextPost ? undefined : caption || undefined,
          text_content: isTextPost ? caption || undefined : undefined,
          media_urls: mediaUrls,
          mood_tag: mood,
        }),
      })
      setCompanionMessage(data.ai_companion_message)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }, [contentType, mood, mediaUri, caption, uploadMedia])

  /* ── Render ── */

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 && step < 4 ? (
          <TouchableOpacity onPress={() => setStep((s) => s - 1)} hitSlop={12}>
            <Text style={styles.backBtn}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>
          {step === 4 ? 'Shared' : 'Create'}
        </Text>
        <StepDots step={step} total={3} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: type ── */}
          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What are you sharing?</Text>
              <TouchableOpacity
                style={styles.typeCard}
                onPress={() => handleTypeSelect('photo')}
                activeOpacity={0.75}
              >
                <ImageIcon size={24} color="#8ABD80" strokeWidth={1.5} />
                <View style={styles.typeCardText}>
                  <Text style={styles.typeCardTitle}>Photo</Text>
                  <Text style={styles.typeCardDesc}>A moment captured</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.typeCard}
                onPress={() => handleTypeSelect('text')}
                activeOpacity={0.75}
              >
                <FileText size={24} color="#A8C8E0" strokeWidth={1.5} />
                <View style={styles.typeCardText}>
                  <Text style={styles.typeCardTitle}>Thought</Text>
                  <Text style={styles.typeCardDesc}>Words from the mind</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.typeCard}
                onPress={() => handleTypeSelect('slow_post')}
                activeOpacity={0.75}
              >
                <Camera size={24} color="#D4883A" strokeWidth={1.5} />
                <View style={styles.typeCardText}>
                  <Text style={styles.typeCardTitle}>Slow post</Text>
                  <Text style={styles.typeCardDesc}>Something to sit with</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: content ── */}
          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {contentType === 'photo' ? 'Add a photo' : 'Write something'}
              </Text>

              {contentType === 'photo' && (
                <>
                  <TouchableOpacity
                    style={[styles.mediaPicker, mediaUri && styles.mediaPickerFilled]}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    {mediaUri ? (
                      <>
                        <Image source={{ uri: mediaUri }} style={styles.mediaPreviewThumb} />
                        <TouchableOpacity
                          style={styles.mediaClear}
                          onPress={() => setMediaUri(null)}
                          hitSlop={8}
                        >
                          <X size={16} color="#F5F0E8" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} color="rgba(138,189,128,0.4)" strokeWidth={1.2} />
                        <Text style={styles.mediaPickerText}>Tap to choose a photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TextInput
                    style={styles.captionInput}
                    value={caption}
                    onChangeText={setCaption}
                    placeholder="Add a caption (optional)"
                    placeholderTextColor="rgba(245,240,232,0.2)"
                    maxLength={300}
                    multiline
                  />
                </>
              )}

              {(contentType === 'text' || contentType === 'slow_post') && (
                <TextInput
                  style={[styles.captionInput, styles.textPostInput]}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder={
                    contentType === 'slow_post'
                      ? 'Something to sit with…'
                      : "What's on your mind?"
                  }
                  placeholderTextColor="rgba(245,240,232,0.2)"
                  maxLength={500}
                  multiline
                  autoFocus
                />
              )}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  contentType === 'photo' && !mediaUri && styles.primaryBtnDisabled,
                ]}
                onPress={() => setStep(3)}
                disabled={contentType === 'photo' && !mediaUri}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: mood + preview ── */}
          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How does this feel?</Text>

              {/* Preview */}
              {mediaUri && (
                <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
              )}
              {(contentType === 'text' || contentType === 'slow_post') && caption ? (
                <View style={styles.textPreview}>
                  <Text style={styles.textPreviewBody}>{caption}</Text>
                </View>
              ) : null}

              {/* Mood grid */}
              <View style={styles.moodGrid}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m.tag}
                    style={[
                      styles.moodBtn,
                      { backgroundColor: m.bg },
                      mood === m.tag && { borderColor: m.color, borderWidth: 1.5 },
                    ]}
                    onPress={() => setMood(m.tag)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.moodBtnText, { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, (!mood || isSubmitting) && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={!mood || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#F5F0E8" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 4: success ── */}
          {step === 4 && (
            <View style={[styles.section, styles.successSection]}>
              <Text style={styles.successEmoji}>🌿</Text>
              <Text style={styles.successTitle}>Shared gently</Text>
              {companionMessage ? (
                <View style={styles.companionNote}>
                  <Text style={styles.companionLabel}>✦ A NOTE FROM YOUR COMPANION</Text>
                  <Text style={styles.companionBody}>{companionMessage}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 24 }]}
                onPress={reset}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Share another</Text>
              </TouchableOpacity>
            </View>
          )}
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
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#F5F0E8',
  },
  backBtn: {
    fontSize: 15,
    color: 'rgba(245,240,232,0.45)',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: {
    backgroundColor: '#8ABD80',
    width: 14,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(245,240,232,0.8)',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  typeCardText: { gap: 3 },
  typeCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(245,240,232,0.8)',
  },
  typeCardDesc: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.3)',
  },
  mediaPicker: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 10,
  },
  mediaPickerFilled: {
    borderStyle: 'solid',
    borderColor: 'rgba(138,189,128,0.2)',
  },
  mediaPickerText: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.25)',
  },
  mediaPreviewThumb: {
    width: '100%',
    height: '100%',
  },
  mediaClear: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F5F0E8',
    minHeight: 56,
    textAlignVertical: 'top',
  },
  textPostInput: {
    minHeight: 140,
    fontStyle: 'italic',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  moodBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  textPreview: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  textPreviewBody: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'rgba(245,240,232,0.75)',
    lineHeight: 26,
  },
  primaryBtn: {
    backgroundColor: '#4E7A44',
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 50,
  },
  primaryBtnDisabled: {
    opacity: 0.35,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F0E8',
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 13,
    color: '#D4883A',
    textAlign: 'center',
  },
  successSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  successEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F5F0E8',
    letterSpacing: 0.3,
  },
  companionNote: {
    backgroundColor: 'rgba(78,122,68,0.12)',
    borderRadius: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(138,189,128,0.4)',
    padding: 16,
    gap: 6,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  companionLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(138,189,128,0.5)',
  },
  companionBody: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#A8D89E',
    lineHeight: 22,
  },
})
