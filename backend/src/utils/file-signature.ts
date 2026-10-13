import { open } from 'fs/promises'

// Kiểm tra "chữ ký" ở đầu file (magic bytes) thay vì tin vào đuôi file / Content-Type client gửi:
// đổi tên virus.exe thành anh.jpg thì đuôi và Content-Type đều là ảnh, nhưng byte đầu thì không
const SIGNATURES: Record<string, (head: Buffer) => boolean> = {
  'image/jpeg': (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
  'image/png': (h) => h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (h) => h.subarray(0, 4).toString('ascii') === 'GIF8',
  'image/webp': (h) => h.subarray(0, 4).toString('ascii') === 'RIFF' && h.subarray(8, 12).toString('ascii') === 'WEBP',
  // mp4 / mov: 4 byte độ dài box rồi tới chữ "ftyp"
  'video/mp4': (h) => h.subarray(4, 8).toString('ascii') === 'ftyp',
  'video/quicktime': (h) => h.subarray(4, 8).toString('ascii') === 'ftyp',
  'video/webm': (h) => h.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
}

export const hasValidSignature = async (filePath: string, mimeType: string) => {
  const check = SIGNATURES[mimeType]
  if (!check) return false
  const file = await open(filePath, 'r')
  try {
    const head = Buffer.alloc(16)
    await file.read(head, 0, 16, 0)
    return check(head)
  } finally {
    await file.close()
  }
}
