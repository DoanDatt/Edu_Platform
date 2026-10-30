import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import AuthShell from '../auth-shell'
import LoginForm from './form-login'

export async function generateMetadata(): Promise<Metadata> {
  // → "Đăng nhập | EduPlatform" (template ở root layout)
  return { title: (await getTranslations('Auth'))('login') }
}

export default function LoginPage() {
  const t = useTranslations('Auth')
  return (
    <AuthShell pageTitle={t('login')} title={t('loginShellTitle')} description={t('loginShellDescription')}>
      <LoginForm />
    </AuthShell>
  )
}
