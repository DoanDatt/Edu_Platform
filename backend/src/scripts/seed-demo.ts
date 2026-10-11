// Dữ liệu mẫu để làm frontend: giảng viên, học viên, danh mục, khóa học có bài giảng,
// ghi danh, tiến độ và đánh giá.
// Chạy: npm run seed:demo  (cần chạy npm run seed trước để có role + admin)
import prisma from '../lib/prisma'
import { RoleName } from '../constants/role'
import { CourseLevel, CourseStatus } from '../generated/prisma/enums'
import { hashPassword } from '../utils/crypto'

const DEMO_PASSWORD = 'Demo@1234'

const DEMO_USERS = [
  { email: 'giangvien1@edu.local', name: 'Nguyễn Văn An', role: RoleName.Instructor },
  { email: 'giangvien2@edu.local', name: 'Trần Thị Bình', role: RoleName.Instructor },
  { email: 'hocvien1@edu.local', name: 'Lê Minh Châu', role: RoleName.Student },
  { email: 'hocvien2@edu.local', name: 'Phạm Quốc Dũng', role: RoleName.Student },
] as const

const CATEGORIES = ['Lập trình Web', 'Thiết kế', 'Marketing', 'Khoa học dữ liệu']

// Video mẫu công khai (Google sample videos) + ảnh minh họa ngẫu nhiên theo seed
const SAMPLE_VIDEO = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const thumbnail = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`

type DemoCourse = {
  title: string
  subtitle: string
  category: string
  instructor: string
  price: number
  level: CourseLevel
  status: CourseStatus
  sections: { title: string; lectures: string[] }[]
}

const COURSES: DemoCourse[] = [
  {
    title: 'React từ cơ bản đến nâng cao',
    subtitle: 'Xây dựng ứng dụng web hiện đại với React, Hooks và React Router',
    category: 'Lập trình Web',
    instructor: 'giangvien1@edu.local',
    price: 0,
    level: CourseLevel.BEGINNER,
    status: CourseStatus.PUBLISHED,
    sections: [
      { title: 'Giới thiệu', lectures: ['React là gì?', 'Cài đặt môi trường'] },
      { title: 'Component và Props', lectures: ['JSX', 'Props', 'Chia nhỏ component'] },
      { title: 'Hooks', lectures: ['useState', 'useEffect', 'Custom hook'] },
    ],
  },
  {
    title: 'Node.js & Express xây dựng REST API',
    subtitle: 'Thiết kế API, xác thực JWT, phân quyền và làm việc với Prisma',
    category: 'Lập trình Web',
    instructor: 'giangvien1@edu.local',
    price: 499000,
    level: CourseLevel.INTERMEDIATE,
    status: CourseStatus.PUBLISHED,
    sections: [
      { title: 'Khởi động', lectures: ['Tổng quan khóa học', 'Express cơ bản'] },
      { title: 'Xác thực', lectures: ['JWT', 'Refresh token'] },
    ],
  },
  {
    title: 'Figma cho người mới bắt đầu',
    subtitle: 'Thiết kế giao diện web và mobile chuyên nghiệp',
    category: 'Thiết kế',
    instructor: 'giangvien2@edu.local',
    price: 0,
    level: CourseLevel.BEGINNER,
    status: CourseStatus.PUBLISHED,
    sections: [
      { title: 'Làm quen Figma', lectures: ['Giao diện Figma', 'Frame và Layer'] },
      { title: 'Thiết kế thực tế', lectures: ['Auto Layout', 'Component và Variant', 'Prototype'] },
    ],
  },
  {
    title: 'Digital Marketing thực chiến',
    subtitle: 'Chạy quảng cáo, SEO và đo lường hiệu quả',
    category: 'Marketing',
    instructor: 'giangvien2@edu.local',
    price: 299000,
    level: CourseLevel.ALL_LEVELS,
    status: CourseStatus.PUBLISHED,
    sections: [{ title: 'Nền tảng', lectures: ['Phễu marketing', 'Chân dung khách hàng'] }],
  },
  {
    title: 'Python phân tích dữ liệu',
    subtitle: 'Pandas, NumPy và trực quan hóa dữ liệu',
    category: 'Khoa học dữ liệu',
    instructor: 'giangvien1@edu.local',
    price: 0,
    level: CourseLevel.INTERMEDIATE,
    status: CourseStatus.PENDING, // đang chờ admin duyệt
    sections: [{ title: 'Pandas', lectures: ['DataFrame', 'Lọc và nhóm dữ liệu'] }],
  },
  {
    title: 'TypeScript nâng cao (bản nháp)',
    subtitle: 'Generic, kiểu điều kiện và các mẹo thực tế',
    category: 'Lập trình Web',
    instructor: 'giangvien1@edu.local',
    price: 199000,
    level: CourseLevel.ADVANCED,
    status: CourseStatus.DRAFT, // giảng viên đang soạn
    sections: [{ title: 'Generic', lectures: ['Generic cơ bản'] }],
  },
]

const main = async () => {
  const existing = await prisma.user.findFirst({ where: { email: DEMO_USERS[0].email } })
  if (existing) {
    console.log('Dữ liệu demo đã tồn tại, bỏ qua (muốn tạo lại thì xóa các user *@edu.local demo trước)')
    return
  }

  // 1. Tài khoản
  const password = await hashPassword(DEMO_PASSWORD)
  const users = new Map<string, number>()
  for (const demoUser of DEMO_USERS) {
    const role = await prisma.role.findFirstOrThrow({ where: { name: demoUser.role, deletedAt: null } })
    const user = await prisma.user.create({
      data: {
        email: demoUser.email,
        name: demoUser.name,
        password,
        phoneNumber: '0900000000',
        roleId: role.id,
        status: 'ACTIVE',
      },
    })
    users.set(demoUser.email, user.id)
  }

  // 2. Danh mục (dùng lại nếu đã có cùng tên)
  const categories = new Map<string, number>()
  for (const name of CATEGORIES) {
    const category =
      (await prisma.category.findFirst({ where: { name, deletedAt: null } })) ??
      (await prisma.category.create({ data: { name } }))
    categories.set(name, category.id)
  }

  // 3. Khóa học + chương + bài giảng (bài đầu tiên của mỗi khóa cho xem thử)
  const courseIds: number[] = []
  for (const [index, demo] of COURSES.entries()) {
    const course = await prisma.course.create({
      data: {
        title: demo.title,
        subtitle: demo.subtitle,
        description: `${demo.subtitle}.\n\nKhóa học gồm ${demo.sections.length} chương, có bài tập thực hành sau mỗi chương.`,
        thumbnail: thumbnail(`edu-course-${index + 1}`),
        price: demo.price,
        level: demo.level,
        status: demo.status,
        publishedAt: demo.status === CourseStatus.PUBLISHED ? new Date(Date.now() - index * 86_400_000) : null,
        instructorId: users.get(demo.instructor)!,
        categoryId: categories.get(demo.category)!,
        sections: {
          create: demo.sections.map((section, sectionIndex) => ({
            title: section.title,
            position: sectionIndex,
            lectures: {
              create: section.lectures.map((title, lectureIndex) => ({
                title,
                position: lectureIndex,
                videoUrl: SAMPLE_VIDEO,
                content: `Ghi chú cho bài "${title}".`,
                durationSec: 300 + lectureIndex * 120,
                isPreview: sectionIndex === 0 && lectureIndex === 0,
              })),
            },
          })),
        },
      },
    })
    courseIds.push(course.id)
  }

  // 4. Ghi danh + tiến độ + đánh giá (chỉ khóa miễn phí đã xuất bản)
  const freePublished = await prisma.course.findMany({
    where: { id: { in: courseIds }, price: 0, status: CourseStatus.PUBLISHED },
    include: { sections: { include: { lectures: true } } },
    orderBy: { id: 'asc' },
  })
  const student1 = users.get('hocvien1@edu.local')!
  const student2 = users.get('hocvien2@edu.local')!
  for (const [index, course] of freePublished.entries()) {
    await prisma.enrollment.createMany({
      data: [
        { userId: student1, courseId: course.id },
        { userId: student2, courseId: course.id },
      ],
    })
    // hocvien1 học xong một nửa số bài
    const lectures = course.sections.flatMap((s) => s.lectures)
    await prisma.lectureProgress.createMany({
      data: lectures.slice(0, Math.ceil(lectures.length / 2)).map((l) => ({ userId: student1, lectureId: l.id })),
    })
    await prisma.review.createMany({
      data: [
        { userId: student1, courseId: course.id, rating: 5, comment: 'Khóa học rất dễ hiểu, giảng viên nhiệt tình!' },
        { userId: student2, courseId: course.id, rating: index === 0 ? 4 : 5, comment: 'Nội dung thực tế, đáng học.' },
      ],
    })
  }

  return { users: users.size, categories: categories.size, courses: courseIds.length }
}

main()
  .then((result) => {
    if (!result) return
    console.log(`Đã tạo ${result.users} tài khoản, ${result.categories} danh mục, ${result.courses} khóa học`)
    console.log(`Mật khẩu chung cho tài khoản demo: ${DEMO_PASSWORD}`)
    for (const user of DEMO_USERS) console.log(`  ${user.role.padEnd(10)} ${user.email}`)
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect())
