import { cn } from '@/lib/utils'

// Khối TRÀN HẾT chiều ngang màn hình dù nằm trong <main> rộng tối đa 7xl (nền màu chạy từ mép trái tới mép phải),
// còn nội dung bên trong vẫn gói trong khung 7xl → thẳng hàng với các khối thường.
//   w-screen + left-1/2 + -translate-x-1/2: rộng bằng màn hình, đặt giữa → chìa ra 2 bên khỏi khung <main>
// Layout (public) có overflow-x-clip: w-screen tính cả thanh cuộn nên dư vài px, không cắt thì trang cuộn ngang
// decoration: lớp trang trí (sóng, vầng sáng...) đặt ở lớp NGOÀI → trải hết chiều ngang màn hình,
// không bị bó trong khung 7xl như nội dung; nội dung (relative) nằm đè lên trên
export default function FullBleed({
  className,
  innerClassName,
  decoration,
  children,
  ...props
}: React.ComponentProps<'section'> & { innerClassName?: string; decoration?: React.ReactNode }) {
  return (
    <section className={cn('relative left-1/2 w-screen -translate-x-1/2 overflow-hidden', className)} {...props}>
      {decoration}
      <div className={cn('relative mx-auto w-full max-w-7xl px-4 md:px-6', innerClassName)}>{children}</div>
    </section>
  )
}
