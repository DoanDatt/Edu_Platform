'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { usePathname, useRouter } from '@/i18n/navigation'
import { CourseFiltersType } from '@/schemaValidations/course.schema'
import { Star } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

// Thứ tự trình độ như Figma: All levels → Beginner → Intermediate → Expert (ADVANCED)
const LEVEL_ORDER = ['ALL_LEVELS', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const

// Cột lọc bên phải trang danh sách theo Figma EduPress (Course Listing):
// Course Category · Instructors · Price · Review · Level, mỗi dòng: checkbox + nhãn bên trái, số khóa bên phải.
// Bộ lọc nằm trên URL (?categoryId=1,2&level=BEGINNER...) → chia sẻ link ra đúng kết quả, Back / Forward chạy đúng.
// Mỗi lần đổi: về trang 1. Số đếm lấy từ GET /courses/filters (đếm trên tất cả khóa đã xuất bản)
export default function CourseSidebar({ filters }: { filters: CourseFiltersType }) {
  const t = useTranslations('Courses')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // '1,2' → ['1', '2']
  const selected = (key: string) => searchParams.get(key)?.split(',').filter(Boolean) ?? []

  const push = (params: URLSearchParams) => {
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  // Bật / tắt 1 giá trị trong bộ lọc nhiều lựa chọn
  const toggle = (key: string, value: string) => {
    const current = selected(key)
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    const params = new URLSearchParams(searchParams.toString())
    if (next.length > 0) params.set(key, next.join(','))
    else params.delete(key)
    push(params)
  }

  // Giá: All / Free / Paid. Chọn cả Free lẫn Paid = tất cả → bỏ bộ lọc
  const price = searchParams.get('price')
  const togglePrice = (value: 'all' | 'free' | 'paid') => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || price === value || (price && price !== value)) params.delete('price')
    else params.set('price', value)
    push(params)
  }

  const levels = [...filters.levels].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))

  return (
    <div className='flex flex-col gap-[30px]'>
      <FilterGroup title={t('filterCategory')}>
        {filters.categories.map((category) => (
          <FilterRow
            key={category.id}
            label={category.name}
            count={category.count}
            checked={selected('categoryId').includes(String(category.id))}
            onToggle={() => toggle('categoryId', String(category.id))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t('filterInstructors')}>
        {filters.instructors.map((instructor) => (
          <FilterRow
            key={instructor.id}
            label={instructor.name}
            count={instructor.count}
            checked={selected('instructorId').includes(String(instructor.id))}
            onToggle={() => toggle('instructorId', String(instructor.id))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t('price')}>
        <FilterRow label={t('allPrices')} count={filters.price.all} checked={!price} onToggle={() => togglePrice('all')} />
        <FilterRow label={t('free')} count={filters.price.free} checked={price === 'free'} onToggle={() => togglePrice('free')} />
        <FilterRow label={t('paid')} count={filters.price.paid} checked={price === 'paid'} onToggle={() => togglePrice('paid')} />
      </FilterGroup>

      <FilterGroup title={t('filterReview')}>
        {filters.ratings.map(({ stars, count }) => (
          <FilterRow
            key={stars}
            label={
              <span className='flex gap-0.5' aria-label={t('starsLabel', { count: stars })}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden
                    className={index < stars ? 'size-4 fill-[#fdc830] text-[#fdc830]' : 'size-4 text-[#fdc830]'}
                  />
                ))}
              </span>
            }
            count={`(${count})`}
            checked={selected('rating').includes(String(stars))}
            onToggle={() => toggle('rating', String(stars))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t('level')}>
        {levels.map(({ level, count }) => (
          <FilterRow
            key={level}
            label={t(`levels.${level}`)}
            count={count}
            checked={selected('level').includes(level)}
            onToggle={() => toggle('level', level)}
          />
        ))}
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className='flex flex-col gap-3'>
      <legend className='mb-3 font-heading text-xl leading-[1.2] font-semibold'>{title}</legend>
      {children}
    </fieldset>
  )
}

// Cả dòng là <label>: bấm vào chữ cũng bật / tắt được checkbox
function FilterRow({
  label,
  count,
  checked,
  onToggle
}: {
  label: React.ReactNode
  count: number | string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className='flex cursor-pointer items-center justify-between gap-3 text-lg leading-normal'>
      <span className='flex min-w-0 items-center gap-2.5'>
        <Checkbox checked={checked} onCheckedChange={onToggle} className='size-[18px] rounded-[3px] border-grey' />
        <span className='truncate text-muted-foreground'>{label}</span>
      </span>
      <span className='shrink-0 text-muted-foreground'>{count}</span>
    </label>
  )
}
