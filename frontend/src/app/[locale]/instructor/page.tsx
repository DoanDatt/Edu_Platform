import type { Metadata } from 'next'
import InstructorDashboard from './instructor-dashboard'

export const metadata: Metadata = {
  // title.template của layout chỉ áp dụng cho trang CON, trang /instructor cùng cấp layout → ghi đầy đủ
  title: { absolute: 'Tổng quan | Giảng dạy EduPlatform' }
}

export default function InstructorPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Tổng quan</h1>
        <p className='text-muted-foreground'>Tình hình các khóa học bạn đang giảng dạy.</p>
      </div>
      <InstructorDashboard />
    </div>
  )
}
