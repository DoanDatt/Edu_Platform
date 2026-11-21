// Khung chung cho trang 404 và trang lỗi: mã lớn màu cam (font Exo như tiêu đề EduPress), tiêu đề, mô tả, các nút.
// Không dùng hook → dùng được ở cả Server Component (not-found) lẫn Client Component (error)
export default function StatusScreen({
  code,
  title,
  description,
  children
}: {
  code: string // '404', '500'...
  title: string
  description: string
  children?: React.ReactNode // các nút: Thử lại, Về trang chủ...
}) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center'>
      <p aria-hidden className='font-heading text-7xl leading-none font-bold text-primary sm:text-8xl'>
        {code}
      </p>
      <h1 className='text-2xl sm:text-3xl'>{title}</h1>
      <p className='max-w-md text-muted-foreground'>{description}</p>
      {children && <div className='mt-2 flex flex-wrap justify-center gap-3'>{children}</div>}
    </div>
  )
}
