import { BookOpenCheck, Code, CreditCard, GitBranch, LucideIcon, Target } from 'lucide-react'

// Blog của EduPlatform: bài viết LƯU TRONG CODE (chưa cần backend / trang quản trị bài viết).
// Muốn admin tự viết bài thì sau này chuyển sang bảng Post trong database + API, giao diện giữ nguyên.
// Nội dung bài là các khối đơn giản (đoạn văn, tiêu đề, danh sách, mẹo, nút) → tự vẽ, không cần thư viện Markdown

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'tip'; text: string } // khung ghi chú nổi bật
  | { type: 'cta'; label: string; href: string } // nút dẫn tới trang trong web

export const blogCategories = {
  'lap-trinh': 'Lập trình',
  'kinh-nghiem': 'Kinh nghiệm học tập',
  'huong-dan': 'Hướng dẫn sử dụng'
} as const
export type BlogCategory = keyof typeof blogCategories

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  category: BlogCategory
  publishedAt: string // YYYY-MM-DD
  readingMinutes: number
  Icon: LucideIcon // icon lớn trên ảnh bìa tự vẽ
  gradient: string // nền ảnh bìa (viết đủ tên class để Tailwind sinh CSS)
  content: BlogBlock[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'lo-trinh-tu-hoc-frontend',
    title: 'Lộ trình tự học Frontend cho người mới bắt đầu',
    excerpt:
      'Học theo thứ tự nào để không bị ngợp: HTML, CSS, JavaScript, React rồi Next.js, kèm mẹo thực hành mỗi giai đoạn.',
    category: 'lap-trinh',
    publishedAt: '2026-10-28',
    readingMinutes: 6,
    Icon: Code,
    gradient: 'from-sky-400 via-sky-500 to-blue-700',
    content: [
      {
        type: 'p',
        text: 'Frontend là phần người dùng nhìn thấy và tương tác trên một website. Người mới thường bị ngợp vì có quá nhiều công nghệ. Cách dễ nhất là học theo từng tầng, tầng sau xây trên tầng trước.'
      },
      { type: 'h2', text: '1. HTML và CSS: nền móng' },
      {
        type: 'p',
        text: 'HTML mô tả nội dung (tiêu đề, đoạn văn, hình ảnh, form), CSS quyết định trình bày (màu sắc, bố cục, khoảng cách). Hãy nắm chắc Flexbox, Grid và cách làm giao diện responsive cho điện thoại.'
      },
      {
        type: 'ul',
        items: [
          'Tự dựng lại 2–3 trang web bạn thích, chỉ bằng HTML và CSS',
          'Mở công cụ DevTools của trình duyệt để xem web khác dựng ra sao',
          'Tập làm giao diện chạy tốt trên cả điện thoại lẫn máy tính'
        ]
      },
      { type: 'h2', text: '2. JavaScript: làm trang web "sống"' },
      {
        type: 'p',
        text: 'JavaScript xử lý tương tác: bấm nút, gửi form, gọi dữ liệu từ máy chủ. Trước khi học framework, hãy chắc các phần cốt lõi: biến, hàm, mảng, object, xử lý bất đồng bộ (Promise, async/await) và thao tác với DOM.'
      },
      {
        type: 'tip',
        text: 'Đừng vội học React khi chưa viết được một ứng dụng nhỏ bằng JavaScript thuần (ví dụ: danh sách việc cần làm có thêm, sửa, xóa).'
      },
      { type: 'h2', text: '3. React và Next.js: xây ứng dụng thật' },
      {
        type: 'p',
        text: 'React giúp chia giao diện thành các component tái sử dụng. Next.js bổ sung định tuyến, render phía server và tối ưu SEO, rất phổ biến khi đi làm. Ở giai đoạn này, hãy làm một dự án đủ lớn: có đăng nhập, gọi API, phân trang, form có kiểm tra dữ liệu.'
      },
      { type: 'h2', text: '4. Công cụ đi kèm' },
      {
        type: 'ul',
        items: [
          'Git và GitHub để quản lý mã nguồn và làm việc nhóm',
          'TypeScript để code an toàn hơn khi dự án lớn dần',
          'Một thư viện giao diện (Tailwind CSS) để làm nhanh mà vẫn đẹp'
        ]
      },
      {
        type: 'p',
        text: 'Mỗi giai đoạn nên kết thúc bằng một sản phẩm nhỏ đưa lên GitHub. Sau vài tháng, đó chính là portfolio để bạn đi xin việc.'
      },
      { type: 'cta', label: 'Xem các khóa Lập trình Web', href: '/courses?search=web' }
    ]
  },
  {
    slug: 'hoc-online-hieu-qua',
    title: '5 cách học online hiệu quả, không bỏ dở giữa chừng',
    excerpt: 'Học online dễ bắt đầu nhưng khó đi đến cuối. Năm thói quen nhỏ giúp bạn giữ nhịp và học xong khóa học.',
    category: 'kinh-nghiem',
    publishedAt: '2026-10-25',
    readingMinutes: 4,
    Icon: Target,
    gradient: 'from-teal-400 via-cyan-500 to-cyan-700',
    content: [
      {
        type: 'p',
        text: 'Phần lớn người học online bỏ dở không phải vì khóa học khó, mà vì mất nhịp. Dưới đây là năm thói quen giúp bạn học đều đặn.'
      },
      { type: 'h2', text: '1. Đặt lịch cố định, dù chỉ 30 phút' },
      {
        type: 'p',
        text: 'Học 30 phút mỗi ngày tốt hơn học dồn 4 tiếng vào cuối tuần. Chọn một khung giờ cố định và coi đó là cuộc hẹn với chính mình.'
      },
      { type: 'h2', text: '2. Học xong bài nào, làm ngay bài đó' },
      {
        type: 'p',
        text: 'Xem video mà không thực hành thì vài ngày sau sẽ quên. Mở trình soạn thảo song song, làm lại theo giảng viên rồi tự thay đổi một chút.'
      },
      { type: 'h2', text: '3. Theo dõi tiến độ' },
      {
        type: 'p',
        text: 'Nhìn thấy thanh tiến độ tăng lên là động lực rất lớn. Trên EduPlatform, trang "Khóa học của tôi" hiển thị phần trăm hoàn thành và gợi ý khóa nên học tiếp.'
      },
      { type: 'h2', text: '4. Ghi chú bằng lời của mình' },
      {
        type: 'p',
        text: 'Sau mỗi bài, viết lại 3–5 ý chính bằng ngôn ngữ của bạn. Nếu không tự viết lại được, đó là phần cần xem lại.'
      },
      { type: 'h2', text: '5. Học xong thì làm một sản phẩm' },
      {
        type: 'p',
        text: 'Mục tiêu cuối cùng của khóa học không phải chứng nhận, mà là thứ bạn làm ra được. Hãy chọn một dự án nhỏ áp dụng toàn bộ kiến thức vừa học.'
      },
      {
        type: 'tip',
        text: 'Bắt đầu bằng một khóa miễn phí, ngắn để tạo thói quen trước, rồi mới đến các khóa dài hơn.'
      },
      { type: 'cta', label: 'Xem khóa học miễn phí', href: '/courses?price=free' }
    ]
  },
  {
    slug: 'huong-dan-mua-khoa-hoc',
    title: 'Hướng dẫn mua khóa học và thanh toán trên EduPlatform',
    excerpt: 'Từng bước mua khóa có phí: chuyển khoản quét mã QR (tự xác nhận) hoặc PayPal, và cách xem lại đơn hàng.',
    category: 'huong-dan',
    publishedAt: '2026-10-29',
    readingMinutes: 3,
    Icon: CreditCard,
    gradient: 'from-indigo-400 via-indigo-500 to-violet-700',
    content: [
      {
        type: 'p',
        text: 'Khóa miễn phí chỉ cần bấm "Ghi danh miễn phí" là học được ngay. Với khóa có phí, bạn làm theo các bước dưới đây.'
      },
      { type: 'h2', text: 'Bước 1: Tạo đơn hàng' },
      {
        type: 'p',
        text: 'Ở trang chi tiết khóa học, bấm "Mua khóa học". Hệ thống tạo một đơn hàng với giá hiện tại và chuyển bạn sang trang thanh toán. Bấm mua nhiều lần cũng chỉ dùng lại đơn đang chờ, không tạo đơn trùng.'
      },
      { type: 'h2', text: 'Bước 2: Chọn cách thanh toán' },
      {
        type: 'ul',
        items: [
          'Chuyển khoản ngân hàng: quét mã QR bằng app ngân hàng, số tiền và nội dung được điền sẵn. Hệ thống tự xác nhận khi tiền về, thường trong vòng 1 phút.',
          'PayPal: dành cho người học dùng tài khoản PayPal hoặc thẻ quốc tế, thanh toán bằng USD theo tỉ giá quy đổi.'
        ]
      },
      {
        type: 'tip',
        text: 'Khi chuyển khoản tay, hãy ghi đúng nội dung là mã đơn (bắt đầu bằng EDU). Hệ thống dựa vào mã này để biết bạn thanh toán cho đơn nào.'
      },
      { type: 'h2', text: 'Bước 3: Vào học' },
      {
        type: 'p',
        text: 'Thanh toán xong, khóa học tự động mở và nút trên trang chi tiết đổi thành "Vào học". Bạn xem lại mọi đơn hàng trong mục Lịch sử mua hàng. Đơn chưa thanh toán sẽ tự hủy sau 24 giờ.'
      },
      { type: 'cta', label: 'Xem lịch sử mua hàng', href: '/my-orders' }
    ]
  },
  {
    slug: 'tien-do-hoc-xem-du-90-phan-tram',
    title: 'Tiến độ học hoạt động thế nào: vì sao cần xem đủ 90% video',
    excerpt: 'Bài học được tính hoàn thành khi bạn xem đủ 90% video. Tìm hiểu cách tính, cách xem tiếp từ chỗ dừng.',
    category: 'huong-dan',
    publishedAt: '2026-10-29',
    readingMinutes: 3,
    Icon: BookOpenCheck,
    gradient: 'from-blue-500 via-blue-700 to-indigo-900',
    content: [
      {
        type: 'p',
        text: 'Phần trăm hoàn thành chỉ có ý nghĩa khi phản ánh đúng việc bạn đã học. Vì vậy EduPlatform tính bài học là hoàn thành khi bạn thực sự xem đủ video, không chỉ bấm một nút.'
      },
      { type: 'h2', text: 'Cách tính' },
      {
        type: 'ul',
        items: [
          'Hệ thống cộng dồn số giây video thực sự phát. Đoạn bạn tua qua không được tính.',
          'Xem đủ 90% thời lượng, bài học tự đánh dấu hoàn thành, bạn không cần bấm gì thêm.',
          'Bài chỉ có nội dung chữ (không có video) thì bạn tự bấm "Đánh dấu đã học".'
        ]
      },
      { type: 'h2', text: 'Xem tiếp từ chỗ dừng' },
      {
        type: 'p',
        text: 'Vị trí bạn đang xem được lưu lại. Lần sau mở bài, video tự tua tới đúng chỗ đó để bạn học tiếp, kể cả khi đổi sang thiết bị khác.'
      },
      {
        type: 'tip',
        text: 'Chọn 90% thay vì 100% vì cuối video thường là phần kết, người học hay tắt sớm vài giây. Bạn không bị "kẹt" chỉ vì thiếu mấy giây cuối.'
      },
      { type: 'cta', label: 'Vào khóa học của tôi', href: '/my-courses' }
    ]
  },
  {
    slug: 'git-github-cho-nguoi-moi',
    title: 'Git và GitHub cho người mới: những lệnh cần biết đầu tiên',
    excerpt: 'Git giúp bạn lưu lại lịch sử thay đổi của code. Bảy lệnh cơ bản đủ dùng cho dự án cá nhân đầu tiên.',
    category: 'lap-trinh',
    publishedAt: '2026-10-20',
    readingMinutes: 5,
    Icon: GitBranch,
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    content: [
      {
        type: 'p',
        text: 'Git là công cụ quản lý phiên bản: mỗi lần lưu (commit) là một mốc, bạn có thể xem lại hoặc quay về mốc cũ bất cứ lúc nào. GitHub là nơi lưu trữ kho Git trên mạng để chia sẻ và làm việc nhóm.'
      },
      { type: 'h2', text: 'Bảy lệnh dùng hằng ngày' },
      {
        type: 'ul',
        items: [
          'git init: biến một thư mục thành kho Git',
          'git status: xem file nào đã thay đổi',
          'git add: chọn các thay đổi sẽ đưa vào lần lưu tiếp theo',
          'git commit -m "mô tả": lưu một mốc kèm lời mô tả',
          'git log: xem lịch sử các lần lưu',
          'git push: đẩy các lần lưu lên GitHub',
          'git pull: kéo thay đổi mới nhất từ GitHub về máy'
        ]
      },
      { type: 'h2', text: 'Viết mô tả commit sao cho dễ hiểu' },
      {
        type: 'p',
        text: 'Mô tả ngắn gọn bạn đã làm gì, ví dụ "Thêm trang đăng nhập" thay vì "sửa code". Sau này đọc lại lịch sử, bạn (và nhà tuyển dụng) sẽ hiểu dự án phát triển ra sao.'
      },
      {
        type: 'tip',
        text: 'Không bao giờ đưa mật khẩu, khóa API hay file .env lên GitHub. Hãy liệt kê chúng trong file .gitignore ngay từ đầu.'
      },
      { type: 'cta', label: 'Xem khóa Git và GitHub', href: '/courses?search=git' }
    ]
  }
]

// Mới nhất trước
export const sortedBlogPosts = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export const getBlogPost = (slug: string) => blogPosts.find((post) => post.slug === slug)

// '2026-10-29' → '29/10/2026' (cắt chuỗi, không new Date: tránh lệch ngày theo múi giờ)
export const formatBlogDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
