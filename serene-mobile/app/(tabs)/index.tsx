import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import PostCard from '@/components/PostCard'
import { apiFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { FeedPost, FeedResponse } from '@/types/feed'

/* -------------------------------------------------------------------------- */
/*  Daily limit screen                                                          */
/* -------------------------------------------------------------------------- */

function DailyLimitScreen() {
  return (
    <View style={styles.fullCenter}>
      <Text style={styles.limitEmoji}>🌿</Text>
      <Text style={styles.limitTitle}>You've seen everything from today.</Text>
      <Text style={styles.limitSubtitle}>Good things are waiting tomorrow.</Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <View style={styles.fullCenter}>
      <Text style={styles.emptyEmoji}>🍃</Text>
      <Text style={styles.emptyTitle}>Your feed is quiet</Text>
      <Text style={styles.emptySubtitle}>
        Follow some people to fill your space.
      </Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Feed screen                                                                 */
/* -------------------------------------------------------------------------- */

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [dailyLimitReached, setDailyLimitReached] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeed = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const data = await apiFetch<FeedResponse>(`/api/feed?page=${pageNum}`)

      if (data.daily_limit_reached) {
        setDailyLimitReached(true)
        setPosts([])
        return
      }

      setPosts((prev) => replace ? data.posts : [...prev, ...data.posts])
      setPage(pageNum)
      setHasMore(data.has_more)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    }
  }, [])

  /* Refresh on focus (covers initial mount + returning to tab after posting) */
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true)
      fetchFeed(1, true).finally(() => setIsLoading(false))
    }, [fetchFeed])
  )

  /* Pull to refresh */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setDailyLimitReached(false)
    await fetchFeed(1, true)
    setIsRefreshing(false)
  }, [fetchFeed])

  /* Load more */
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    await fetchFeed(page + 1, false)
    setIsLoadingMore(false)
  }, [fetchFeed, hasMore, isLoadingMore, page])

  /* Resonance toggle (optimistic) */
  const handleResonance = useCallback(async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, has_resonated: !p.has_resonated } : p
      )
    )
    try {
      await apiFetch('/api/resonance', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId }),
      })
    } catch {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, has_resonated: !p.has_resonated } : p
        )
      )
    }
  }, [])

  /* ---- Render states ---- */

  if (isLoading) {
    return (
      <View style={[styles.root, styles.fullCenter]}>
        <ActivityIndicator color="#8ABD80" size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.root, styles.fullCenter]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setIsLoading(true)
            fetchFeed(1, true).finally(() => setIsLoading(false))
          }}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (dailyLimitReached) {
    return (
      <SafeAreaView style={styles.root}>
        <DailyLimitScreen />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>Serene</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onResonance={handleResonance}
            onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== item.id))}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8ABD80"
            colors={['#8ABD80']}
          />
        }
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={
          posts.length > 0 ? (
            <View style={styles.footer}>
              {isLoadingMore ? (
                <ActivityIndicator color="#8ABD80" />
              ) : hasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.endText}>
                  You're all caught up for now.
                </Text>
              )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLogo: {
    fontSize: 22,
    color: '#8ABD80',
    fontWeight: '300',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(78,122,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(138,189,128,0.2)',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#8ABD80',
    fontWeight: '500',
  },
  endText: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.25)',
  },

  /* Full-screen centred states */
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  limitEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  limitTitle: {
    fontSize: 18,
    color: '#F5F0E8',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 26,
  },
  limitSubtitle: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.4)',
    textAlign: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    color: 'rgba(245,240,232,0.6)',
    fontWeight: '300',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.3)',
    textAlign: 'center',
    lineHeight: 21,
  },
  errorText: {
    fontSize: 14,
    color: '#D4883A',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
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
