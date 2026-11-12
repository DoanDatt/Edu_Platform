import { Pressable, Text, View } from 'react-native'
import { RoleLabels } from '@/constants/type'
import { useAuthStore } from '@/store/auth'

export default function ProfileScreen() {
  const account = useAuthStore((s) => s.account)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View style={{ flex: 1, padding: 24, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>{account?.name}</Text>
      <Text>{account?.email}</Text>
      {account && <Text style={{ color: '#57606a' }}>{RoleLabels[account.role]}</Text>}
      <Pressable onPress={logout} style={{ marginTop: 16 }}>
        <Text style={{ color: '#d1242f', fontWeight: '600' }}>Đăng xuất</Text>
      </Pressable>
    </View>
  )
}
