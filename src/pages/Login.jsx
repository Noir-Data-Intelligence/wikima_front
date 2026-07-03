import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react';

import { api } from '@/api/client';
import AuthLayout from '@/components/AuthLayout';
import SocialAuthButtons, { OrDivider } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

export default function Login() {
  const { t } = useTranslation();
  const [error, setError] = useState('');

  const schema = z.object({
    email: z.string().email(t('auth_err_email', 'Enter a valid email')),
    password: z.string().min(1, t('auth_err_password_required', 'Password is required')),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    setError('');
    try {
      await api.auth.loginViaEmailPassword(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || t('auth_err_invalid_credentials', 'Invalid email or password'));
    }
  };

  const loading = form.formState.isSubmitting;

  return (
    <AuthLayout
      icon={LogIn}
      title={t('auth_login_title', 'Welcome back')}
      subtitle={t('auth_login_subtitle', 'Log in to your account')}
      footer={
        <>
          {t('auth_no_account', "Don't have an account?")}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('auth_create_account', 'Create account')}
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <SocialAuthButtons next="/dashboard" />
        <OrDivider />

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth_email', 'Email')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" autoComplete="email" autoFocus placeholder="you@example.com" className="h-11 pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('auth_password', 'Password')}</FormLabel>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      {t('auth_forgot_password', 'Forgot password?')}
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" autoComplete="current-password" placeholder="••••••••" className="h-11 pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="h-11 w-full font-medium" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth_logging_in', 'Logging in…')}</> : t('auth_login_cta', 'Log in')}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}
