'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FormMessage, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { sdkClient } from '@/sdk/client'

function getOrgSlug(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const org = (data as { org?: unknown }).org

  if (!org || typeof org !== 'object') {
    return null
  }

  const slug = (org as { slug?: unknown }).slug
  return typeof slug === 'string' && slug ? slug : null
}

export function LoginForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const supabase = sdkClient.auth.createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage('Login failed. Check your email and password.')
      setPending(false)
      return
    }

    const currentUser = await sdkClient.auth.getCurrentUser()
    const orgSlug = currentUser.error ? null : getOrgSlug(currentUser.data)

    if (!orgSlug) {
      setMessage('Login succeeded, but your platform profile could not be loaded.')
      setPending(false)
      return
    }

    setMessage('Login ready.')
    window.location.assign(getPostLoginHref(orgSlug))
    setPending(false)
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Field>
        <Label htmlFor="login-email" required>Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Field>
        <Label htmlFor="login-password" required>Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldDescription>API current-user lookup uses the session-backed `/api/kernel/auth/me` endpoint.</FieldDescription>
      </Field>
      <Button className="w-full" disabled={pending} type="submit" variant="primary">
        {pending ? 'Signing in...' : 'Sign in'}
      </Button>
      <FormMessage tone={message?.startsWith('Login failed') ? 'danger' : 'neutral'}>{message}</FormMessage>
    </form>
  )
}

export function getPostLoginHref(orgSlug: string): string {
  return `/${orgSlug}/apps`
}
