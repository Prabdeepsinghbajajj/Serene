import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { apiFetch } from '@/lib/api'
import { getInitials } from '@/lib/utils'

interface UserItem {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  is_following: boolean
}

interface FollowersResponse {
  followers?: UserItem[]
  following?: UserItem[]
}

export default function FollowersScreen() {
  const { username, type } = useLocalSearchParams<{ username: string; type: string }>()
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username || !type) return
    const endpoint = type === 'followers'
      ? `/api/profile/${username}/followers`
      : `/api/profile/${username}/following`

    apiFetch<FollowersResponse>(endpoint)
      .then((data) => {
        setUsers(type === 'followers' ? (data.followers ?? []) : (data.following ?? []))
      })
      .catch((e) => {
        if (__DEV__) console.error('[followers] load error:', e)
      })
      .finally(() => setLoading(false))
  }, [username, type])

  async function handleFollow(userId: string, isFollowing: boolean) {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, is_following: !isFollowing } : u)
    )
    try {
      await apiFetch('/api/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        body: JSON.stringify({ user_id: userId }),
      })
    } catch (e) {
      if (__DEV__) console.error('[followers] follow error:', e)
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, is_following: isFollowing } : u)
      )
    }
  }

  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.headerBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#8ABD80" size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                {item.avatar_url ? (
                  <Image
                    source={{ uri: item.avatar_url }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(item.display_name)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={styles.displayName}>{item.display_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>

              <TouchableOpacity
                onPress={() => void handleFollow(item.id, item.is_following)}
                style={[
                  styles.followBtn,
                  item.is_following && styles.followBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.followBtnText,
                  item.is_following && styles.followBtnTextActive,
                ]}>
                  {item.is_following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A18' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBack: {
    color: 'rgba(245,240,232,0.5)',
    fontSize: 20,
  },
  headerTitle: {
    color: '#F5F0E8',
    fontSize: 17,
    fontWeight: '500',
  },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    color: 'rgba(245,240,232,0.3)',
    fontSize: 15,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: 'rgba(78,122,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#8ABD80',
    fontSize: 15,
    fontWeight: '700',
  },
  displayName: {
    color: 'rgba(245,240,232,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  username: {
    color: 'rgba(245,240,232,0.35)',
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#4E7A44',
    borderWidth: 1,
    borderColor: '#4E7A44',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  followBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  followBtnTextActive: {
    color: 'rgba(245,240,232,0.5)',
  },
})
