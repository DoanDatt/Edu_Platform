import { Tabs } from 'expo-router'

// Thanh tab dưới cho các màn đã đăng nhập
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#FF782D' }}>
      <Tabs.Screen name='index' options={{ title: 'Khóa học của tôi' }} />
      <Tabs.Screen name='profile' options={{ title: 'Hồ sơ' }} />
    </Tabs>
  )
}
