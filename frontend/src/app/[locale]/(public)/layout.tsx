import AccountMenu from '@/components/account-menu'
import BackToTop from '@/components/back-to-top'
import DarkModeToggle from '@/components/dark-mode-toggle'
import LocaleSwitcher from '@/components/locale-switcher'
import Logo from '@/components/logo'
import NotificationBell from '@/components/notification-bell'
import { Suspense } from 'react'
import AuthButtons from './auth-buttons'
import MobileNav from './mobile-nav'
import MainMenu from './main-menu'
import OrdersButton from './orders-button'
import SearchDialog from './search-dialog'
import categoryApiRequest from '@/apiRequests/category'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Mail } from 'lucide-react'

// Layout chung cho các trang công khai: (public) là route group, KHÔNG có trong URL.
// Bố cục theo EduPress:
//   ┌── header 1 hàng, cao 72px: logo · menu giữa (xl+) · ngôn ngữ · sáng/tối · giỏ · chuông · Đăng nhập / Đăng ký · 🔍 ──┐
//   │  nội dung trang (khung 1290px, container-page)                                                                │
//   │  footer nền xám 4 cột: giới thiệu · Hỗ trợ · Chủ đề (danh mục thật) · Liên hệ — dòng bản quyền                 │
// Màn hình nhỏ hơn xl: menu giữa chuyển vào menu trượt (MobileNav)

const GITHUB_URL = 'https://github.com/DoanDatt/Edu_Platform'
const CONTACT_EMAIL = 'doancongdat2004@gmail.com'

// Khóa dịch trong namespace "Footer" (messages/*.json): gõ sai khóa là TypeScript báo lỗi
type FooterKey = Parameters<ReturnType<typeof useTranslations<'Footer'>>>[0]

// Cột "Hỗ trợ" ở footer (EduPress: GET HELP)
const helpLinks: { label: FooterKey; href: string }[] = [
  { label: 'faq', href: '/about#hoi-dap' },
  { label: 'latestArticles', href: '/blog' },
  { label: 'about', href: '/about' },
  { label: 'freeCourses', href: '/courses?price=free' }
]

// Danh mục lấy 1 lần dùng cho cả menu lớn "Khóa học", ô chọn trong hộp thoại tìm kiếm và cột Chủ đề ở footer.
// Next tự gộp các lần gọi fetch giống nhau trong cùng 1 lần dựng trang → không tốn thêm request
const getCategories = () =>
  categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Header')
  const tFooter = useTranslations('Footer')

  return (
    // overflow-x-clip: khối tràn ngang (banner trang chủ dùng w-screen) không làm trang bị cuộn ngang.
    // Dùng clip chứ không dùng hidden: hidden tạo khung cuộn mới → header sticky bên trong hết dính
    <div className='flex min-h-screen w-full flex-col overflow-x-clip'>
      {/* Header sticky nền trắng, viền dưới xám nhạt (#EAEAEA), cao 72px như EduPress */}
      <header className='sticky top-0 z-40 w-full border-b bg-background'>
        {/* relative: tấm menu lớn (Khóa học, Blog) định vị theo khung này → canh giữa header */}
        <div className='relative container-page flex h-18 items-center justify-between gap-2 sm:gap-4'>
          <Logo />

          {/* Menu giữa: chỉ hiện từ xl (đủ chỗ cho 5 mục chữ 16px). MainMenu dùng usePathname():
              ở route động pathname chỉ biết lúc chạy → bọc Suspense */}
          <nav className='hidden h-full xl:block' aria-label={t('mainNav')}>
            <Suspense fallback={null}>
              <HeaderMenu />
            </Suspense>
          </nav>

          <div className='flex items-center sm:gap-1'>
            <LocaleSwitcher />
            <DarkModeToggle />
            {/* Đã đăng nhập: giỏ (đơn chờ thanh toán) + chuông thông báo. Chưa đăng nhập: không hiện */}
            <OrdersButton />
            <NotificationBell />
            {/* Chưa đăng nhập: chữ "Đăng nhập / Đăng ký". Đã đăng nhập: avatar + menu tài khoản */}
            <div className='mx-2 flex items-center sm:mx-3'>
              <AuthButtons />
              <AccountMenu />
            </div>
            {/* Nút tìm kiếm tròn viền cam: mở hộp thoại tìm kiếm (danh mục lấy ở server; đang tải thì chưa có ô chọn) */}
            <Suspense fallback={<SearchDialog />}>
              <HeaderSearchButton />
            </Suspense>
            {/* Dưới xl: nút mở menu trượt (menu + đăng nhập / đăng ký) */}
            <MobileNav />
          </div>
        </div>
      </header>

      {/* min-w-0: cho phép nội dung co lại, không bị bảng / chữ dài đẩy tràn ngang */}
      {/* pb lớn thay cho margin-top của footer: khối tràn ngang cuối trang (dải kêu gọi ở trang chủ)
          dùng margin âm đúng bằng pb này để nối liền với footer */}
      <main className='container-page flex min-w-0 flex-1 flex-col pt-6 pb-16 md:pt-8 md:pb-20'>{children}</main>

      {/* Footer EduPress: nền White_grey, cách trên 90px, 4 cột (410 · 190 · 190 · 410 trên khung 1290) */}
      <footer className='bg-muted'>
        <div className='container-page grid gap-10 pt-16 pb-12 md:grid-cols-2 lg:grid-cols-[410fr_190fr_190fr_410fr] lg:gap-8 lg:pt-[90px] lg:pb-[90px]'>
          <div className='flex flex-col gap-6 lg:gap-8'>
            <Logo />
            <p className='max-w-sm text-base leading-relaxed text-muted-foreground lg:text-lg'>{tFooter('tagline')}</p>
          </div>

          <FooterColumn title={tFooter('getHelp')}>
            {helpLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {tFooter(link.label)}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Cột "Chủ đề": danh mục thật (đông khóa nhất), đang tải thì để trống */}
          <FooterColumn title={tFooter('programs')}>
            <Suspense fallback={null}>
              <FooterCategories />
            </Suspense>
          </FooterColumn>

          <FooterColumn title={tFooter('contactUs')}>
            <p className='text-base leading-relaxed text-muted-foreground lg:text-lg'>{tFooter('contactText')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className='w-fit text-base break-all text-muted-foreground transition-colors hover:text-primary lg:text-lg'
            >
              {tFooter('email')}: {CONTACT_EMAIL}
            </a>
            {/* Icon mạng xã hội 20px, cách nhau 12px như EduPress — chỉ để link thật */}
            <div className='flex items-center gap-3 pt-1 text-muted-foreground'>
              <a
                href={GITHUB_URL}
                target='_blank'
                rel='noreferrer'
                aria-label={tFooter('sourceCode')}
                className='transition-colors hover:text-primary'
              >
                <GithubIcon />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label={tFooter('email')}
                className='transition-colors hover:text-primary'
              >
                <Mail className='size-5' />
              </a>
            </div>
          </FooterColumn>
        </div>

        {/* Dòng bản quyền: kẻ trên #EAEAEA trong khung 1290, chữ giữa */}
        <div className='container-page'>
          <p className='border-t py-8 text-center text-sm text-muted-foreground lg:text-base'>{tFooter('copyright')}</p>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}

// Menu giữa header + danh mục cho menu lớn "Khóa học". Lỗi API → menu vẫn hiện, chỉ thiếu phần danh mục
async function HeaderMenu() {
  return <MainMenu categories={await getCategories()} />
}

async function HeaderSearchButton() {
  return <SearchDialog categories={await getCategories()} />
}

// 5 danh mục đông khóa nhất → lọc sẵn trang /courses
async function FooterCategories() {
  const t = await getTranslations('Footer')
  const categories = (await getCategories()).toSorted((a, b) => b.courseCount - a.courseCount).slice(0, 5)
  return (
    <>
      {categories.map((category) => (
        <FooterLink key={category.id} href={`/courses?categoryId=${category.id}`}>
          {category.name}
        </FooterLink>
      ))}
      <FooterLink href='/courses'>{t('allCourses')}</FooterLink>
    </>
  )
}

// 1 cột footer: tiêu đề Exo 20px in hoa, cách nội dung 32px; link Jost 18px, dòng cao 2.5 (≈ 45px mỗi link)
function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className='flex flex-col gap-5 lg:gap-8'>
      <h3 className='text-xl uppercase'>{title}</h3>
      <div className='flex flex-col gap-3 lg:gap-4'>{children}</div>
    </nav>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className='w-fit text-base font-medium text-muted-foreground transition-colors hover:text-primary lg:text-lg'
    >
      {children}
    </Link>
  )
}

// Lucide bản mới bỏ icon thương hiệu → vẽ icon GitHub bằng SVG (biểu tượng chính thức, 20px)
function GithubIcon() {
  return (
    <svg aria-hidden viewBox='0 0 24 24' fill='currentColor' className='size-5'>
      <path d='M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z' />
    </svg>
  )
}
