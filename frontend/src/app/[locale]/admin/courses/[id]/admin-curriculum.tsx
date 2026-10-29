'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatClock } from '@/lib/format'
import { InstructorSectionType } from '@/schemaValidations/section.schema'
import { FileText, PlayCircle, X } from 'lucide-react'
import { useState } from 'react'

// Mục lục cho admin: mở sẵn hết các chương, bài nào có video thì bấm "Xem" để phát ngay bên dưới.
// Mỗi lúc chỉ phát 1 video (playingId) → không có nhiều video tải cùng lúc
export default function AdminCurriculum({ sections }: { sections: InstructorSectionType[] }) {
  const [playingId, setPlayingId] = useState<number | null>(null)

  if (sections.length === 0) {
    return <p className='text-sm text-muted-foreground italic'>Khóa học chưa có chương nào.</p>
  }

  return (
    <div className='flex flex-col gap-3'>
      {sections.map((section, sectionIndex) => (
        <section key={section.id} className='overflow-hidden rounded-xl border'>
          <h3 className='bg-muted/50 px-4 py-3 font-semibold'>
            {sectionIndex + 1}. {section.title}
          </h3>
          {section.lectures.length === 0 ? (
            <p className='px-4 py-3 text-sm text-muted-foreground italic'>Chương chưa có bài giảng.</p>
          ) : (
            <ul className='divide-y'>
              {section.lectures.map((lecture, lectureIndex) => {
                const isPlaying = playingId === lecture.id
                return (
                  <li key={lecture.id} className='flex flex-col gap-3 px-4 py-3 text-sm'>
                    <div className='flex items-center gap-3'>
                      {lecture.videoUrl ? (
                        <PlayCircle className='size-4 shrink-0 text-primary' />
                      ) : (
                        <FileText className='size-4 shrink-0 text-muted-foreground' />
                      )}
                      <span className='min-w-0 flex-1'>
                        {sectionIndex + 1}.{lectureIndex + 1} {lecture.title}
                      </span>
                      {lecture.isPreview && <Badge variant='secondary'>Xem thử</Badge>}
                      {/* Bài không có video là dấu hiệu khóa chưa hoàn thiện → làm nổi lên cho admin thấy */}
                      {!lecture.videoUrl && (
                        <Badge variant='outline' className='text-destructive'>
                          Chưa có video
                        </Badge>
                      )}
                      <span className='text-muted-foreground tabular-nums'>{formatClock(lecture.durationSec)}</span>
                      {lecture.videoUrl && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setPlayingId(isPlaying ? null : lecture.id)}
                          aria-expanded={isPlaying}
                        >
                          {isPlaying ? <X /> : <PlayCircle />}
                          {isPlaying ? 'Đóng' : 'Xem'}
                        </Button>
                      )}
                    </div>
                    {isPlaying && lecture.videoUrl && (
                      <video src={lecture.videoUrl} controls autoPlay className='aspect-video w-full rounded-lg bg-black' />
                    )}
                    {lecture.content && isPlaying && (
                      <p className='whitespace-pre-line text-muted-foreground'>{lecture.content}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
