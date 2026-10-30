import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import AuthShell from '../auth-shell'
import ForgotPasswordFlow from './forgot-password-flow'

export async function generateMetadata(): Promise<Metadata> {
  // → "Quên mật khẩu | EduPlatform" (template ở root layout)
  return { title: (await getTranslations('ForgotPassword'))('title') }
}

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword')
  return (
    <AuthShell pageTitle={t('title')} title={t('shellTitle')} description={t('shellDescription')}>
      <ForgotPasswordFlow />
    </AuthShell>
  )
}
