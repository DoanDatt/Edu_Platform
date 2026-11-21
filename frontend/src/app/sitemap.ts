import courseApiRequest from '@/apiRequests/course'
import envConfig from '@/config'
import { blogSlugs } from '@/content/blog'
import { routing } from '@/i18n/routing'
import { generateSlugUrl } from '@/lib/format'
import type { MetadataRoute } from 'next'

// /sitemap.xml: danh sách trang công khai để Google tìm và đưa lên kết quả tìm kiếm.
// Có gọi API (fetch không cache) nên Next tạo MỚI mỗi lần có người mở /sitemap.xml → khóa vừa duyệt có ngay.
// Mỗi trang ghi cả 2 bản ngôn ngữ (alternates): tiếng Anh không có tiền tố (/courses), tiếng Việt có /vi
const BASE_URL = envConfig.NEXT_PUBLIC_URL.replace(/\/$/, '')

const urlFor = (locale: string, path: string) =>
  `${BASE_URL}${locale === routing.defaultLocale ? '' : `/${locale}`}${path === '/' ? '' : path}` || BASE_URL

const entry = (
  path: string,
  options: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'> = {}
): MetadataRoute.Sitemap[number] => ({
  url: urlFor(routing.defaultLocale, path),
  alternates: { languages: Object.fromEntries(routing.locales.map((locale) => [locale, urlFor(locale, path)])) },
  ...options
})

// Mọi khóa đã xuất bản (API tối đa 100 khóa / trang → lật đến hết)
const getAllCourses = async () => {
  const courses: { id: number; title: string; publishedAt: string }[] = []
  for (let page = 1; ; page++) {
    const { payload } = await courseApiRequest.list({ page, limit: 100 })
    courses.push(...payload.data)
    if (page >= payload.totalPages) return courses
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    entry('/', { changeFrequency: 'daily', priority: 1 }),
    entry('/courses', { changeFrequency: 'daily', priority: 0.9 }),
    entry('/blog', { changeFrequency: 'weekly', priority: 0.6 }),
    entry('/about', { changeFrequency: 'monthly', priority: 0.4 }),
    entry('/contact', { changeFrequency: 'yearly', priority: 0.3 })
  ]
  const blogPages = blogSlugs.map((slug) => entry(`/blog/${slug}`, { changeFrequency: 'monthly', priority: 0.5 }))

  // API lỗi lúc build (vd backend gói free đang ngủ) → vẫn có sitemap các trang tĩnh, không làm hỏng cả bản build
  let coursePages: MetadataRoute.Sitemap = []
  try {
    coursePages = (await getAllCourses()).map((course) =>
      entry(`/courses/${generateSlugUrl({ name: course.title, id: course.id })}`, {
        lastModified: course.publishedAt,
        changeFrequency: 'weekly',
        priority: 0.8
      })
    )
  } catch (error) {
    console.error('sitemap: không lấy được danh sách khóa học', error)
  }

  return [...staticPages, ...coursePages, ...blogPages]
}
