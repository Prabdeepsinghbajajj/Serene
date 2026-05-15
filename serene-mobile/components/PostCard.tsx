import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Leaf, MessageCircle } from 'lucide-react-native'
import type { FeedPost } from '@/types/feed'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'

/* -------------------------------------------------------------------------- */
/*  Mood pill                                                                   */
/* -------------------------------------------------------------------------- */

const MOOD_COLORS: Record<string, string> = {
  joyful: 'rgba(212,136,58,0.18)',
  grateful: 'rgba(78,122,68,0.18)',
  peaceful: 'rgba(74,138,181,0.18)',
  reflective: 'rgba(47,80,39,0.25)',
  creative: 'rgba(232,132,90,0.18)',
  adventurous: 'rgba(74,138,181,0.22)',
}

const MOOD_TEXT_COLORS: Record<string, string> = {
  joyful: '#D4883A',
  grateful: '#8ABD80',
  peaceful: '#A8C8E0',
  reflective: '#8ABD80',
  creative: '#E8845A',
  adventurous: '#A8C8E0',
}

function MoodPill({ mood }: { mood: string }) {
  return (
    <View style={[styles.moodPill, { backgroundColor: MOOD_COLORS[mood] ?? 'rgba(255,255,255,0.06)' }]}>
      <View style={[styles.moodDot, { backgroundColor: MOOD_TEXT_COLORS[mood] ?? 'rgba(245,240,232,0.3)' }]} />
      <Text style={[styles.moodText, { color: MOOD_TEXT_COLORS[mood] ?? 'rgba(245,240,232,0.5)' }]}>
        {mood}
      </Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                      */
/* -------------------------------------------------------------------------- */

function Avatar({ uri, name, isRecent }: { uri: string | null; name: string; isRecent: boolean }) {
  if (uri) {
    return (
      <View style={[styles.avatarOuter, isRecent && styles.avatarOuterActive]}>
        <Image source={{ uri }} style={styles.avatar} />
      </View>
    )
  }
  return (
    <View style={[styles.avatarFallback, isRecent && styles.avatarOuterActive]}>
      <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  PostCard                                                                    */
/* -------------------------------------------------------------------------- */

interface PostCardProps {
  post: FeedPost
  onResonance?: (postId: string) => void
  onComment?: (postId: string) => void
  onDeleted?: () => void
}

export default function PostCard({ post, onResonance, onComment, onDeleted }: PostCardProps) {
  const { creator, mood_tag, created_at, media_urls, content_type, caption, ai_companion_message, has_resonated } = post

  const mountAnim = useRef(new Animated.Value(0)).current
  const imageAnim = useRef(new Animated.Value(0)).current
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [mountAnim])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? '')
    })
  }, [])

  const hasMedia = media_urls && media_urls.length > 0
  const isText = content_type === 'text' || content_type === 'slow_post'
  const isRecent = Date.now() - new Date(created_at).getTime() < 2 * 60 * 60 * 1000
  const isOwnPost = !!currentUserId && post.user_id === currentUserId

  function handleResonance() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onResonance?.(post.id)
  }

  async function handleDeletePost() {
    try {
      await apiFetch<{ success: boolean }>(`/api/posts/${post.id}`, { method: 'DELETE' })
      onDeleted?.()
    } catch {
      Alert.alert('Error', 'Could not delete post. Please try again.')
    }
  }

  function handleLongPress() {
    if (!isOwnPost) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    Alert.alert(
      'Post options',
      '',
      [
        {
          text: 'Delete post',
          style: 'destructive',
          onPress: () => void handleDeletePost(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    )
  }

  return (
    <Animated.View
      style={{
        opacity: mountAnim,
        transform: [{
          translateY: mountAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity activeOpacity={1} onLongPress={handleLongPress} delayLongPress={500}>
      <View style={styles.card}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Avatar uri={creator.avatar_url} name={creator.display_name} isRecent={isRecent} />

          <View style={styles.headerMeta}>
            <Text style={styles.displayName} numberOfLines={1}>
              {creator.display_name}
            </Text>
            {mood_tag && <MoodPill mood={mood_tag} />}
          </View>

          <Text style={styles.timestamp}>{formatRelativeTime(created_at)}</Text>
        </View>

        {/* ── Media ── */}
        {hasMedia && (
          <Animated.Image
            source={{ uri: media_urls[0] }}
            style={[styles.media, { opacity: imageAnim }]}
            resizeMode="cover"
            accessibilityLabel="Post image"
            onLoad={() =>
              Animated.timing(imageAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }).start()
            }
          />
        )}

        {/* ── Text content (text / slow_post) ── */}
        {isText && caption && (
          <View style={styles.textContent}>
            <Text style={styles.textContentBody}>{caption}</Text>
          </View>
        )}

        {/* ── Caption (for media posts) ── */}
        {!isText && caption && (
          <Text style={styles.caption}>{caption}</Text>
        )}

        {/* ── Companion note ── */}
        {ai_companion_message && (
          <View style={styles.companionNote}>
            <Text style={styles.companionLabel}>✦ A NOTE FROM YOUR COMPANION</Text>
            <Text style={styles.companionMessage}>{ai_companion_message}</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleResonance}
            activeOpacity={0.7}
            accessibilityLabel={has_resonated ? 'Remove resonance' : 'Resonate with post'}
            accessibilityRole="button"
          >
            <Leaf
              size={20}
              color={has_resonated ? '#8ABD80' : 'rgba(245,240,232,0.3)'}
              fill={has_resonated ? 'rgba(138,189,128,0.3)' : 'transparent'}
              strokeWidth={1.8}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComment?.(post.id)}
            activeOpacity={0.7}
            accessibilityLabel="Comment on post"
            accessibilityRole="button"
          >
            <MessageCircle
              size={20}
              color="rgba(245,240,232,0.3)"
              strokeWidth={1.8}
            />
          </TouchableOpacity>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  avatarOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOuterActive: {
    borderColor: 'rgba(138,189,128,0.55)',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(78,122,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8ABD80',
  },
  headerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(245,240,232,0.7)',
    flexShrink: 1,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(245,240,232,0.25)',
  },

  /* Mood pill */
  moodPill: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  moodText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* Media */
  media: {
    width: '100%',
    height: 220,
  },

  /* Text content */
  textContent: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    margin: 12,
    padding: 16,
  },
  textContentBody: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'rgba(245,240,232,0.8)',
    lineHeight: 26,
  },

  /* Caption */
  caption: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(245,240,232,0.45)',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    lineHeight: 21,
  },

  /* Companion note */
  companionNote: {
    backgroundColor: 'rgba(78,122,68,0.12)',
    marginHorizontal: 12,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(138,189,128,0.4)',
    borderRadius: 10,
    padding: 12,
    gap: 5,
  },
  companionLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(138,189,128,0.5)',
  },
  companionMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#A8D89E',
    lineHeight: 20,
  },

  /* Actions */
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
})
