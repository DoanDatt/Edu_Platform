'use client'

import { cn } from '@/lib/utils'
import { useId, useState } from 'react'

export type CourseTab = { key: string; label: string; content: React.ReactNode }

// 5 tab của trang chi tiết theo Figma EduPress (Course Single): Overview · Curriculum · Instructor · FAQs · Reviews.
// Khung viền bo 20px: hàng tab chia đều (tab đang chọn chữ cam, nền xám), nội dung bên dưới nền xám nhạt.
// Nội dung từng tab do Server Component dựng sẵn và truyền vào (content) → component này chỉ lo ẩn / hiện.
// Dùng đúng vai trò ARIA của tab (tablist / tab / tabpanel) để trình đọc màn hình hiểu
export default function CourseTabs({ tabs, defaultTab }: { tabs: CourseTab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key)
  const id = useId()

  // Phím mũi tên trái / phải chuyển tab (chuẩn của tablist)
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
    setActive(tabs[next].key)
    document.getElementById(`${id}-tab-${tabs[next].key}`)?.focus()
  }

  return (
    <div className='overflow-hidden rounded-[20px] border'>
      <div role='tablist' className='grid grid-cols-3 border-b sm:grid-cols-5'>
        {tabs.map((tab, index) => {
          const selected = tab.key === active
          return (
            <button
              key={tab.key}
              id={`${id}-tab-${tab.key}`}
              type='button'
              role='tab'
              aria-selected={selected}
              aria-controls={`${id}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.key)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                'border-r px-3 py-4 text-base font-semibold transition-colors last:border-r-0 sm:text-lg',
                selected ? 'bg-secondary text-primary' : 'bg-card hover:text-primary'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          id={`${id}-panel-${tab.key}`}
          role='tabpanel'
          aria-labelledby={`${id}-tab-${tab.key}`}
          hidden={tab.key !== active}
          className='bg-secondary p-5 md:p-[30px]'
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
