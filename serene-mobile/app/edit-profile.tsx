import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'

export default function EditProfileScreen() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data } = await supabase
        .from('users')
        .select('display_name, bio, avatar_url')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setDisplayName(data.display_name ?? '')
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatar_url)
      }
      setLoading(false)
    }
    void loadProfile()
  }, [])

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mimeType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`
    const filePath = `${userId}/avatar.${ext}`

    const { data: { session } } = await supabase.auth.getSession()

    const formData = new FormData()
    formData.append('file', { uri, name: `avatar.${ext}`, type: mimeType } as unknown as Blob)

    const response = await fetch(
      `https://fjfdundcziicyxbrsvgs.supabase.co/storage/v1/object/avatars/${filePath}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-upsert': 'true' },
        body: formData,
      }
    )
    if (response.ok) {
      setAvatarUrl(
        `https://fjfdundcziicyxbrsvgs.supabase.co/storage/v1/object/public/avatars/${filePath}`
      )
    } else {
      const err = await response.text()
      console.error('Avatar upload error:', err)
      Alert.alert('Error', 'Could not upload photo. Try again.')
    }
  }

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Display name is required')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      })
      .eq('id', userId)
    setSaving(false)
    if (error) {
      Alert.alert('Error', 'Could not save changes.')
    } else {
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A18', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#8ABD80" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A18' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: 'rgba(245,240,232,0.5)', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#F5F0E8', fontSize: 18, fontWeight: '500' }}>Edit profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Avatar */}
        <TouchableOpacity onPress={() => void pickAvatar()} style={{ alignItems: 'center', marginBottom: 32 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: 'rgba(138,189,128,0.3)' }}
              contentFit="cover"
            />
          ) : (
            <View style={{
              width: 96, height: 96, borderRadius: 48,
              backgroundColor: 'rgba(78,122,68,0.3)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: 'rgba(138,189,128,0.3)',
            }}>
              <Text style={{ color: '#8ABD80', fontSize: 32, fontWeight: '600' }}>
                {(displayName || 'U').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ color: '#8ABD80', fontSize: 13, marginTop: 10, fontWeight: '500' }}>
            Change photo
          </Text>
        </TouchableOpacity>

        {/* Display name */}
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>
          Display name
        </Text>
        <TextInput
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 16,
            color: '#F5F0E8',
            fontSize: 16,
            marginBottom: 20,
          }}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your display name"
          placeholderTextColor="rgba(245,240,232,0.25)"
          keyboardAppearance="dark"
          maxLength={50}
        />

        {/* Bio */}
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>
          Bio
        </Text>
        <TextInput
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 16,
            color: '#F5F0E8',
            fontSize: 16,
            marginBottom: 32,
            minHeight: 100,
            textAlignVertical: 'top',
          }}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={150}
          placeholder="Tell people a bit about yourself..."
          placeholderTextColor="rgba(245,240,232,0.25)"
          keyboardAppearance="dark"
        />

        {/* Save */}
        <TouchableOpacity
          onPress={() => void handleSave()}
          disabled={saving}
          style={{
            backgroundColor: saving ? 'rgba(78,122,68,0.5)' : '#4E7A44',
            borderRadius: 100,
            padding: 16,
            alignItems: 'center',
            shadowColor: '#4E7A44',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
              Save changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
