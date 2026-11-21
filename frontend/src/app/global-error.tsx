'use client' // Error Boundary bắt buộc là Client Component

// Lỗi ngay ở root layout ([locale]/layout.tsx) → error.tsx không bắt được, Next dùng file này THAY cho cả layout.
// Vì thay cả layout nên ở đây KHÔNG có next-intl (không biết ngôn ngữ), theme, font → tự dựng <html>, <body>
// và ghi cả 2 thứ tiếng. Rất hiếm khi xảy ra, nên giữ đơn giản.
// Style viết thẳng (inline), KHÔNG import globals.css: import ở đây làm Next tải trước file CSS đó ở MỌI trang
// mà không dùng tới (trình duyệt báo "preloaded but not used", tốn thêm 1 request)
const ORANGE = '#ff782d' // --primary trong globals.css

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang='vi'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 16,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#000',
          background: '#fff'
        }}
      >
        <title>EduPlatform</title>
        <p aria-hidden style={{ margin: 0, fontSize: 72, lineHeight: 1, fontWeight: 700, color: ORANGE }}>
          500
        </p>
        <h1 style={{ margin: 0, fontSize: 24 }}>Đã có lỗi xảy ra · Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: 448, color: '#555' }}>
          Vui lòng thử lại sau ít phút. · Please try again in a few minutes.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type='button'
            onClick={() => retry()}
            style={{ ...buttonStyle, border: 'none', background: ORANGE, color: '#fff' }}
          >
            Thử lại · Try again
          </button>
          {/* <a> thường là CỐ Ý: root layout đang lỗi → cần tải lại cả trang, không điều hướng phía client
              (Link của next-intl cũng không chạy được vì ở đây không có provider) */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href='/' style={{ ...buttonStyle, border: '1px solid #eaeaea', color: '#000', textDecoration: 'none' }}>
            Trang chủ · Home
          </a>
        </div>
      </body>
    </html>
  )
}

const buttonStyle: React.CSSProperties = {
  borderRadius: 6,
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer'
}
