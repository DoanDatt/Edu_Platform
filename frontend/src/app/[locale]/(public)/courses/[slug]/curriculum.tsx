'use client'

import { Badge } from '@/components/ui/badge'
import { formatClock, formatDuration } from '@/lib/format'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { PublicSectionType } from '@/schemaValidations/section.schema'
import { Lock, Minus, PlayCircle, Plus } from 'lucide-react'
import { useState } from 'react'

// Mục lục: mỗi chương là 1 khối mở / đóng (thẻ <details> có sẵn của HTML).
// Client Component vì có nút "Mở rộng tất cả": cần nhớ CHƯƠNG NÀO ĐANG MỞ trong state.
// <details open={...}> + onToggle: người dùng bấm từng chương → trình duyệt tự mở / đóng,
// onToggle báo lại để state luôn khớp với giao diện
export default function Curriculum({
  sections,
  totalLectures,
  totalDurationSec
}: {
  sections: PublicSectionType[]
  totalLectures: number
  totalDurationSec: number
}) {
  const t = useTranslations('CourseDetail')
  const locale = useLocale()
  // Mặc định mở sẵn chương đầu. Set: tập hợp id, kiểm tra "có trong tập không" bằng .has()
  const [openIds, setOpenIds] = useState(() => new Set(sections.slice(0, 1).map((section) => section.id)))
  const allOpen = sections.length > 0 && openIds.size === sections.length

  if (sections.length === 0) {
    return <p className='text-sm text-muted-foreground'>{t('noContent')}</p>
  }

  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(sections.map((section) => section.id)))

  // Luôn tạo Set MỚI rồi mới set state (không sửa Set cũ): React so sánh tham chiếu,
  // sửa thẳng Set cũ thì React tưởng không có gì đổi và không vẽ lại
  const setSectionOpen = (id: number, open: boolean) =>
    setOpenIds((current) => {
      if (current.has(id) === open) return current // đã đúng trạng thái → giữ nguyên
      const next = new Set(current)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
        <p>
          {t.rich('curriculumSummary', {
            sections: sections.length,
            lectures: totalLectures,
            duration: formatDuration(totalDurationSec, locale),
            b: (chunks) => <span className='font-semibold'>{chunks}</span>
          })}
        </p>
        <button type='button' onClick={toggleAll} className='font-medium text-primary hover:underline'>
          {allOpen ? t('collapseAll') : t('expandAll')}
        </button>
      </div>

      <div className='flex flex-col gap-2'>
        {sections.map((section, sectionIndex) => {
          const isOpen = openIds.has(section.id)
          return (
            <details
              key={section.id}
              open={isOpen}
              onToggle={(e) => setSectionOpen(section.id, e.currentTarget.open)}
              className='overflow-hidden rounded-xl'
            >
              <summary className='flex cursor-pointer list-none items-center gap-3 bg-muted/70 px-4 py-3.5 transition-colors hover:bg-muted dark:bg-card'>
                {isOpen ? (
                  <Minus className='size-4 shrink-0 text-primary' />
                ) : (
                  <Plus className='size-4 shrink-0 text-primary' />
                )}
                <span className='flex-1 font-semibold'>
                  {sectionIndex + 1}. {section.title}
                </span>
                <span className='shrink-0 text-sm text-muted-foreground'>
                  {t('lessonCount', { count: section.lectures.length })}
                </span>
              </summary>

              <ul>
                {section.lectures.map((lecture, lectureIndex) => (
                  <li
                    key={lecture.id}
                    className='flex items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0 sm:pl-11'
                  >
                    {/* Bài xem thử: icon play màu chính. Bài khác: icon khóa (phải ghi danh mới xem) */}
                    {lecture.isPreview ? (
                      <PlayCircle className='size-4 shrink-0 text-primary' />
                    ) : (
                      <Lock className='size-4 shrink-0 text-muted-foreground' />
                    )}
                    {/* Đánh số kiểu "1.2": chương 1, bài 2 */}
                    <span className={cn('flex-1', !lecture.isPreview && 'text-muted-foreground')}>
                      {sectionIndex + 1}.{lectureIndex + 1} {lecture.title}
                    </span>
                    {lecture.isPreview && <Badge variant='secondary'>{t('preview')}</Badge>}
                    <span className='tabular-nums text-muted-foreground'>{formatClock(lecture.durationSec)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )
        })}
      </div>
    </div>
  )
}
