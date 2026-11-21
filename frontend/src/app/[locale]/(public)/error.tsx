'use client' // Error Boundary bắt buộc là Client Component

import ErrorFallback from '@/components/error-fallback'

// Lỗi khi render 1 trang công khai → hiện trong layout (public): header, footer vẫn còn, người dùng đi tiếp được
export default function PublicError(props: { error: unknown; retry: () => void }) {
  return <ErrorFallback {...props} />
}
