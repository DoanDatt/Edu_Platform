'use client'

import HlsVideo from '@/components/hls-video'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatClock, formatDuration } from '@/lib/format'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { PublicLectureType, PublicSectionType } from '@/schemaValidations/section.schema'
import { ChevronDown, FileText, Lock, PlayCircle } from 'lucide-react'
import { useState } from 'react'

// Mục lục (tab Curriculum của EduPress): mỗi chương là 1 khung trắng mở / đóng (thẻ <details> có sẵn của HTML),
// bên phải ghi số bài + tổng phút; chương đang mở thì tên chuyển cam. Bài xem thử có nhãn Preview xanh.
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
  // Bài xem thử đang mở trong hộp thoại (null = đóng)
  const [preview, setPreview] = useState<PublicLectureType | null>(null)

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

      <div className='flex flex-col gap-2.5'>
        {sections.map((section, sectionIndex) => {
          const isOpen = openIds.has(section.id)
          return (
            <details
              key={section.id}
              open={isOpen}
              onToggle={(e) => setSectionOpen(section.id, e.currentTarget.open)}
              className='overflow-hidden rounded-xl bg-card'
            >
              <summary className='flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden'>
                <ChevronDown
                  className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180 text-primary')}
                />
                <span className={cn('flex-1 font-medium', isOpen && 'text-primary')}>
                  {sectionIndex + 1}. {section.title}
                </span>
                <span className='flex shrink-0 gap-4 text-sm text-muted-foreground'>
                  <span>{t('lessonCount', { count: section.lectures.length })}</span>
                  <span className='hidden sm:inline'>
                    {formatDuration(
                      section.lectures.reduce((sum, lecture) => sum + lecture.durationSec, 0),
                      locale
                    )}
                  </span>
                </span>
              </summary>

              <ul>
                {section.lectures.map((lecture, lectureIndex) => {
                  const row = (
                    <>
                      <FileText className='size-4 shrink-0 text-muted-foreground' />
                      {/* Đánh số kiểu "1.2": chương 1, bài 2 */}
                      <span className={cn('flex-1', !lecture.isPreview && 'text-muted-foreground')}>
                        {sectionIndex + 1}.{lectureIndex + 1} {lecture.title}
                      </span>
                      {lecture.isPreview && (
                        <Badge className='rounded-md bg-[#2d8bff] px-2.5 text-xs text-white'>{t('preview')}</Badge>
                      )}
                      <span className='tabular-nums text-muted-foreground'>{formatClock(lecture.durationSec)}</span>
                      {/* Bài xem thử: play cam (xem được ngay). Bài khác: khóa (phải ghi danh mới xem) */}
                      {lecture.isPreview ? (
                        <PlayCircle className='size-4 shrink-0 text-primary' />
                      ) : (
                        <Lock className='size-4 shrink-0 text-muted-foreground' />
                      )}
                    </>
                  )
                  const rowClass = 'flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm sm:pl-12'
                  return (
                    <li key={lecture.id} className='border-t'>
                      {/* Bài xem thử CÓ video: cả dòng là nút, bấm mở hộp thoại phát ngay trên trang */}
                      {lecture.isPreview && lecture.videoUrl ? (
                        <button
                          type='button'
                          onClick={() => setPreview(lecture)}
                          aria-label={t('playPreview', { title: lecture.title })}
                          className={cn(rowClass, 'transition-colors hover:bg-muted')}
                        >
                          {row}
                        </button>
                      ) : (
                        <div className={rowClass}>{row}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </details>
          )
        })}
      </div>

      {/* Hộp thoại xem thử: đóng (Esc, bấm ra ngoài, nút X) → preview về null → video bị gỡ, dừng phát */}
      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-3xl'>
          <DialogHeader className='px-5 pt-4 pb-3 pr-12'>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>{t('previewDescription')}</DialogDescription>
          </DialogHeader>
          {preview?.videoUrl && (
            // key: đổi bài xem thử → trình phát mới (không phát tiếp video cũ)
            <div key={preview.id} className='aspect-video w-full bg-black'>
              <HlsVideo src={preview.videoUrl} hlsUrl={preview.hlsUrl} autoPlay playsInline />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
