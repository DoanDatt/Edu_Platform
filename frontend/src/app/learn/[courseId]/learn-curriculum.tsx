import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MySectionType } from '@/schemaValidations/enrollment.schema'
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import Link from 'next/link'

// Mục lục bên phải trang học: ✓ bài đã học, ▶ bài đang học (tô nền), ○ bài chưa học.
// Mỗi bài là 1 Link đổi ?lecture= → URL đổi → LearnCourse đọc lại bài đang học
export default function LearnCurriculum({
  sections,
  currentLectureId,
  hrefFor,
  completedLectures,
  totalLectures
}: {
  sections: MySectionType[]
  currentLectureId: number
  hrefFor: (lectureId: number) => string
  completedLectures: number
  totalLectures: number
}) {
  return (
    <div className='flex flex-col'>
      <div className='border-b p-4'>
        <h2 className='font-semibold'>Nội dung khóa học</h2>
        <p className='text-sm text-muted-foreground'>
          Đã học {completedLectures}/{totalLectures} bài
        </p>
      </div>

      {sections.map((section, index) => (
        <div key={section.id} className='border-b'>
          <p className='bg-muted/40 px-4 py-2.5 text-sm font-semibold'>
            Chương {index + 1}: {section.title}
          </p>
          <ul>
            {section.lectures.map((lecture) => {
              const isCurrent = lecture.id === currentLectureId
              return (
                <li key={lecture.id}>
                  {/* scroll={false}: đổi bài không cuộn cả trang lên đầu */}
                  <Link
                    href={hrefFor(lecture.id)}
                    scroll={false}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent',
                      isCurrent && 'bg-accent font-medium'
                    )}
                  >
                    {lecture.completed ? (
                      <CheckCircle2 className='size-4 shrink-0 text-green-600' />
                    ) : isCurrent ? (
                      <PlayCircle className='size-4 shrink-0 text-primary' />
                    ) : (
                      <Circle className='size-4 shrink-0 text-muted-foreground' />
                    )}
                    <span className='flex-1'>{lecture.title}</span>
                    <span className='tabular-nums text-xs text-muted-foreground'>{formatClock(lecture.durationSec)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
