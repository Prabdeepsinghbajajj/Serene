import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { Leaf, MessageCircle, Send } from 'lucide-react-native'
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
  const [imgError, setImgError] = useState(false)

  if (uri && !imgError) {
    return (
      <View style={[styles.avatarOuter, isRecent && styles.avatarOuterActive]}>
        <ExpoImage
          source={{ uri }}
          style={styles.avatar}
          contentFit="cover"
          onError={() => setImgError(true)}
        />
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
/*  Comment types                                                               */
/* -------------------------------------------------------------------------- */

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

/* -------------------------------------------------------------------------- */
/*  PostCard                                                                    */
/* -------------------------------------------------------------------------- */

interface PostCardProps {
  post: FeedPost
  onResonance?: (postId: string) => void
  onDeleted?: () => void
}

export default function PostCard({ post, onResonance, onDeleted }: PostCardProps) {
  const { creator, mood_tag, created_at, media_urls, content_type, caption, ai_companion_message, has_resonated } = post

  const mountAnim = useRef(new Animated.Value(0)).current
  const imageAnim = useRef(new Animated.Value(0)).current
  const [currentUserId, setCurrentUserId] = useState('')

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isPosting, setIsPosting] = useState(false)

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

  async function fetchComments() {
    setCommentsLoading(true)
    try {
      const data = await apiFetch<{ comments: Comment[] }>(`/api/comments?post_id=${post.id}`)
      setComments(data.comments ?? [])
    } catch {
      // keep existing comments
    } finally {
      setCommentsLoading(false)
    }
  }

  function handleCommentToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    if (!commentsOpen) {
      setCommentsOpen(true)
      void fetchComments()
    } else {
      setCommentsOpen(false)
    }
  }

  async function handlePostComment() {
    const content = commentText.trim().slice(0, 500)
    if (!content || isPosting) return
    setIsPosting(true)
    setCommentText('')
    const optimisticId = `opt-${Date.now()}`
    const optimistic: Comment = {
      id: optimisticId,
      content,
      created_at: new Date().toISOString(),
      user: { id: currentUserId, display_name: '...', avatar_url: null },
    }
    setComments((prev) => [...prev, optimistic])
    try {
      const data = await apiFetch<{ comment: Comment }>('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ post_id: post.id, content }),
      })
      setComments((prev) => prev.map((c) => (c.id === optimisticId ? data.comment : c)))
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimisticId))
      setCommentText(content)
    } finally {
      setIsPosting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    const prev = comments
    setComments((c) => c.filter((x) => x.id !== commentId))
    try {
      await apiFetch('/api/comments', {
        method: 'DELETE',
        body: JSON.stringify({ comment_id: commentId }),
      })
    } catch {
      setComments(prev)
    }
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
            onPress={handleCommentToggle}
            activeOpacity={0.7}
            accessibilityLabel={commentsOpen ? 'Close comments' : 'Open comments'}
            accessibilityRole="button"
          >
            <MessageCircle
              size={20}
              color={commentsOpen ? '#8ABD80' : 'rgba(245,240,232,0.3)'}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
        </View>

        {/* ── Comment section ── */}
        {commentsOpen && (
          <View style={styles.commentSection}>
            {/* Loading */}
            {commentsLoading && comments.length === 0 && (
              <ActivityIndicator color="#8ABD80" size="small" style={{ paddingVertical: 16 }} />
            )}

            {/* Empty */}
            {!commentsLoading && comments.length === 0 && (
              <Text style={styles.noComments}>Be the first to reply</Text>
            )}

            {/* Comment list */}
            {comments.map((c) => {
              const isOwn = !!currentUserId && c.user.id === currentUserId
              return (
                <View key={c.id} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    {c.user.avatar_url ? (
                      <ExpoImage
                        source={{ uri: c.user.avatar_url }}
                        style={styles.commentAvatarImg}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.commentAvatarInitial}>
                        {c.user.display_name.slice(0, 1).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentAuthor}>{c.user.display_name}</Text>
                    <Text style={styles.commentText}>{c.content}</Text>
                  </View>
                  {isOwn && !c.id.startsWith('opt-') && (
                    <TouchableOpacity
                      onPress={() => void handleDeleteComment(c.id)}
                      hitSlop={8}
                      style={styles.commentDeleteBtn}
                    >
                      <Text style={styles.commentDeleteText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            })}

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentInputField}
                  placeholder="Add a reply…"
                  placeholderTextColor="rgba(245,240,232,0.2)"
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={() => void handlePostComment()}
                  blurOnSubmit={false}
                  editable={!isPosting}
                />
                <TouchableOpacity
                  onPress={() => void handlePostComment()}
                  disabled={!commentText.trim() || isPosting}
                  style={[
                    styles.commentSendBtn,
                    (!commentText.trim() || isPosting) && styles.commentSendBtnDisabled,
                  ]}
                  accessibilityLabel="Send reply"
                >
                  {isPosting ? (
                    <ActivityIndicator size="small" color="#8ABD80" />
                  ) : (
                    <Send size={16} color="#8ABD80" strokeWidth={1.8} />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
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

  /* Comment section */
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingBottom: 4,
  },
  noComments: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(245,240,232,0.25)',
    paddingVertical: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(78,122,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  commentAvatarImg: {
    width: 24,
    height: 24,
  },
  commentAvatarInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8ABD80',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(245,240,232,0.65)',
  },
  commentText: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(245,240,232,0.55)',
    lineHeight: 19,
  },
  commentDeleteBtn: {
    paddingLeft: 8,
    paddingTop: 2,
  },
  commentDeleteText: {
    fontSize: 11,
    color: 'rgba(245,240,232,0.2)',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  commentInputField: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(245,240,232,0.7)',
    paddingVertical: 6,
  },
  commentSendBtn: {
    padding: 6,
  },
  commentSendBtnDisabled: {
    opacity: 0.3,
  },
})
