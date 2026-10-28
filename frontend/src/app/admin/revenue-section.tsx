'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatPrice } from '@/lib/format'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

// ===== KHỐI DOANH THU: CHỈ LÀ GIAO DIỆN MẪU =====
// Dự án chưa có thanh toán (khóa có phí trả 402) → chưa có đơn hàng nào → chưa có doanh thu thật.
// Khi làm phần thanh toán (bảng Order + API thống kê doanh thu), thay SAMPLE_* ở cuối file bằng dữ liệu API
// và bỏ nhãn "Dữ liệu mẫu".

// Recharts đọc màu từ biến CSS --color-revenue mà ChartContainer tạo từ config này.
// 1 chuỗi số liệu → 1 màu (màu chính), không cần chú thích màu
const chartConfig = {
  revenue: { label: 'Doanh thu', color: 'var(--primary)' }
} satisfies ChartConfig

// Trục dọc rút gọn: 1.250.000 → "1,3 Tr" (đủ để so sánh, số đầy đủ xem trong tooltip)
const compactVnd = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

export default function RevenueSection() {
  const total30Days = SAMPLE_DAILY.reduce((sum, day) => sum + day.revenue, 0)
  const orders30Days = SAMPLE_DAILY.reduce((sum, day) => sum + day.orders, 0)

  return (
    <Card>
      <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-3'>
        <div className='flex flex-col gap-1.5'>
          <CardTitle>Doanh thu</CardTitle>
          <CardDescription>30 ngày gần nhất</CardDescription>
        </div>
        <Badge variant='outline' className='border-amber-500/50 text-amber-700 dark:text-amber-300'>
          Dữ liệu mẫu · chưa có thanh toán
        </Badge>
      </CardHeader>

      <CardContent className='grid gap-6 lg:grid-cols-[1fr_300px]'>
        <div className='flex min-w-0 flex-col gap-4'>
          {/* 3 con số chính phía trên biểu đồ */}
          <dl className='grid grid-cols-3 gap-4'>
            <div>
              <dt className='text-xs text-muted-foreground'>Tổng doanh thu</dt>
              <dd className='text-lg font-bold tabular-nums sm:text-2xl'>{formatPrice(SAMPLE_TOTAL_REVENUE)}</dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>30 ngày qua</dt>
              <dd className='text-lg font-bold tabular-nums sm:text-2xl'>{formatPrice(total30Days)}</dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>Đơn hàng 30 ngày</dt>
              <dd className='text-lg font-bold tabular-nums sm:text-2xl'>{orders30Days}</dd>
            </div>
          </dl>

          {/* Biểu đồ vùng: doanh thu theo ngày. Rê chuột vào để xem số chính xác từng ngày */}
          <ChartContainer config={chartConfig} className='aspect-auto h-64 w-full'>
            <AreaChart data={SAMPLE_DAILY} margin={{ left: 0, right: 8, top: 8 }}>
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
                tickFormatter={(value: number) => compactVnd.format(value)}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    indicator='line'
                    formatter={(value) => (
                      <span className='font-semibold tabular-nums'>{formatPrice(Number(value))}</span>
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
        </div>

        {/* Khóa bán chạy: 5 khóa doanh thu cao nhất */}
        <div className='flex flex-col gap-3'>
          <h3 className='text-sm font-semibold'>Khóa học bán chạy</h3>
          <ol className='flex flex-col gap-3'>
            {SAMPLE_TOP_COURSES.map((course, index) => (
              <li key={course.title} className='flex items-center gap-3'>
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
        </div>
      </CardContent>
    </Card>
  )
}

// ===== DỮ LIỆU MẪU =====
// Sinh cố định (không dùng Math.random): server và trình duyệt vẽ ra giống nhau, không lỗi hydration
// Xu hướng tăng dần + dao động nhẹ theo tuần (hàm sin) → đường mượt, giống số liệu bán hàng thật hơn
const SAMPLE_DAILY = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(2026, 9, 1 + index) // 1/10 → 30/10/2026
  const orders = Math.round(3 + index * 0.2 + 1.5 * Math.sin(index / 2.2))
  return {
    label: `${date.getDate()}/${date.getMonth() + 1}`,
    orders,
    revenue: orders * 349_000
  }
})

// Tổng từ trước tới nay = 30 ngày gần nhất + các tháng trước → luôn LỚN HƠN số 30 ngày
const SAMPLE_TOTAL_REVENUE = SAMPLE_DAILY.reduce((sum, day) => sum + day.revenue, 0) + 96_500_000

const SAMPLE_TOP_COURSES = [
  { title: 'Next.js App Router thực chiến', orders: 42, revenue: 25_158_000 },
  { title: 'Node.js & Express xây dựng REST API', orders: 31, revenue: 15_469_000 },
  { title: 'Machine Learning nhập môn', orders: 12, revenue: 9_588_000 },
  { title: 'Quảng cáo Facebook Ads', orders: 15, revenue: 8_235_000 },
  { title: 'JavaScript hiện đại (ES6+)', orders: 18, revenue: 6_282_000 }
]
