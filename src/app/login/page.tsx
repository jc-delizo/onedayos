import Link from 'next/link'
import { AuthShell } from '@/components/onedayos'
import { getDemoRuntimeConfig } from '@/kernel/env/server'
import { LoginForm } from './login-form'

export default function LoginPage() {
  const { publicRegistrationEnabled } = getDemoRuntimeConfig()

  return (
    <AuthShell
      title="Sign in"
      description="Access your verified organization context."
      footer={
        publicRegistrationEnabled ? (
          <Link className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]" href="/register">
            Need a new organization account?
          </Link>
        ) : undefined
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
