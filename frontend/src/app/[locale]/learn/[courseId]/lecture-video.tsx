'use client'

import { useReportWatchMutation } from '@/queries/useLecture'
import { ReportWatchResType } from '@/schemaValidations/lecture.schema'
import { useCallback, useEffect, useRef } from 'react'
import type Hls from 'hls.js'

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
        hls.on(HlsClass.Events.ERROR, (_event, data) => {
          if (!data.fatal) return // lỗi nhẹ: hls.js tự xử lý được
          // Lỗi nặng (vd bản HLS chưa tạo xong vì video vừa upload) → quay về mp4
          hls?.destroy()
          hls = null
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
      video.removeEventListener('error', fallbackToMp4)
    }
  }, [hlsUrl, src])

  return (
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
  )
}
