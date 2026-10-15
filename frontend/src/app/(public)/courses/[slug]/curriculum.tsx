import { Badge } from '@/components/ui/badge'
import { formatClock, formatDuration } from '@/lib/format'
import { PublicSectionType } from '@/schemaValidations/section.schema'
import { ChevronDown, Lock, PlayCircle } from 'lucide-react'

// Mục lục khóa học: mỗi chương là 1 khối mở / đóng được.
// Dùng thẻ <details> có sẵn của HTML: không cần JavaScript, không cần cài component
export default function Curriculum({
  sections,
  totalLectures,
  totalDurationSec
}: {
  sections: PublicSectionType[]
  totalLectures: number
  totalDurationSec: number
}) {
  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm text-muted-foreground'>
        {sections.length} chương · {totalLectures} bài giảng · {formatDuration(totalDurationSec)}
      </p>

      <div className='divide-y overflow-hidden rounded-lg border'>
        {sections.map((section, index) => {
          const sectionDuration = section.lectures.reduce((sum, lecture) => sum + lecture.durationSec, 0)
          return (
            // Chương đầu mở sẵn để người xem thấy ngay nội dung
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
                    {/* Bài xem thử: ai cũng xem được. Bài khác: phải ghi danh (backend trả videoUrl: null) */}
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
