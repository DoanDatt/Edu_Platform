'use client' // Error Boundary bắt buộc là Client Component

import ErrorFallback from '@/components/error-fallback'

// Lỗi ở khu dashboard (admin, giảng viên, trang học) hoặc ở chính layout (public).
// Không nằm trong layout nào có header → tự căn giữa cả màn hình
export default function LocaleError(props: { error: unknown; retry: () => void }) {
  return (
    <main className='flex min-h-screen flex-col px-4'>
      <ErrorFallback {...props} />
    </main>
  )
}
