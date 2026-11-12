import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { HttpError } from '@/lib/http'
import { LoginBodySchema, LoginBodyType } from '@/schemaValidations/auth'
import { useAuthStore } from '@/store/auth'

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: '', password: '' }
  })

  // Đăng nhập xong KHÔNG cần điều hướng: status đổi → Stack.Protected tự chuyển sang (app)
  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error instanceof HttpError ? error.message : 'Không kết nối được máy chủ')
    }
  })

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>EduPlatform</Text>

      {/* Mobile không có <input>: dùng TextInput, và Controller vì TextInput không nhận register() */}
      <Controller
        control={control}
        name='email'
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={styles.input}
            placeholder='Email'
            autoCapitalize='none'
            keyboardType='email-address'
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name='password'
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={styles.input}
            placeholder='Mật khẩu'
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

<Pressable style={styles.button} onPress={() => onSubmit()} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 8, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#d0d7de', borderRadius: 8, paddingHorizontal: 12, height: 48 },
  error: { color: '#d1242f', fontSize: 13 },
  button: {
    backgroundColor: '#FF782D',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 }
})
