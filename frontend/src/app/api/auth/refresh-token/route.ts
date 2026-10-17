import authApiRequest from '@/apiRequests/auth'
import { HttpError } from '@/lib/http'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Trình duyệt gọi POST /api/auth/refresh-token (không gửi gì, refresh token nằm trong cookie)
// → gọi backend lấy cặp token mới → ghi đè 2 cookie → trả cặp token mới cho trình duyệt.
// Lỗi gì cũng trả 401 (lưu ý số 2 trong ghi chú refresh-token.md của khóa học)
export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value
  if (!refreshToken) {
    return Response.json(
      {
        message: 'Không tìm thấy refreshToken'
      },
      {
        status: 401
      }
    )
  }
  try {
    const { payload } = await authApiRequest.sRefreshToken({
      refreshToken
    })

    const decodedAccessToken = jwt.decode(payload.data.accessToken) as {
      exp: number
    }
    const decodedRefreshToken = jwt.decode(payload.data.refreshToken) as {
      exp: number
    }
    cookieStore.set('accessToken', payload.data.accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedAccessToken.exp * 1000
    })
    cookieStore.set('refreshToken', payload.data.refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedRefreshToken.exp * 1000
    })
    return Response.json(payload)
  } catch (error) {
    // Refresh token bị thu hồi / hết hạn / backend lỗi → phiên đăng nhập coi như chấm dứt.
    // XÓA luôn 2 cookie: nếu để lại refreshToken cũ (đã vô dụng), proxy.ts vẫn tưởng là
    // đang đăng nhập và không cho vào /login → người dùng không đăng nhập lại được
    cookieStore.delete('accessToken')
    cookieStore.delete('refreshToken')
    return Response.json(
      {
        // HttpError: câu báo lỗi thật của backend nằm ở payload.message
        // (error.message chỉ là chữ chung "Lỗi HTTP")
        message: error instanceof HttpError ? error.payload.message : 'Có lỗi xảy ra'
      },
      {
        status: 401
      }
    )
  }
}
