import { Badge } from '@/components/ui/badge'
import { formatClock, formatDuration } from '@/lib/format'
import { PublicSectionType } from '@/schemaValidations/section.schema'
import { ChevronDown, Lock, PlayCircle } from 'lucide-react'

// Mục lục: mỗi chương là 1 khối mở / đóng được, bên trong là danh sách bài.
// Dùng thẻ <details> / <summary> có sẵn của HTML: bấm để mở / đóng mà KHÔNG cần useState,
// nên component này vẫn là Server Component (không cần 'use client')
export default function Curriculum({
  sections,
  totalLectures,
  totalDurationSec
}: {
  sections: PublicSectionType[]
  totalLectures: number
  totalDurationSec: number
}) {
  if (sections.length === 0) {
    return <p className='text-sm text-muted-foreground'>Khóa học chưa có nội dung.</p>
  }

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm text-muted-foreground'>
        {sections.length} chương · {totalLectures} bài giảng · {formatDuration(totalDurationSec)}
      </p>

      <div className='divide-y overflow-hidden rounded-lg border'>
        {sections.map((section, index) => {
          // Tổng thời lượng 1 chương = cộng durationSec của các bài trong chương
          // reduce: đi qua từng bài, cộng dồn vào sum (bắt đầu từ 0)
          const sectionDuration = section.lectures.reduce((sum, lecture) => sum + lecture.durationSec, 0)

          return (
            // open={index === 0}: chương đầu mở sẵn, các chương sau đóng
            // group: để icon mũi tên bên trong xoay khi mở (group-open:rotate-180)
            <details key={section.id} open={index === 0} className='group'>
              <summary className='flex cursor-pointer list-none items-center gap-3 bg-muted/40 px-4 py-3 hover:bg-muted'>
                <ChevronDown className='size-4 shrink-0 transition-transform group-open:rotate-180' />
                <span className='flex-1 font-medium'>{section.title}</span>
                <span className='text-xs text-muted-foreground'>
                  {section.lectures.length} bài · {formatDuration(sectionDuration)}
                </span>
              </summary>

              <ul className='divide-y'>
                {section.lectures.map((lecture) => (
                  <li key={lecture.id} className='flex items-center gap-3 px-4 py-2.5 text-sm'>
                    {/* Bài xem thử: icon play màu chính. Bài khác: icon khóa (phải ghi danh mới xem) */}
                    {lecture.isPreview ? (
                      <PlayCircle className='size-4 shrink-0 text-primary' />
                    ) : (
                      <Lock className='size-4 shrink-0 text-muted-foreground' />
                    )}
                    <span className='flex-1'>{lecture.title}</span>
                    {lecture.isPreview && <Badge variant='secondary'>Xem thử</Badge>}
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
