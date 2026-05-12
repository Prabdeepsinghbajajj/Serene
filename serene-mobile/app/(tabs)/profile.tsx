import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Lock, Settings } from 'lucide-react-native'
import { apiFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getInitials, formatRelativeTime } from '@/lib/utils'

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3)

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ProfileData {
  profile: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    bio: string | null
    personality_type: string | null
    created_at: string
  }
  private_stats?: {
    follower_count: number
    following_count: number
    post_count: number
  }
  is_own_profile: boolean
}

interface ProfilePost {
  id: string
  content_type: string
  media_urls: string[]
  caption: string | null
  mood_tag: string | null
  created_at: string
}

interface PostsResponse {
  posts: ProfilePost[]
  has_more: boolean
}

/* -------------------------------------------------------------------------- */
/*  Mood emoji map                                                             */
/* -------------------------------------------------------------------------- */

const MOOD_EMOJI: Record<string, string> = {
  joyful: '☀️',
  grateful: '🌿',
  peaceful: '🌊',
  reflective: '🌙',
  creative: '✨',
  adventurous: '🏔️',
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                     */
/* -------------------------------------------------------------------------- */

function Avatar({ uri, name, size = 80 }: { uri: string | null; name: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    )
  }
  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.28 }]}>
        {getInitials(name)}
      </Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Post grid cell                                                             */
/* -------------------------------------------------------------------------- */

function GridCell({ post }: { post: ProfilePost }) {
  const hasMedia = post.media_urls && post.media_urls.length > 0

  if (hasMedia) {
    return (
      <Image
        source={{ uri: post.media_urls[0] }}
        style={styles.gridCell}
        resizeMode="cover"
      />
    )
  }

  return (
    <View style={[styles.gridCell, styles.gridCellText]}>
      <Text style={styles.gridCellEmoji}>
        {post.mood_tag ? MOOD_EMOJI[post.mood_tag] ?? '🌿' : '🌿'}
      </Text>
      {post.caption ? (
        <Text style={styles.gridCellCaption} numberOfLines={3}>
          {post.caption}
        </Text>
      ) : null}
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Header component (used as ListHeaderComponent)                            */
/* -------------------------------------------------------------------------- */

function ProfileHeader({
  data,
  postsLoading,
}: {
  data: ProfileData
  postsLoading: boolean
}) {
  const { profile, private_stats } = data

  return (
    <View style={styles.headerSection}>
      {/* Avatar + display name */}
      <View style={styles.avatarRow}>
        <Avatar uri={profile.avatar_url} name={profile.display_name} size={80} />
        <View style={styles.avatarMeta}>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.personality_type && (
            <Text style={styles.personalityType}>{profile.personality_type}</Text>
          )}
        </View>
      </View>

      {/* Bio */}
      {profile.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : null}

      {/* Private stats with lock icon */}
      {private_stats && (
        <View style={styles.statsRow}>
          <Lock size={12} color="rgba(245,240,232,0.2)" strokeWidth={1.5} />
          <Text style={styles.statItem}>
            <Text style={styles.statNumber}>{private_stats.follower_count}</Text>
            <Text style={styles.statLabel}> followers</Text>
          </Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statItem}>
            <Text style={styles.statNumber}>{private_stats.following_count}</Text>
            <Text style={styles.statLabel}> following</Text>
          </Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statItem}>
            <Text style={styles.statNumber}>{private_stats.post_count}</Text>
            <Text style={styles.statLabel}> posts</Text>
          </Text>
        </View>
      )}

      <View style={styles.divider} />
      {postsLoading && <ActivityIndicator color="#8ABD80" style={{ marginVertical: 16 }} />}
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Profile screen                                                             */
/* -------------------------------------------------------------------------- */

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const username =
        (user.user_metadata?.username as string | undefined) ??
        (await (async () => {
          const { data } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single()
          return data?.username as string | undefined
        })())

      if (!username) throw new Error('Username not found')

      const data = await apiFetch<ProfileData>(`/api/profile/${username}`)
      setProfileData(data)

      setPostsLoading(true)
      const postsData = await apiFetch<PostsResponse>(
        `/api/profile/${username}/posts?page=1`
      )
      setPosts(postsData.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile.')
    } finally {
      setIsLoading(false)
      setPostsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color="#8ABD80" size="large" />
      </View>
    )
  }

  if (error || !profileData) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>{error ?? 'Profile not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity hitSlop={12}>
          <Settings size={20} color="rgba(245,240,232,0.3)" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        renderItem={({ item }) => <GridCell post={item} />}
        ListHeaderComponent={
          <ProfileHeader data={profileData} postsLoading={postsLoading} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsText}>No posts yet</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A18',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#F5F0E8',
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: 1,
  },

  /* Header section */
  headerSection: {
    padding: 20,
    paddingBottom: 0,
    gap: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarFallback: {
    backgroundColor: 'rgba(78,122,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '600',
    color: '#8ABD80',
  },
  avatarMeta: {
    flex: 1,
    gap: 3,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#F5F0E8',
  },
  username: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.35)',
  },
  personalityType: {
    fontSize: 11,
    color: 'rgba(138,189,128,0.55)',
    textTransform: 'capitalize',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.5)',
    lineHeight: 21,
    fontWeight: '300',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    fontSize: 13,
  },
  statNumber: {
    fontWeight: '600',
    color: 'rgba(245,240,232,0.65)',
  },
  statLabel: {
    color: 'rgba(245,240,232,0.3)',
  },
  statDivider: {
    color: 'rgba(245,240,232,0.15)',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
    marginBottom: 2,
    marginHorizontal: -20,
  },

  /* Grid */
  gridCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: '#1A1A18',
  },
  gridCellText: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  gridCellEmoji: {
    fontSize: 22,
  },
  gridCellCaption: {
    fontSize: 9,
    color: 'rgba(245,240,232,0.35)',
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Empty / error */
  emptyPosts: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPostsText: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.2)',
  },
  errorText: {
    fontSize: 14,
    color: '#D4883A',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,136,58,0.3)',
  },
  retryText: {
    fontSize: 14,
    color: '#D4883A',
  },
})
