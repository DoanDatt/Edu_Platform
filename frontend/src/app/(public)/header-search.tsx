import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import Form from 'next/form'

// Ô tìm kiếm giữa header. <Form> của Next: form GET bình thường, bấm Enter thì chuyển trang
// /courses?search=... bằng điều hướng phía client (không tải lại cả trang), không cần useState / onSubmit.
// Trang /courses đọc ?search trên URL để lọc, ô tìm kiếm ở đó cũng tự điền theo URL
export default function HeaderSearch({ className }: { className?: string }) {
  return (
    <Form action='/courses' role='search' className={cn('relative', className)}>
      <Search className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground' />
      <input
        name='search'
        type='search'
        placeholder='Tìm khóa học...'
        aria-label='Tìm khóa học'
        className='h-10 w-full rounded-full border border-transparent bg-muted pr-4 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background'
      />
    </Form>
  )
}
