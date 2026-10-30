import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import AuthShell from '../auth-shell'
import RegisterForm from './form-register'

export async function generateMetadata(): Promise<Metadata> {
  // → "Đăng ký | EduPlatform" (template ở root layout)
  return { title: (await getTranslations('Auth'))('register') }
}

export default function RegisterPage() {
  const t = useTranslations('Auth')
  return (
    <AuthShell pageTitle={t('register')} title={t('registerShellTitle')} description={t('registerShellDescription')}>
      <RegisterForm />
    </AuthShell>
  )
}
