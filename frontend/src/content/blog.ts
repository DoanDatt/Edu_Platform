import { BookOpenCheck, Code, CreditCard, GitBranch, LucideIcon, Target } from 'lucide-react'
import type { Locale } from 'next-intl'

// Blog của EduPlatform: bài viết LƯU TRONG CODE (chưa cần backend / trang quản trị bài viết).
// Muốn admin tự viết bài thì sau này chuyển sang bảng Post trong database + API, giao diện giữ nguyên.
// Nội dung bài là các khối đơn giản (đoạn văn, tiêu đề, danh sách, mẹo, nút) → tự vẽ, không cần thư viện Markdown.
// Song ngữ: mỗi bài có bản vi và en; trang lấy đúng bản theo ngôn ngữ đang xem (localizePost)

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'tip'; text: string } // khung ghi chú nổi bật
  | { type: 'cta'; label: string; href: string } // nút dẫn tới trang trong web

export const blogCategories = {
  'lap-trinh': { vi: 'Lập trình', en: 'Programming' },
  'kinh-nghiem': { vi: 'Kinh nghiệm học tập', en: 'Study tips' },
  'huong-dan': { vi: 'Hướng dẫn sử dụng', en: 'How-to guides' }
} satisfies Record<string, Record<Locale, string>>
export type BlogCategory = keyof typeof blogCategories

type BlogPostText = { title: string; excerpt: string; content: BlogBlock[] }

type BlogPostSource = {
  slug: string // giống nhau ở 2 ngôn ngữ: /blog/abc và /en/blog/abc là cùng 1 bài
  category: BlogCategory
  publishedAt: string // YYYY-MM-DD
  readingMinutes: number
  Icon: LucideIcon // icon lớn trên ảnh bìa tự vẽ
  gradient: string // nền ảnh bìa (viết đủ tên class để Tailwind sinh CSS)
} & Record<Locale, BlogPostText>

// Bài viết đã chọn sẵn 1 ngôn ngữ: component chỉ cần post.title, post.content...
export type BlogPost = Omit<BlogPostSource, Locale> & BlogPostText

const blogPostSources: BlogPostSource[] = [
  {
    slug: 'lo-trinh-tu-hoc-frontend',
    category: 'lap-trinh',
    publishedAt: '2026-10-28',
    readingMinutes: 6,
    Icon: Code,
    gradient: 'from-sky-400 via-sky-500 to-blue-700',
    vi: {
      title: 'Lộ trình tự học Frontend cho người mới bắt đầu',
      excerpt:
        'Học theo thứ tự nào để không bị ngợp: HTML, CSS, JavaScript, React rồi Next.js, kèm mẹo thực hành mỗi giai đoạn.',
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
    en: {
      title: 'A self-study Frontend roadmap for beginners',
      excerpt:
        'The order to learn things without feeling overwhelmed: HTML, CSS, JavaScript, React, then Next.js, with practice tips for each stage.',
      content: [
        {
          type: 'p',
          text: 'Frontend is the part of a website that users see and interact with. Beginners often feel overwhelmed by the sheer number of technologies. The easiest path is to learn layer by layer, each one building on the previous.'
        },
        { type: 'h2', text: '1. HTML and CSS: the foundation' },
        {
          type: 'p',
          text: 'HTML describes the content (headings, paragraphs, images, forms) while CSS controls the presentation (colors, layout, spacing). Get comfortable with Flexbox, Grid and building responsive layouts for phones.'
        },
        {
          type: 'ul',
          items: [
            'Rebuild 2–3 websites you like using only HTML and CSS',
            "Open your browser's DevTools to see how other sites are built",
            'Practice making layouts that work on both phones and desktops'
          ]
        },
        { type: 'h2', text: '2. JavaScript: bringing pages to life' },
        {
          type: 'p',
          text: 'JavaScript handles interaction: clicking buttons, submitting forms, fetching data from a server. Before picking up a framework, make sure you know the core: variables, functions, arrays, objects, async code (Promise, async/await) and working with the DOM.'
        },
        {
          type: 'tip',
          text: "Don't rush into React before you can build a small app in plain JavaScript (for example, a to-do list where you can add, edit and delete items)."
        },
        { type: 'h2', text: '3. React and Next.js: building real apps' },
        {
          type: 'p',
          text: 'React lets you split the UI into reusable components. Next.js adds routing, server-side rendering and SEO optimization, and is widely used at work. At this stage, build a project big enough to include login, API calls, pagination and validated forms.'
        },
        { type: 'h2', text: '4. Supporting tools' },
        {
          type: 'ul',
          items: [
            'Git and GitHub to manage source code and work in a team',
            'TypeScript to write safer code as the project grows',
            'A styling library (Tailwind CSS) to build fast and still look good'
          ]
        },
        {
          type: 'p',
          text: 'End each stage with a small project pushed to GitHub. A few months later, that becomes the portfolio you show when applying for jobs.'
        },
        { type: 'cta', label: 'Browse Web Development courses', href: '/courses?search=web' }
      ]
    }
  },
  {
    slug: 'hoc-online-hieu-qua',
    category: 'kinh-nghiem',
    publishedAt: '2026-10-25',
    readingMinutes: 4,
    Icon: Target,
    gradient: 'from-teal-400 via-cyan-500 to-cyan-700',
    vi: {
      title: '5 cách học online hiệu quả, không bỏ dở giữa chừng',
      excerpt: 'Học online dễ bắt đầu nhưng khó đi đến cuối. Năm thói quen nhỏ giúp bạn giữ nhịp và học xong khóa học.',
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
    en: {
      title: '5 ways to learn online effectively and actually finish',
      excerpt:
        'Online courses are easy to start but hard to finish. Five small habits help you keep the pace and complete your course.',
      content: [
        {
          type: 'p',
          text: "Most online learners don't quit because the course is hard, but because they lose momentum. Here are five habits that help you study consistently."
        },
        { type: 'h2', text: '1. Set a fixed schedule, even just 30 minutes' },
        {
          type: 'p',
          text: 'Studying 30 minutes a day beats cramming 4 hours on the weekend. Pick a fixed time slot and treat it as an appointment with yourself.'
        },
        { type: 'h2', text: '2. Practice right after each lesson' },
        {
          type: 'p',
          text: "Watching videos without practicing means you'll forget within days. Keep your editor open alongside, follow the instructor, then change things a little on your own."
        },
        { type: 'h2', text: '3. Track your progress' },
        {
          type: 'p',
          text: 'Watching a progress bar grow is a huge motivator. On EduPlatform, the "My courses" page shows your completion percentage and suggests what to continue next.'
        },
        { type: 'h2', text: '4. Take notes in your own words' },
        {
          type: 'p',
          text: "After each lesson, write down 3–5 key points in your own words. If you can't, that's the part worth reviewing."
        },
        { type: 'h2', text: '5. Build something when you finish' },
        {
          type: 'p',
          text: "The real goal of a course isn't the certificate, it's what you can build. Pick a small project that uses everything you just learned."
        },
        {
          type: 'tip',
          text: 'Start with a short free course to build the habit first, then move on to longer ones.'
        },
        { type: 'cta', label: 'Browse free courses', href: '/courses?price=free' }
      ]
    }
  },
  {
    slug: 'huong-dan-mua-khoa-hoc',
    category: 'huong-dan',
    publishedAt: '2026-10-29',
    readingMinutes: 3,
    Icon: CreditCard,
    gradient: 'from-indigo-400 via-indigo-500 to-violet-700',
    vi: {
      title: 'Hướng dẫn mua khóa học và thanh toán trên EduPlatform',
      excerpt:
        'Từng bước mua khóa có phí: chuyển khoản quét mã QR (tự xác nhận) hoặc PayPal, và cách xem lại đơn hàng.',
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
    en: {
      title: 'How to buy a course and pay on EduPlatform',
      excerpt:
        'Step by step for paid courses: bank transfer via QR code (confirmed automatically) or PayPal, and how to review your orders.',
      content: [
        {
          type: 'p',
          text: 'For free courses, just click "Enroll for free" and start right away. For paid courses, follow the steps below.'
        },
        { type: 'h2', text: 'Step 1: Create an order' },
        {
          type: 'p',
          text: 'On the course page, click "Buy course". The system creates an order at the current price and takes you to the checkout page. Clicking buy again reuses the pending order instead of creating a duplicate.'
        },
        { type: 'h2', text: 'Step 2: Choose a payment method' },
        {
          type: 'ul',
          items: [
            'Bank transfer: scan the QR code with your banking app, the amount and reference are pre-filled. The system confirms automatically once the money arrives, usually within a minute.',
            'PayPal: for learners with a PayPal account or an international card, charged in USD at the converted rate.'
          ]
        },
        {
          type: 'tip',
          text: 'When transferring manually, use the order code (starting with EDU) as the transfer reference. The system uses it to match your payment to the right order.'
        },
        { type: 'h2', text: 'Step 3: Start learning' },
        {
          type: 'p',
          text: 'Once paid, the course unlocks automatically and the button on the course page changes to "Go to course". You can review all orders under Purchase history. Unpaid orders are cancelled automatically after 24 hours.'
        },
        { type: 'cta', label: 'View purchase history', href: '/my-orders' }
      ]
    }
  },
  {
    slug: 'tien-do-hoc-xem-du-90-phan-tram',
    category: 'huong-dan',
    publishedAt: '2026-10-29',
    readingMinutes: 3,
    Icon: BookOpenCheck,
    gradient: 'from-blue-500 via-blue-700 to-indigo-900',
    vi: {
      title: 'Tiến độ học hoạt động thế nào: vì sao cần xem đủ 90% video',
      excerpt: 'Bài học được tính hoàn thành khi bạn xem đủ 90% video. Tìm hiểu cách tính, cách xem tiếp từ chỗ dừng.',
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
    en: {
      title: 'How progress works: why you need to watch 90% of a video',
      excerpt:
        'A lesson counts as completed once you have watched 90% of its video. Learn how it is calculated and how to resume where you left off.',
      content: [
        {
          type: 'p',
          text: 'A completion percentage only means something if it reflects what you actually learned. That is why EduPlatform marks a lesson as completed when you really watch the video, not just when you click a button.'
        },
        { type: 'h2', text: 'How it is calculated' },
        {
          type: 'ul',
          items: [
            'The system adds up the seconds of video actually played. Parts you skip over do not count.',
            'Once you reach 90% of the duration, the lesson is marked completed automatically, nothing else to click.',
            'Text-only lessons (no video) have a "Mark as completed" button you click yourself.'
          ]
        },
        { type: 'h2', text: 'Resume where you left off' },
        {
          type: 'p',
          text: 'Your position is saved. Next time you open the lesson, the video jumps to that point so you can continue, even on another device.'
        },
        {
          type: 'tip',
          text: 'We chose 90% rather than 100% because videos usually end with a wrap-up and people often close a few seconds early. You will not get "stuck" over the last few seconds.'
        },
        { type: 'cta', label: 'Go to my courses', href: '/my-courses' }
      ]
    }
  },
  {
    slug: 'git-github-cho-nguoi-moi',
    category: 'lap-trinh',
    publishedAt: '2026-10-20',
    readingMinutes: 5,
    Icon: GitBranch,
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    vi: {
      title: 'Git và GitHub cho người mới: những lệnh cần biết đầu tiên',
      excerpt: 'Git giúp bạn lưu lại lịch sử thay đổi của code. Bảy lệnh cơ bản đủ dùng cho dự án cá nhân đầu tiên.',
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
    },
    en: {
      title: 'Git and GitHub for beginners: the first commands to know',
      excerpt:
        'Git keeps a history of every change to your code. Seven basic commands are enough for your first personal project.',
      content: [
        {
          type: 'p',
          text: 'Git is a version control tool: every save (commit) is a checkpoint you can review or go back to at any time. GitHub hosts Git repositories online so you can share them and collaborate.'
        },
        { type: 'h2', text: 'Seven everyday commands' },
        {
          type: 'ul',
          items: [
            'git init: turn a folder into a Git repository',
            'git status: see which files have changed',
            'git add: pick the changes to include in the next commit',
            'git commit -m "message": save a checkpoint with a description',
            'git log: view the commit history',
            'git push: upload your commits to GitHub',
            'git pull: download the latest changes from GitHub'
          ]
        },
        { type: 'h2', text: 'Writing clear commit messages' },
        {
          type: 'p',
          text: 'Briefly describe what you did, such as "Add login page" instead of "fix code". When you (or a recruiter) read the history later, it shows how the project evolved.'
        },
        {
          type: 'tip',
          text: 'Never push passwords, API keys or .env files to GitHub. List them in .gitignore from the very start.'
        },
        { type: 'cta', label: 'Browse Git and GitHub courses', href: '/courses?search=git' }
      ]
    }
  }
]

const localizePost = ({ vi, en, ...post }: BlogPostSource, locale: Locale): BlogPost => ({
  ...post,
  ...(locale === 'en' ? en : vi)
})

export const blogSlugs = blogPostSources.map((post) => post.slug)

// Mới nhất trước, đã chọn đúng ngôn ngữ
export const getBlogPosts = (locale: Locale) =>
  blogPostSources
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((post) => localizePost(post, locale))

export const getBlogPost = (slug: string, locale: Locale) => {
  const post = blogPostSources.find((item) => item.slug === slug)
  return post && localizePost(post, locale)
}

export const getBlogCategoryName = (category: BlogCategory, locale: Locale) => blogCategories[category][locale]

export const countBlogPosts = (category: BlogCategory) =>
  blogPostSources.filter((post) => post.category === category).length

// '2026-10-29' → vi '29/10/2026' · en 'Oct 29, 2026'. Dựng Date theo UTC + định dạng theo UTC: không lệch ngày theo múi giờ
export const formatBlogDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: locale === 'en' ? 'short' : '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${date}T00:00:00Z`))
