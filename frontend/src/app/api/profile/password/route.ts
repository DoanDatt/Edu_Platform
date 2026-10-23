import profileApiRequest from '@/apiRequests/profile'
import { ChangePasswordBodyType } from '@/schemaValidations/profile.schema'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { HttpError } from '@/lib/http'

export async function PUT(request: Request) {
  const body = (await request.json()) as ChangePasswordBodyType
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value

  if (!accessToken) {
    return Response.json(
      {
        message: 'Bạn chưa đăng nhập!'
      },
      {
        status: 401
      }
    )
  }
  try {
    const { payload } = await profileApiRequest.sChangePassword(body, accessToken)
    const { accessToken: newAccessToken, refreshToken } = payload.data
    const decodedNewAccessToken = jwt.decode(newAccessToken) as { exp: number }
    const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number }
    cookieStore.set('accessToken', newAccessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedNewAccessToken.exp * 1000
    })
    cookieStore.set('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedRefreshToken.exp * 1000
    })
    return Response.json(payload)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status
      })
    } else {
      return Response.json(
        {
          message: 'Có lỗi xảy ra!'
        },
        {
          status: 500
        }
      )
    }
  }
}
