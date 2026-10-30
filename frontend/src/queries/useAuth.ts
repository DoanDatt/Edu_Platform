import { authApiRequest } from '@/apiRequests/auth'
import { useMutation, useQuery } from '@tanstack/react-query'

// useMutation: dùng cho API thay đổi dữ liệu (POST / PUT / DELETE)
// Có sẵn isPending (đang gửi), mutateAsync (gọi và chờ kết quả)...

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.login
  })
}

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.register
  })
}

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.logout
  })
}

// Quên mật khẩu: gửi mã → kiểm tra mã → đặt mật khẩu mới
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.forgotPassword
  })
}

export const useVerifyOtpMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.verifyOtp
  })
}

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.resetPassword
  })
}

// useQuery: dùng cho API đọc dữ liệu (GET), tự cache theo queryKey.
// Nhiều component cùng gọi useMeQuery() thì chỉ gửi 1 request
export const useMeQuery = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApiRequest.me,
    enabled // chưa đăng nhập thì không gọi (sẽ nhận 401)
  })
}
