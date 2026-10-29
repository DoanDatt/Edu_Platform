import { Suspense } from 'react'
import Logout from './logout'

// http.ts (nhánh server) chuyển tới /logout?accessToken=... khi Server Component gặp 401.
// useSearchParams (đọc ?accessToken=) phải nằm trong <Suspense> (Next 16, cacheComponents)
export default function LogoutPage() {
  return (
    <Suspense>
      <Logout />
    </Suspense>
  )
}
