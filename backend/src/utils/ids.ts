// Danh sách id client gửi lên có đúng là TẤT CẢ id hiện có (không thiếu, không thừa, không trùng)?
// Dùng cho API đổi thứ tự: client phải gửi lại đủ danh sách theo thứ tự mới
export const hasExactlyIds = (given: number[], actual: number[]) => {
  const actualSet = new Set(actual)
  return given.length === actual.length && new Set(given).size === given.length && given.every((id) => actualSet.has(id))
}
