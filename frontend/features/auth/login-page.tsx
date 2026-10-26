'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { NorthstarLogo } from '@/components/northstar-logo'
import { loginApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { ui } from '@/lib/ui'
import { loginFormSchema, type LoginFormValues } from '@/lib/validators/login'
import { useAuthStore } from '@/stores/auth-store'

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: 'admin@demo-acme.com',
      password: 'Password123!',
      organizationSlug: 'demo-acme',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const session = await loginApi({
        email: values.email,
        password: values.password,
        organizationSlug: values.organizationSlug || undefined,
      })
      setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        organization: session.organization,
        membership: session.membership,
      })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to sign in. Check the API is running.'
      setFormError(message)
    }
  })

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className={`${ui.panel} w-full max-w-md p-8 text-slate-900 shadow-md`}>
        <div className="mb-8">
          <NorthstarLogo />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Connect to your Northstar CRM workspace.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Email</span>
            <input
              type="email"
              autoComplete="username"
              className={`${ui.input} w-full`}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <span className="text-xs text-rose-600">{form.formState.errors.email.message}</span>
            )}
          </label>

          <div className="block space-y-1.5">
            <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${ui.input} w-full pr-10`}
                {...form.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <span className="text-xs text-rose-600">{form.formState.errors.password.message}</span>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">
              Organization slug <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <input
              type="text"
              className={`${ui.input} w-full`}
              placeholder="demo-acme"
              {...form.register('organizationSlug')}
            />
          </label>

          {formError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={`${ui.buttonPrimary} w-full py-2.5 disabled:opacity-60`}
          >
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-slate-400">
          Demo: <span className="font-medium text-slate-600 dark:text-slate-300">admin@demo-acme.com</span> /{' '}
          <span className="font-medium text-slate-600 dark:text-slate-300">Password123!</span>
        </p>
      </div>
    </div>
  )
}
