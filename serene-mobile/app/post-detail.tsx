import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import type { FeedPost } from '@/types/feed'

const { width } = Dimensions.get('window')

const MOOD_EMOJI: Record<string, string> = {
  joyful: '☀️',
  grateful: '🌿',
  peaceful: '🌊',
  reflective: '🌙',
  creative: '✨',
  adventurous: '🏔️',
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>()
  const router = useRouter()
  const [post, setPost] = useState<FeedPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) return
    apiFetch<{ post: FeedPost }>(`/api/posts/${postId}`)
      .then((data) => setPost(data.post))
      .catch(() => setError('Could not load this post.'))
      .finally(() => setLoading(false))
  }, [postId])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8ABD80" size="large" />
      </View>
    )
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Post not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const isTextPost = post.content_type === 'text' || post.content_type === 'slow_post'
  const hasMedia = post.media_urls && post.media_urls.length > 0

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Creator row */}
        <View style={styles.creatorRow}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorInitials}>
              {getInitials(post.creator.display_name)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.creatorName}>{post.creator.display_name}</Text>
          </View>
          {post.mood_tag && (
            <View style={styles.moodPill}>
              <Text style={styles.moodPillText}>
                {MOOD_EMOJI[post.mood_tag] ?? ''} {post.mood_tag}
              </Text>
            </View>
          )}
        </View>

        {/* Photo */}
        {hasMedia && (
          <Image
            source={{ uri: post.media_urls![0] }}
            style={{ width, height: width }}
            resizeMode="cover"
          />
        )}

        {/* Text / slow post body */}
        {isTextPost && post.caption ? (
          <View style={styles.textBody}>
            <Text style={styles.textBodyContent}>{post.caption}</Text>
          </View>
        ) : null}

        {/* Photo caption */}
        {!isTextPost && post.caption ? (
          <Text style={styles.caption}>{post.caption}</Text>
        ) : null}

        {/* Companion note */}
        {post.ai_companion_message ? (
          <View style={styles.companionNote}>
            <Text style={styles.companionLabel}>✦ A NOTE FROM YOUR COMPANION</Text>
            <Text style={styles.companionBody}>{post.ai_companion_message}</Text>
          </View>
        ) : null}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A18' },
  center: {
    flex: 1,
    backgroundColor: '#1A1A18',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBack: {
    color: 'rgba(245,240,232,0.5)',
    fontSize: 16,
  },
  errorText: {
    color: 'rgba(245,240,232,0.5)',
    fontSize: 16,
    textAlign: 'center',
  },
  backLink: {
    color: '#8ABD80',
    fontSize: 14,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(78,122,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInitials: {
    color: '#8ABD80',
    fontSize: 13,
    fontWeight: '700',
  },
  creatorName: {
    color: 'rgba(245,240,232,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  moodPill: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moodPillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  textBody: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    margin: 12,
    borderRadius: 12,
    padding: 20,
  },
  textBodyContent: {
    color: 'rgba(245,240,232,0.75)',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    fontWeight: '300',
  },
  caption: {
    color: 'rgba(245,240,232,0.6)',
    fontSize: 15,
    fontWeight: '300',
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  companionNote: {
    backgroundColor: 'rgba(78,122,68,0.12)',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(138,189,128,0.4)',
    gap: 6,
  },
  companionLabel: {
    color: 'rgba(138,189,128,0.5)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  companionBody: {
    color: '#A8D89E',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '300',
  },
})
