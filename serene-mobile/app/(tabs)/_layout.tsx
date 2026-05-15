import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Home, Compass, Plus, User, Leaf } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'

function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <TouchableOpacity
      {...(props as React.ComponentProps<typeof TouchableOpacity>)}
      activeOpacity={0.8}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        props.onPress?.(e)
      }}
    />
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#1A1A18',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#8ABD80',
        tabBarInactiveTintColor: 'rgba(245,240,232,0.3)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Compass size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: () => (
            <View style={styles.createIcon}>
              <Plus size={20} color="#F5F0E8" strokeWidth={2.2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: 'Companion',
          tabBarIcon: ({ color, size }) => (
            <Leaf size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  createIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4E7A44',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    shadowColor: '#4E7A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
})
