import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PostCard from '@/components/PostCard'
import { apiFetch } from '@/lib/api'
import type { FeedPost } from '@/types/feed'

interface DiscoverResponse {
  posts: FeedPost[]
  refreshes_at: string | null
}

export default function DiscoverScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadDiscover() {
    setIsLoading(true)
    setError(null)
    apiFetch<DiscoverResponse>('/api/discover')
      .then((data) => {
        if (__DEV__) console.log('[discover] posts:', data.posts?.length, 'refreshes_at:', data.refreshes_at)
        setPosts(data.posts ?? [])
      })
      .catch((err) => {
        if (__DEV__) console.log('[discover] error:', err)
        setError('Could not load discoveries.')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadDiscover()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8ABD80" size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== item.id))}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Today's discoveries</Text>
            <Text style={styles.subheading}>Refreshes at midnight</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧭</Text>
            <Text style={styles.emptyTitle}>Nothing new today</Text>
            <Text style={styles.emptyBody}>
              Discover shows posts from people you don't follow yet. Follow more people or check back tomorrow for fresh picks.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadDiscover}>
              <Text style={styles.refreshBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          posts.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>🧭 That's today's discovery</Text>
            </View>
          ) : null
        }
      />
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
  },
  list: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F5F0E8',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 12,
    color: 'rgba(245,240,232,0.25)',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#F5F0E8',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.4)',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: 'rgba(245,240,232,0.2)',
    fontSize: 13,
    letterSpacing: 1,
  },
  errorText: {
    color: '#D4883A',
    fontSize: 14,
  },
  refreshBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(138,189,128,0.25)',
  },
  refreshBtnText: {
    fontSize: 13,
    color: '#8ABD80',
  },
})
