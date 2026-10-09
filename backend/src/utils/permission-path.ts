// Ghép tiền tố mount với path của route để ra path lưu trong bảng Permission
//   ('/roles', '/')        → '/roles'
//   ('/roles', '/:roleId') → '/roles/:roleId'
// Script sync (5d) và middleware requirePermission (5e) phải dùng CHUNG hàm này,
// lệch 1 dấu "/" là không bao giờ khớp được
export const buildPermissionPath = (prefix: string, routePath: string) => {
  const path = `${prefix}${routePath}`
  // Bỏ "/" ở cuối, trừ khi path chỉ là "/"
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}
