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
import { useReportWatchMutation } from '@/queries/useLecture'
import { ReportWatchResType } from '@/schemaValidations/lecture.schema'
import { Settings } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type Hls from 'hls.js'

// 1 mức chất lượng trong bản HLS. index = vị trí trong hls.levels (hls.js chọn mức theo số này)
type QualityLevel = { index: number; height: number }
const AUTO_LEVEL = -1 // hls.js: -1 = tự chọn theo tốc độ mạng

// Cứ xem thêm chừng này giây thì báo backend 1 lần (ngoài ra còn báo khi dừng, hết video, rời bài)
const REPORT_EVERY_SEC = 15
// 2 lần timeupdate liên tiếp cách nhau tối đa vài trăm ms (×2 khi phát nhanh, tab nền thì thưa hơn).
// Nhảy xa hơn mức này = người dùng TUA → không tính là đã xem
const MAX_NORMAL_STEP_SEC = 3

// Trình phát video của trang học:
//   - mở bài: tua tới chỗ đang xem dở lần trước (startAtSec)
//   - đếm số giây video THỰC SỰ phát (tua qua không tính), báo backend định kỳ
//   - backend cộng dồn, đủ 90% thời lượng thì tự đánh dấu học xong → onReported nhận completed: true
// key={lectureId} ở chỗ dùng: đổi bài thì component tạo mới hoàn toàn (bộ đếm về 0, không phát tiếp video cũ)
export default function LectureVideo({
  lectureId,
  src,
  hlsUrl,
  startAtSec,
  onReported
}: {
  lectureId: number
  src: string
  hlsUrl: string | null
  startAtSec: number
  onReported?: (data: ReportWatchResType['data']) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastTimeRef = useRef(0) // vị trí ở lần timeupdate trước
  const unreportedRef = useRef(0) // số giây đã xem nhưng chưa báo
  // mutate của React Query giữ nguyên qua các lần render → dùng trong useCallback / useEffect an toàn
  const { mutate } = useReportWatchMutation()

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

  // useRef cho onReported: luôn gọi bản mới nhất mà không phải đưa vào dependency của report
  const onReportedRef = useRef(onReported)
  useEffect(() => {
    onReportedRef.current = onReported
  })

  // atEnd: hết video → làm tròn phần lẻ (5,06 giây → 5) vì không còn "lần sau" để gửi nốt
  const report = useCallback(
    (atEnd = false) => {
      const video = videoRef.current
      // Bình thường chỉ gửi số giây tròn, phần lẻ để dành lần sau (không làm mất giây nào)
      const playedSec = atEnd ? Math.round(unreportedRef.current) : Math.floor(unreportedRef.current)
      if (!video || playedSec < 1) return
      // max 0: làm tròn LÊN lúc hết video (4,6 → 5) thì phần còn lại không bị âm
      unreportedRef.current = Math.max(0, unreportedRef.current - playedSec)
      mutate(
        { lectureId, body: { playedSec, positionSec: Math.floor(video.currentTime) } },
        { onSuccess: (res) => onReportedRef.current?.(res.payload.data) }
      )
    },
    [lectureId, mutate]
  )

  // Rời bài (đổi bài, về trang khác) hoặc chuyển sang tab khác → báo nốt phần chưa báo
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') report()
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      report()
    }
  }, [report])
  // Chọn nguồn phát: có HLS thì phát HLS, không có hoặc HLS lỗi thì phát mp4.
  // <video> không đặt prop src: để effect này tự gán, tránh trình duyệt tải mp4 trước rồi mới chuyển sang HLS
  useEffect(() => {
    const video = videoRef.current
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
  }, [hlsUrl, src])

  const autoLabel = playingHeight ? `Tự động (${playingHeight}p)` : 'Tự động'
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
                aria-label='Chọn chất lượng video'
              >
                <Settings />
                {buttonLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Chất lượng</DropdownMenuLabel>
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
      <video
        ref={videoRef}
        controls
        className='size-full'
        onLoadedMetadata={(e) => {
          const video = e.currentTarget
          // Xem tiếp từ chỗ dừng (trừ khi đã ở sát cuối video → xem lại từ đầu)
          if (startAtSec > 0 && startAtSec < video.duration - 5) video.currentTime = startAtSec
          lastTimeRef.current = video.currentTime
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget
          const step = video.currentTime - lastTimeRef.current
          lastTimeRef.current = video.currentTime
          if (video.seeking || step <= 0 || step > MAX_NORMAL_STEP_SEC) return
          unreportedRef.current += step
          if (unreportedRef.current >= REPORT_EVERY_SEC) report()
        }}
        // Tua xong: lấy mốc mới, đoạn vừa nhảy qua không bị tính
        onSeeked={(e) => {
          lastTimeRef.current = e.currentTarget.currentTime
        }}
        // Bọc arrow function: truyền thẳng report thì event bị nhận nhầm thành tham số atEnd
        onPause={() => report()}
        onEnded={() => report(true)}
      />
    </div>
  )
}
