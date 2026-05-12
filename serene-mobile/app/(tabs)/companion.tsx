import { useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_300Light,
} from '@expo-google-fonts/cormorant-garamond'
import { Leaf, Trash2 } from 'lucide-react-native'
import { useAICompanion } from '@/hooks/use-ai-companion'
import { CRISIS_RESOURCES } from '@/types/ai'
import type { CompanionMessage } from '@/types/ai'

/* -------------------------------------------------------------------------- */
/*  Crisis card                                                                */
/* -------------------------------------------------------------------------- */

function CrisisCard() {
  return (
    <View style={styles.crisisCard}>
      <Text style={styles.crisisTitle}>You matter</Text>
      <Text style={styles.crisisBody}>{CRISIS_RESOURCES}</Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Message bubble                                                             */
/* -------------------------------------------------------------------------- */

function MessageBubble({ message, garamondLoaded }: { message: CompanionMessage; garamondLoaded: boolean }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{message.content}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={styles.assistantBubble}>
        {message.content.length === 0 ? (
          <ActivityIndicator size="small" color="#8ABD80" />
        ) : (
          <Text
            style={[
              styles.assistantBubbleText,
              garamondLoaded && { fontFamily: 'CormorantGaramond_400Regular_Italic' },
            ]}
          >
            {message.content}
          </Text>
        )}
      </View>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyCompanion({ garamondLoaded }: { garamondLoaded: boolean }) {
  return (
    <View style={styles.emptyState}>
      <Leaf size={36} color="rgba(138,189,128,0.3)" strokeWidth={1.2} />
      <Text
        style={[
          styles.emptyTitle,
          garamondLoaded && { fontFamily: 'CormorantGaramond_300Light' },
        ]}
      >
        Your companion is here
      </Text>
      <Text style={styles.emptySubtitle}>
        Share what's on your mind — this is a gentle space.
      </Text>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/*  Companion screen                                                           */
/* -------------------------------------------------------------------------- */

export default function CompanionScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_300Light,
  })

  const { messages, isStreaming, error, showCrisisCard, sendMessage, clearMessages } =
    useAICompanion()
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    await sendMessage(text)
  }, [input, isStreaming, sendMessage])

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            fontsLoaded && { fontFamily: 'CormorantGaramond_300Light' },
          ]}
        >
          Your companion
        </Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearMessages} hitSlop={12}>
            <Trash2 size={18} color="rgba(245,240,232,0.25)" strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} garamondLoaded={!!fontsLoaded} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={<EmptyCompanion garamondLoaded={!!fontsLoaded} />}
          ListFooterComponent={
            <>
              {showCrisisCard && <CrisisCard />}
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </>
          }
        />

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Say something…"
            placeholderTextColor="rgba(245,240,232,0.2)"
            multiline
            maxLength={800}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isStreaming) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
            activeOpacity={0.75}
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color="#F5F0E8" />
            ) : (
              <Leaf size={20} color="#F5F0E8" strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A18',
  },
  flex: {
    flex: 1,
  },
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
    fontSize: 22,
    fontWeight: '300',
    color: '#F5F0E8',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  bubbleRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAssistant: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: 'rgba(78,122,68,0.25)',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(138,189,128,0.15)',
  },
  userBubbleText: {
    fontSize: 15,
    color: 'rgba(245,240,232,0.85)',
    lineHeight: 22,
  },
  assistantBubble: {
    maxWidth: '80%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minWidth: 48,
    minHeight: 40,
    justifyContent: 'center',
  },
  assistantBubbleText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#C8DEC4',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(245,240,232,0.55)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.25)',
    textAlign: 'center',
    lineHeight: 21,
  },
  crisisCard: {
    backgroundColor: 'rgba(212,136,58,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,136,58,0.2)',
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  crisisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4883A',
    letterSpacing: 0.5,
  },
  crisisBody: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.6)',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#D4883A',
    textAlign: 'center',
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#F5F0E8',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4E7A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
})
