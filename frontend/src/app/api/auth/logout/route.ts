import { authApiRequest } from '@/apiRequests/auth'
import { cookies } from 'next/headers'

// Trình duyệt gọi POST /api/auth/logout (không gửi gì, token nằm trong cookie)
// → xóa cookie → báo backend thu hồi refresh token.
// LUÔN trả 200: phía người dùng, bấm "Đăng xuất" là phải đăng xuất được,
// kể cả khi backend lỗi hay token đã hết hạn / bị thu hồi từ trước
export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  // Xóa cookie trước: dù bước sau có lỗi, trình duyệt cũng không còn token
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')

  if (!refreshToken) {
    return Response.json({ message: 'Đăng xuất thành công' })
  }

  try {
    // Backend xóa refresh token khỏi DB → token này không dùng để làm mới được nữa
    const { payload } = await authApiRequest.sLogout({ refreshToken })
    return Response.json(payload)
  } catch {
    // Backend lỗi / token đã bị thu hồi (401): phía trình duyệt vẫn coi như đã đăng xuất
    return Response.json({ message: 'Đăng xuất thành công' })
  }
}
