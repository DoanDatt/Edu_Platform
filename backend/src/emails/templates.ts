import envConfig from '../config/env'

export type EmailContent = { subject: string; html: string; text: string }

// Dữ liệu người dùng nhập (tên, tên khóa học, lý do...) phải escape trước khi chèn vào HTML,
// nếu không ai đó đặt tên "<script>..." là chèn được mã vào email
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Khung chung cho mọi email
const layout = (title: string, bodyHtml: string) => `<!doctype html>
<html lang="vi">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px">
      <h2 style="margin-top:0">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:32px;color:#71717a;font-size:12px">Edu Platform: email tự động, vui lòng không trả lời.</p>
    </div>
  </body>
</html>`

const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">${label}</a></p>`

export const welcomeEmail = (name: string): EmailContent => ({
  subject: 'Chào mừng bạn đến với Edu Platform',
  html: layout(
    `Xin chào ${escapeHtml(name)}!`,
    `<p>Tài khoản của bạn đã được tạo. Bắt đầu tìm khóa học phù hợp ngay hôm nay.</p>
     ${button(`${envConfig.FRONTEND_URL}/courses`, 'Khám phá khóa học')}`,
  ),
  text: `Xin chào ${name}! Tài khoản Edu Platform của bạn đã được tạo. Khám phá khóa học: ${envConfig.FRONTEND_URL}/courses`,
})

export const passwordResetOtpEmail = (name: string, code: string, expiresInMinutes: number): EmailContent => ({
  subject: `Mã đặt lại mật khẩu: ${code}`,
  html: layout(
    'Đặt lại mật khẩu',
    `<p>Xin chào ${escapeHtml(name)}, mã xác nhận của bạn là:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
     <p>Mã có hiệu lực trong ${expiresInMinutes} phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>`,
  ),
  text: `Mã đặt lại mật khẩu của bạn: ${code} (hiệu lực ${expiresInMinutes} phút). Bỏ qua email này nếu bạn không yêu cầu.`,
})

export const passwordChangedEmail = (name: string): EmailContent => ({
  subject: 'Mật khẩu của bạn vừa được thay đổi',
  html: layout(
    'Mật khẩu đã thay đổi',
    `<p>Xin chào ${escapeHtml(name)}, mật khẩu tài khoản của bạn vừa được đặt lại và mọi thiết bị đã bị đăng xuất.</p>
     <p>Nếu không phải bạn thực hiện, hãy đặt lại mật khẩu ngay hoặc liên hệ quản trị viên.</p>`,
  ),
  text: `Xin chào ${name}, mật khẩu tài khoản của bạn vừa được đặt lại. Nếu không phải bạn, hãy liên hệ quản trị viên.`,
})

export const courseApprovedEmail = (name: string, courseTitle: string, courseId: number): EmailContent => ({
  subject: `Khóa học "${courseTitle}" đã được duyệt`,
  html: layout(
    'Khóa học đã được xuất bản 🎉',
    `<p>Xin chào ${escapeHtml(name)}, khóa học <b>${escapeHtml(courseTitle)}</b> đã được duyệt và hiển thị công khai.</p>
     ${button(`${envConfig.FRONTEND_URL}/courses/${courseId}`, 'Xem khóa học')}`,
  ),
  text: `Khóa học "${courseTitle}" của bạn đã được duyệt: ${envConfig.FRONTEND_URL}/courses/${courseId}`,
})

// Dùng cho cả "bị từ chối khi duyệt" và "bị admin gỡ khỏi trang công khai"
export const courseRejectedEmail = (
  name: string,
  courseTitle: string,
  reason: string,
  wasPublished: boolean,
): EmailContent => {
  const what = wasPublished ? 'đã bị gỡ khỏi trang công khai' : 'chưa được duyệt'
  return {
    subject: `Khóa học "${courseTitle}" ${what}`,
    html: layout(
      wasPublished ? 'Khóa học bị gỡ' : 'Khóa học bị từ chối',
      `<p>Xin chào ${escapeHtml(name)}, khóa học <b>${escapeHtml(courseTitle)}</b> ${what}.</p>
       <p><b>Lý do:</b> ${escapeHtml(reason)}</p>
       <p>Bạn có thể chỉnh sửa rồi gửi duyệt lại.</p>`,
    ),
    text: `Khóa học "${courseTitle}" ${what}. Lý do: ${reason}. Bạn có thể chỉnh sửa rồi gửi duyệt lại.`,
  }
}
