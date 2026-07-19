'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FormMessage, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function RegisterForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)

    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/kernel/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        orgName: String(form.get('orgName') || ''),
        name: String(form.get('name') || ''),
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      }),
    })
    const result = (await response.json()) as { error: { message: string } | null }

    setMessage(result.error ? result.error.message : 'Registration created. You can sign in now.')
    setPending(false)
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Field>
        <Label htmlFor="register-organization" required>Organization</Label>
        <Input
          id="register-organization"
          name="orgName"
          autoComplete="organization"
          required
        />
        <FieldDescription>The server derives tenant identity. This form does not submit an organization ID.</FieldDescription>
      </Field>
      <Field>
        <Label htmlFor="register-name" required>Name</Label>
        <Input
          id="register-name"
          name="name"
          autoComplete="name"
          required
        />
      </Field>
      <Field>
        <Label htmlFor="register-email" required>Email</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Field>
        <Label htmlFor="register-password" required>Password</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Button className="w-full" disabled={pending} type="submit" variant="primary">
        {pending ? 'Creating account...' : 'Create organization account'}
      </Button>
      <FormMessage tone={message === 'Registration created. You can sign in now.' ? 'success' : 'danger'}>{message}</FormMessage>
    </form>
  )
}
