'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatPrice } from '@/lib/format'
import { RevenueType } from '@/schemaValidations/revenue.schema'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

// Khối doanh thu dùng chung cho 2 dashboard (backend trả CÙNG cấu trúc, chỉ khác phạm vi):
//   admin    → GET /stats/admin      → doanh thu cả hệ thống
//   giảng viên → GET /stats/instructor → doanh thu các khóa của chính mình
// Chỉ tính đơn ĐÃ thanh toán. Ngày tính theo giờ Việt Nam (backend đã gom sẵn đủ 30 ngày, ngày không bán được = 0)

// Recharts đọc màu từ biến CSS --color-revenue mà ChartContainer tạo từ config này.
// 1 chuỗi số liệu → 1 màu (màu chính), không cần chú thích màu
const chartConfig = {
  revenue: { label: 'Doanh thu', color: 'var(--primary)' }
} satisfies ChartConfig

// Trục dọc rút gọn: 1.250.000 → "1,3 Tr" (đủ để so sánh, số đầy đủ xem trong tooltip)
const compactVnd = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

// '2026-10-29' → '29/10'. Cắt chuỗi thay vì new Date(): new Date('2026-10-29') hiểu là 0h UTC,
// máy ở múi giờ âm sẽ lùi thành ngày 28 → sai ngày
const toDayLabel = (date: string) => `${Number(date.slice(8, 10))}/${Number(date.slice(5, 7))}`

export default function RevenueSection({
  revenue,
  description = '30 ngày gần nhất'
}: {
  revenue: RevenueType
  description?: string
}) {
  const daily = revenue.daily.map((day) => ({ ...day, label: toDayLabel(day.date) }))
  const hasSales = revenue.total > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className='grid gap-6 lg:grid-cols-[1fr_300px]'>
        <div className='flex min-w-0 flex-col gap-4'>
          {/* 3 con số chính phía trên biểu đồ */}
          <dl className='grid grid-cols-3 gap-4'>
            <div>
              <dt className='text-xs text-muted-foreground'>Tổng doanh thu</dt>
              <dd className='text-lg font-bold tabular-nums sm:text-2xl'>{formatVnd(revenue.total)}</dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>30 ngày qua</dt>
              <dd className='text-lg font-bold tabular-nums sm:text-2xl'>{formatVnd(revenue.last30Days)}</dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>Đơn hàng 30 ngày</dt>
              <dd className='text-lg font-bold tabular-nums sm:text-2xl'>{revenue.orders30Days}</dd>
            </div>
          </dl>

          {/* Biểu đồ vùng: doanh thu theo ngày. Rê chuột vào để xem số chính xác từng ngày.
              Chưa bán được gì: vẫn vẽ trục (đường nằm sát đáy) + dòng chữ giữa khung, không để trống trơn */}
          <div className='relative'>
            <ChartContainer config={chartConfig} className='aspect-auto h-64 w-full'>
              <AreaChart data={daily} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  {/* Nền dưới đường nhạt dần xuống đáy */}
                  <linearGradient id='fillRevenue' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='var(--color-revenue)' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='var(--color-revenue)' stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {/* Chỉ kẻ ngang, mờ: lưới để ước lượng, không lấn át đường số liệu */}
                <CartesianGrid vertical={false} />
                <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  allowDecimals={false}
                  tickFormatter={(value: number) => compactVnd.format(value)}
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: '4 4' }}
                  content={
                    <ChartTooltipContent
                      indicator='line'
                      formatter={(value, _name, item) => (
                        <div className='flex flex-col'>
                          <span className='font-semibold tabular-nums'>{formatVnd(Number(value))}</span>
                          <span className='text-muted-foreground'>{item.payload.orders} đơn</span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey='revenue'
                  type='monotone'
                  stroke='var(--color-revenue)'
                  strokeWidth={2}
                  fill='url(#fillRevenue)'
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
            {!hasSales && (
              <p className='absolute inset-0 flex items-center justify-center text-sm text-muted-foreground'>
                Chưa có đơn hàng nào được thanh toán
              </p>
            )}
          </div>
        </div>

        {/* Khóa bán chạy: tối đa 5 khóa doanh thu cao nhất (từ trước tới nay) */}
        <div className='flex flex-col gap-3'>
          <h3 className='text-sm font-semibold'>Khóa học bán chạy</h3>
          {revenue.topCourses.length === 0 ? (
            <p className='rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground'>
              Chưa có khóa nào bán được
            </p>
          ) : (
            <ol className='flex flex-col gap-3'>
              {revenue.topCourses.map((course, index) => (
                <li key={course.id} className='flex items-center gap-3'>
                  <span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tabular-nums'>
                    {index + 1}
                  </span>
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>{course.title}</span>
                    <span className='text-xs text-muted-foreground'>{course.orders} đơn</span>
                  </div>
                  <span className='text-sm font-semibold tabular-nums'>{compactVnd.format(course.revenue)} ₫</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// formatPrice(0) trả 'Miễn phí' (dùng cho giá khóa học) → doanh thu 0 phải hiện '0 ₫'
const formatVnd = (amount: number) => (amount === 0 ? '0 ₫' : formatPrice(amount))
