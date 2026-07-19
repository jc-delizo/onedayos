import Link from 'next/link'
import { AuthShell, EmptyState } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { getDemoRuntimeConfig } from '@/kernel/env/server'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  const { publicRegistrationEnabled } = getDemoRuntimeConfig()

  if (!publicRegistrationEnabled) {
    return (
      <AuthShell
        title="Registration is invite-only"
        description="Use the demo credentials provided by your OneDayOS guide."
        footer={
          <Link className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]" href="/login">
            Already have access?
          </Link>
        }
      >
        <EmptyState
          title="Registration is currently invite-only."
          description="Use the demo credentials provided by your OneDayOS guide."
          action={<LinkButton href="/login" variant="primary">Sign in</LinkButton>}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create account"
      description="Registration is owned by the Kernel so organization and admin access are created together."
      footer={
        <Link className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]" href="/login">
          Already have an account?
        </Link>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
