import { Suspense } from 'react'
import RefreshToken from './refresh-token'

// useSearchParams (đọc ?redirect=) phải nằm trong <Suspense> (Next 16, cacheComponents)
export default function RefreshTokenPage() {
  return (
    <Suspense>
      <RefreshToken />
    </Suspense>
  )
}
