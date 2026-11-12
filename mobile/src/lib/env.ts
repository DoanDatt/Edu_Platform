// Biến bắt đầu bằng EXPO_PUBLIC_ mới đọc được trong app (giống NEXT_PUBLIC_ bên Next.js)
export const API_URL = process.env.EXPO_PUBLIC_API_URL as string
