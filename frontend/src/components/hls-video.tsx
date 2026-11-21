'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComponentProps, RefObject, useEffect, useRef, useState } from 'react'
import type Hls from 'hls.js'

// 1 mức chất lượng trong bản HLS. index = vị trí trong hls.levels (hls.js chọn mức theo số này)
type QualityLevel = { index: number; height: number }
const AUTO_LEVEL = -1 // hls.js: -1 = tự chọn theo tốc độ mạng

// Trình phát video dùng chung (trang học, xem thử ở trang chi tiết khóa học):
//   - có hlsUrl: phát HLS (nhiều mức chất lượng, tự đổi theo mạng) + menu chọn chất lượng
//   - không có, hoặc HLS lỗi (vd bản HLS chưa tạo xong vì video vừa upload): phát mp4 (src)
// Không tự đếm thời gian xem: trang học bọc thêm phần đó (LectureVideo), xem thử thì không cần.
// videoRef: chỗ dùng cần đọc thẻ <video> (vd currentTime để báo tiến độ) thì truyền ref của mình vào
export default function HlsVideo({
  src,
  hlsUrl,
  videoRef,
  className,
  ...videoProps
}: {
  src: string
  hlsUrl?: string | null
  videoRef?: RefObject<HTMLVideoElement | null>
} & Omit<ComponentProps<'video'>, 'src' | 'ref'>) {
  const t = useTranslations('Player')
  const ownRef = useRef<HTMLVideoElement>(null)
  const ref = videoRef ?? ownRef

  // ===== Chọn chất lượng (chỉ khi phát bằng hls.js; Safari / iOS tự phát HLS nên không chọn được) =====
  const hlsRef = useRef<Hls | null>(null)
  const [levels, setLevels] = useState<QualityLevel[]>([]) // rỗng = ẩn nút chọn chất lượng
  const [selectedLevel, setSelectedLevel] = useState(AUTO_LEVEL) // người dùng chọn
  const [playingHeight, setPlayingHeight] = useState<number | null>(null) // mức đang phát thật (vd 540)

  const changeLevel = (value: string) => {
    const level = Number(value)
    setSelectedLevel(level)
    // currentLevel: đổi NGAY (bỏ phần đã tải sẵn của mức cũ). -1 = trả lại cho hls.js tự chọn
    if (hlsRef.current) hlsRef.current.currentLevel = level
  }

  // Chọn nguồn phát: có HLS thì phát HLS, không có hoặc HLS lỗi thì phát mp4.
  // <video> không đặt prop src: để effect này tự gán, tránh trình duyệt tải mp4 trước rồi mới chuyển sang HLS
  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (!hlsUrl) {
      video.src = src
      return
    }
    let hls: Hls | null = null
    let cancelled = false // effect đã dọn (đổi bài, StrictMode chạy 2 lần) → bỏ qua kết quả import
    const fallbackToMp4 = () => {
      video.src = src
    }
    // import() động: hls.js chỉ chạy được trên trình duyệt, tải lúc cần (không lọt vào bundle trang khác)
    import('hls.js').then(({ default: HlsClass }) => {
      if (cancelled) return
      if (HlsClass.isSupported()) {
        // Chrome, Edge, Firefox: hls.js tự tải từng đoạn .ts và đổi chất lượng theo tốc độ mạng
        hls = new HlsClass()
        hlsRef.current = hls
        // Đọc xong file .m3u8 → biết có những mức nào (720p, 540p...) → hiện menu, cao nhất lên đầu
        hls.on(HlsClass.Events.MANIFEST_PARSED, (_event, data) => {
          setLevels(
            data.levels.map((level, index) => ({ index, height: level.height })).sort((a, b) => b.height - a.height)
          )
        })
        // hls.js vừa chuyển sang mức khác (tự động hoặc do người dùng chọn) → cập nhật chữ "Tự động (540p)"
        hls.on(HlsClass.Events.LEVEL_SWITCHED, (_event, data) => {
          setPlayingHeight(hls?.levels[data.level]?.height ?? null)
        })
        hls.on(HlsClass.Events.ERROR, (_event, data) => {
          if (!data.fatal) return // lỗi nhẹ: hls.js tự xử lý được
          // Lỗi nặng (vd bản HLS chưa tạo xong vì video vừa upload) → quay về mp4, ẩn menu chất lượng
          hls?.destroy()
          hls = null
          hlsRef.current = null
          setLevels([])
          setPlayingHeight(null)
          fallbackToMp4()
        })
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / iOS: tự phát được .m3u8, không cần hls.js
        video.addEventListener('error', fallbackToMp4, { once: true })
        video.src = hlsUrl
      } else {
        fallbackToMp4()
      }
    })
    return () => {
      cancelled = true
      hls?.destroy()
      hlsRef.current = null
      video.removeEventListener('error', fallbackToMp4)
    }
  }, [hlsUrl, src, ref])

  const autoLabel = playingHeight ? t('autoWithLevel', { height: playingHeight }) : t('auto')
  const selectedHeight = levels.find((level) => level.index === selectedLevel)?.height
  const buttonLabel = selectedHeight ? `${selectedHeight}p` : autoLabel

  return (
    // group: nút chất lượng chỉ hiện rõ khi rê chuột vào video (giống thanh điều khiển của trình duyệt)
    <div className='group relative size-full'>
      {levels.length > 1 && (
        // Đặt góc TRÊN bên phải: thanh điều khiển có sẵn của <video> nằm ở dưới, không bị che.
        // Chế độ toàn màn hình của <video> sẽ không thấy nút này (trình duyệt chỉ phóng to thẻ <video>)
        <div className='absolute top-3 right-3 z-10 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size='sm'
                variant='secondary'
                className='bg-black/60 text-white hover:bg-black/80'
                aria-label={t('chooseQuality')}
              >
                <Settings />
                {buttonLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>{t('quality')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={String(selectedLevel)} onValueChange={changeLevel}>
                <DropdownMenuRadioItem value={String(AUTO_LEVEL)}>{autoLabel}</DropdownMenuRadioItem>
                {levels.map((level) => (
                  <DropdownMenuRadioItem key={level.index} value={String(level.index)}>
                    {level.height}p
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <video ref={ref} controls className={cn('size-full', className)} {...videoProps} />
    </div>
  )
}
