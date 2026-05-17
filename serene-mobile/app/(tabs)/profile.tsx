import { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Lock, Settings } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'

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
  const [imgError, setImgError] = useState(false)

  const fallback = (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'rgba(78,122,68,0.3)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: 'rgba(138,189,128,0.3)',
      overflow: 'hidden' as const,
    }}>
      <Text style={{ color: '#8ABD80', fontSize: size * 0.32, fontWeight: '600' }}>
        {getInitials(name)}
      </Text>
    </View>
  )

  if (uri && !imgError) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: 'rgba(138,189,128,0.3)',
        }}
        contentFit="cover"
        onError={() => {
          console.log('Avatar failed to load:', uri)
          setImgError(true)
        }}
      />
    )
  }
  return fallback
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
        contentFit="cover"
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
  console.log('Profile avatar_url:', profile?.avatar_url)

  return (
    <View style={styles.headerSection}>
      {/* Avatar centered above name */}
      <View style={styles.avatarBlock}>
        <Avatar key={profile.avatar_url ?? 'no-avatar'} uri={profile.avatar_url} name={profile.display_name} size={80} />
        <Text style={styles.displayName}>{profile.display_name}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.personality_type && (
          <Text style={styles.personalityType}>{profile.personality_type}</Text>
        )}
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
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSettingsPress() {
    Alert.alert(
      'Settings',
      '',
      [
        {
          text: 'Edit profile',
          onPress: () => router.push('/edit-profile'),
        },
        {
          text: 'Wellness settings',
          onPress: () => Alert.alert(
            'Wellness settings',
            'Session reminders and daily limits can be adjusted on serene.network/settings',
            [{ text: 'OK' }]
          ),
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Sign out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: async () => {
                    await supabase.auth.signOut()
                    router.replace('/(auth)/login')
                  },
                },
              ]
            )
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    )
  }

  const usernameRef = useRef<string | null>(null)

  const resolveUsername = useCallback(async (): Promise<string> => {
    if (usernameRef.current) return usernameRef.current
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const uname =
      (user.user_metadata?.username as string | undefined) ??
      (await (async () => {
        const { data } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
        return data?.username as string | undefined
      })())
    if (!uname) throw new Error('Username not found')
    usernameRef.current = uname
    return uname
  }, [])

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const username = await resolveUsername()
      const data = await apiFetch<ProfileData>(`/api/profile/${username}`)
      setProfileData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile.')
    } finally {
      setIsLoading(false)
    }
  }, [resolveUsername])

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true)
    try {
      const username = await resolveUsername()
      const postsData = await apiFetch<PostsResponse>(
        `/api/profile/${username}/posts?page=1&t=${Date.now()}`
      )
      if (__DEV__) console.log('[profile] posts loaded:', postsData.posts?.length, postsData.posts?.map((p) => p.id))
      setPosts(postsData.posts ?? [])
    } catch (err) {
      if (__DEV__) console.error('[profile] posts load error:', err)
    } finally {
      setPostsLoading(false)
    }
  }, [resolveUsername])

  useFocusEffect(
    useCallback(() => {
      void AsyncStorage.removeItem('profile_updated')
      fetchProfileData()
      fetchPosts()
    }, [fetchProfileData, fetchPosts])
  )

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
        <TouchableOpacity style={styles.retryBtn} onPress={() => { void fetchProfileData(); void fetchPosts() }}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top bar — settings gear only, no title */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.settingsBtn}
          hitSlop={12}
          onPress={handleSettingsPress}
        >
          <Settings size={20} color="rgba(245,240,232,0.35)" strokeWidth={1.5} />
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
        refreshControl={
          <RefreshControl
            refreshing={postsLoading}
            onRefresh={() => { void fetchProfileData(); void fetchPosts() }}
            tintColor="#8ABD80"
            colors={['#8ABD80']}
          />
        }
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsEmoji}>🍃</Text>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingsBtn: {
    padding: 4,
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
    gap: 16,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
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
  displayName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#F5F0E8',
    marginTop: 4,
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
  },
  bio: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.5)',
    lineHeight: 21,
    fontWeight: '300',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 4,
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
    backgroundColor: 'rgba(78,122,68,0.12)',
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
    color: 'rgba(245,240,232,0.45)',
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Empty / error */
  emptyPosts: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyPostsEmoji: {
    fontSize: 32,
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
