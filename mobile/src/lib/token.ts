import * as SecureStore from 'expo-secure-store'

// Web để token ở localStorage. Mobile dùng SecureStore: được mã hóa bằng Keychain (iOS) / Keystore (Android)
const ACCESS = 'accessToken'
const REFRESH = 'refreshToken'

export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync(ACCESS),
  getRefresh: () => SecureStore.getItemAsync(REFRESH),
  save: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS, accessToken)
    await SecureStore.setItemAsync(REFRESH, refreshToken)
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS)
    await SecureStore.deleteItemAsync(REFRESH)
  }
}
