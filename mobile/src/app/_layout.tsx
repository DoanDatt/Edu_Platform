import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

// Giữ màn hình chờ cho tới khi biết đã đăng nhập hay chưa (không bị nháy màn login)
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // useState: tạo QueryClient 1 lần, không tạo lại mỗi lần render
  const [queryClient] = useState(() => new QueryClient())
  const status = useAuthStore((s) => s.status)
  const bootstrap = useAuthStore((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync()
  }, [status])

  if (status === 'loading') return null

  // Stack.Protected: guard false thì màn đó bị chặn. status đổi → Expo Router tự chuyển màn, không cần router.replace
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name='(app)' />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name='login' />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  )
}
