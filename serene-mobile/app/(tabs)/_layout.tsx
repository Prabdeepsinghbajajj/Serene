import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Home, Compass, Plus, User, Leaf } from 'lucide-react-native'

function TabBarBackground() {
  return <View style={[StyleSheet.absoluteFill, styles.tabBarBg]} />
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8ABD80',
        tabBarInactiveTintColor: 'rgba(245,240,232,0.3)',
        tabBarBackground: () => <TabBarBackground />,
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
  tabBarBg: {
    backgroundColor: '#1A1A18',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4E7A44',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
})
