import { useTranslations } from 'next-intl'
import type { FieldError } from 'react-hook-form'

// Thông báo lỗi trong schema Zod viết sẵn bằng tiếng Việt (schemaValidations/*). Không sửa schema
// (schema dùng chung với API, đã đúng với tiếng Việt), chỉ dịch LÚC HIỂN THỊ: tra câu tiếng Việt → khóa dịch.
// Câu chưa có trong bảng (vd lỗi trả về từ backend) thì giữ nguyên
const zodMessageKeys = {
  'Email không hợp lệ': 'invalidEmail',
  'Mật khẩu tối thiểu 8 kí tự': 'passwordMin',
  'Vui lòng nhập tên': 'nameRequired',
  'Số điện thoại không hợp lệ': 'invalidPhone',
  'Mật khẩu xác nhận không khớp': 'passwordMismatch',
  'Vui lòng nhập mật khẩu': 'passwordRequired',
  'Số sao từ 1 đến 5': 'ratingRange',
  'Mã OTP gồm 6 chữ số': 'otpFormat'
} as const

const isKnownMessage = (message: string): message is keyof typeof zodMessageKeys => message in zodMessageKeys

// Dùng trong form: <FieldError errors={[translateError(fieldState.error)]} />
export function useZodErrorTranslator() {
  const t = useTranslations('Validation')
  return (error?: FieldError) => {
    if (!error?.message || !isKnownMessage(error.message)) return error
    return { ...error, message: t(zodMessageKeys[error.message]) }
  }
}
