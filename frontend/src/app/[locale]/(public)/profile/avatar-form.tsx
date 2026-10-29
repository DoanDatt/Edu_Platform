'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { handleErrorApi } from '@/lib/utils'
import { useUpdateProfileMutation } from '@/queries/useProfile'
import { useUploadImageMutation } from '@/queries/useUpload'
import { ProfileType } from '@/schemaValidations/profile.schema'
import { IMAGE_TYPES, MAX_IMAGE_MB } from '@/schemaValidations/upload.schema'
import { ImageUp, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Đổi ảnh đại diện. Luồng:
//   chọn file → kiểm tra loại + dung lượng → XEM TRƯỚC ngay → POST /uploads/image (FormData) → nhận url
//   → PUT /profile { name, phoneNumber, avatar: url } → invalidate ['profile'] + ['me'] → header đổi ảnh
export default function AvatarForm({ profile }: { profile: ProfileType }) {
  const uploadMutation = useUploadImageMutation()
  const updateMutation = useUpdateProfileMutation()
  const isPending = uploadMutation.isPending || updateMutation.isPending

  // <input type='file'> mặc định xấu và khó chỉnh giao diện → ẩn nó đi, bấm Button thì "bấm hộ" input
  const inputRef = useRef<HTMLInputElement>(null)
  // Link tạm để xem trước file vừa chọn (blob:...), chỉ sống trong trình duyệt này
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // URL.createObjectURL giữ file trong bộ nhớ tới khi revoke → đổi ảnh khác / rời trang thì giải phóng
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Lưu url ảnh vào hồ sơ. Body PUT /profile bắt buộc name + phoneNumber → gửi lại giá trị hiện tại
  const saveAvatar = async (avatar: string | null) => {
    await updateMutation.mutateAsync({ name: profile.name, phoneNumber: profile.phoneNumber, avatar })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Xóa giá trị của input: chọn lại ĐÚNG file vừa chọn thì onChange vẫn chạy
    e.target.value = ''
    if (!file) return

    // Kiểm tra ở frontend trước (backend vẫn kiểm tra lại, kể cả nội dung thật của file)
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Ảnh tối đa ${MAX_IMAGE_MB} MB`)
      return
    }

    setPreviewUrl(URL.createObjectURL(file)) // hiện ảnh mới NGAY, không chờ upload xong
    try {
      const uploadResult = await uploadMutation.mutateAsync(file)
      await saveAvatar(uploadResult.payload.data.url)
      toast.success('Đã cập nhật ảnh đại diện')
    } catch (error) {
      handleErrorApi({ error })
    } finally {
      // Xong (hay lỗi) thì bỏ ảnh xem trước: thành công → profile mới có url thật; lỗi → quay về ảnh cũ
      setPreviewUrl(null)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Xóa ảnh đại diện?')) return
    try {
      await saveAvatar(null) // backend: avatar null = xóa ảnh
      toast.success('Đã xóa ảnh đại diện')
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const imageSrc = previewUrl ?? profile.avatar ?? undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>JPG, PNG, WEBP hoặc GIF, tối đa {MAX_IMAGE_MB} MB.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap items-center gap-5'>
        <div className='relative'>
          <Avatar className='size-20'>
            <AvatarImage src={imageSrc} alt={profile.name} className='object-cover' />
            <AvatarFallback className='text-2xl'>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {/* Đang tải: phủ lớp mờ + vòng xoay lên ảnh xem trước */}
          {isPending && (
            <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/40'>
              <Loader2 className='size-6 animate-spin text-white' />
            </div>
          )}
        </div>

        <div className='flex flex-wrap gap-2'>
          {/* accept: hộp chọn file của hệ điều hành chỉ hiện các loại ảnh (người dùng vẫn đổi được → vẫn phải kiểm tra) */}
          <input
            ref={inputRef}
            type='file'
            accept={IMAGE_TYPES.join(',')}
            className='hidden'
            onChange={handleFileChange}
          />
          <Button type='button' variant='outline' onClick={() => inputRef.current?.click()} disabled={isPending}>
            <ImageUp />
            {profile.avatar ? 'Đổi ảnh' : 'Chọn ảnh'}
          </Button>
          {profile.avatar && (
            <Button
              type='button'
              variant='ghost'
              onClick={handleRemove}
              disabled={isPending}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 />
              Xóa ảnh
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
