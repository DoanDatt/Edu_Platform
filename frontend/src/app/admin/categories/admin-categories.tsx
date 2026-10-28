'use client'

import PaginationLinks from '@/components/pagination-links'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, handleErrorApi } from '@/lib/utils'
import { CategoryType, GetCategoriesQuery } from '@/schemaValidations/category.schema'
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import CategoryFormDialog from './category-form-dialog'
import { useCategoriesQuery, useDeleteCategoryMutation } from '@/queries/useCategory'
import { useState } from 'react'
import { toast } from 'sonner'

const PAGE_SIZE = 10
const PATHNAME = '/admin/categories'

export default function AdminCategories() {
  const searchParams = useSearchParams()

  // lấy an toàn url
  const parsed = GetCategoriesQuery.safeParse({
    page: searchParams.get('page') ?? undefined
  })

  const page = parsed.success ? parsed.data.page : 1

  const { data, isLoading, isFetching, isError } = useCategoriesQuery({ page, limit: PAGE_SIZE })
  const deleteMutation = useDeleteCategoryMutation()

  // null = đóng, {} = thêm mới, {category} = sửa
  const [dialog, setDialog] = useState<{ category?: CategoryType } | null>(null)

  const openCreate = () => setDialog({})

  const openEdit = (category: CategoryType) => setDialog({ category })

  const closeDialog = () => setDialog(null)

  const deleteCategory = async (category: CategoryType) => {
    // Hỏi lại. Bấm Cancel -> confirm trả false -> !false = true -> return, không xóa
    if (!confirm(`Xóa danh mục "${category.name}" ?`)) return
    try {
      const result = await deleteMutation.mutateAsync(category.id)
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }
  const isDeleting = deleteMutation.isPending

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          {data && (
            <span>
              Tổng <span className='font-semibold text-foreground'>{data.payload.totalItems}</span> danh mục
            </span>
          )}
          {/* Đang tải trang mới (bảng cũ vẫn hiện nhờ keepPreviousData) */}
          {isFetching && !isLoading && <Loader2 className='size-4 animate-spin' />}
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className='h-80 w-full rounded-xl' />
      ) : isError || !data ? (
        <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          Không tải được danh mục. Vui lòng thử lại sau.
        </p>
      ) : data.payload.data.length === 0 ? (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center'>
          <FolderTree className='size-10 text-muted-foreground' />
          <p className='font-medium'>Chưa có danh mục nào</p>
          <Button variant='outline' onClick={openCreate}>
            <Plus />
            Thêm danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <>
          {/* Mờ đi khi đang tải trang mới: cho người dùng biết bảng sắp đổi */}
          <div className={cn('overflow-x-auto rounded-xl border transition-opacity', isFetching && 'opacity-60')}>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-left text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Tên danh mục</th>
                  <th className='px-4 py-3 font-medium'>Mô tả</th>
                  <th className='px-4 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.payload.data.map((category) => (
                  <tr key={category.id} className='border-t'>
                    <td className='px-4 py-3 font-medium whitespace-nowrap'>{category.name}</td>
                    <td className='px-4 py-3 text-muted-foreground'>
                      {category.description || <span className='italic'>Chưa có mô tả</span>}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={`Sửa danh mục ${category.name}`}
                          onClick={() => openEdit(category)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='text-destructive hover:text-destructive'
                          aria-label={`Xóa danh mục ${category.name}`}
                          disabled={isDeleting}
                          onClick={() => deleteCategory(category)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationLinks
            pathname={PATHNAME}
            page={data.payload.page}
            totalPages={data.payload.totalPages}
            searchParams={Object.fromEntries(searchParams.entries())}
          />
        </>
      )}

      <CategoryFormDialog
        key={dialog?.category?.id ?? 'new'}
        open={dialog !== null}
        category={dialog?.category}
        onClose={closeDialog}
      />
    </div>
  )
}
