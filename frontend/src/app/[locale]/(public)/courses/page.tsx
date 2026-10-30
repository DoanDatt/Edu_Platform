import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import CourseList from './course-list'
import { Suspense } from 'react'
import CourseFilters from './course-filter'
import categoryApiRequest from '@/apiRequests/category'
import PageBanner from '@/components/page-banner'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Courses')
  return { title: t('metaTitle'), description: t('metaDescription') }
}

async function CategoryFilters() {
  const categories = await categoryApiRequest
    .list({
      limit: 100
    })
    .then((res) => res.payload.data)
    .catch(() => [])
  return <CourseFilters categories={categories} />
}

async function CoursesPage({ searchParams }: PageProps<'/[locale]/courses'>) {
  const t = await getTranslations('Courses')
  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Tiêu đề ===== */}
      <PageBanner title={t('title')} description={t('description')} />

      {/* ===== Bộ lọc (chưa hoạt động) ===== */}
      <Suspense fallback={<div className='h-10' />}>
        <CategoryFilters />
      </Suspense>

      {/* ===== Danh sách ===== */}
      <Suspense fallback={<p className='text-muted-foreground'>{t('loading')}</p>}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

export default CoursesPage
