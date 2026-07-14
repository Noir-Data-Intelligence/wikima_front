import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail, Lock, User, UserPlus, ShieldCheck } from 'lucide-react';

import { api } from '@/api/client';
import AuthLayout from '@/components/AuthLayout';
import SocialAuthButtons, { OrDivider } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

export default function Register() {
  const { t } = useTranslation();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const registerSchema = z
    .object({
      fullName: z.string().min(2, t('auth_err_full_name', 'Enter your name')),
      email: z.string().email(t('auth_err_email', 'Enter a valid email')),
      // Backend enforces a minimum of 8 characters (RegisterCommandValidator).
      password: z.string().min(8, t('auth_err_password_min', 'At least 8 characters')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ['confirmPassword'],
      message: t('auth_err_password_match', "Passwords don't match"),
    });

  const otpSchema = z.object({
    otpCode: z.string().min(4, t('auth_err_otp', 'Enter the code')),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });
  const otpForm = useForm({ resolver: zodResolver(otpSchema), defaultValues: { otpCode: '' } });

  const onRegister = async ({ fullName, email: em, password }) => {
    setError('');
    try {
      // Backend contract: { email, password, full_name } →
      // { requires_otp?, access_token?, user? }. The token is only present when
      // OTP verification is disabled; otherwise it comes back from verify-otp.
      const res = await api.auth.register({ email: em, password, full_name: fullName });
      if (res?.requires_otp) {
        setEmail(em);
        setStep('otp');
        return;
      }
      api.auth.setToken(res.access_token);
      window.location.href = '/onboarding';
    } catch (err) {
      setError(err.message || t('auth_err_register', 'Could not create account'));
    }
  };

  const onVerify = async ({ otpCode }) => {
    setError('');
    try {
      // Backend expects { email, code }.
      const res = await api.auth.verifyOtp({ email, code: otpCode });
      api.auth.setToken(res.access_token);
      window.location.href = '/onboarding';
    } catch (err) {
      setError(err.message || t('auth_err_otp_invalid', 'Invalid code'));
    }
  };

  const registering = registerForm.formState.isSubmitting;
  const verifying = otpForm.formState.isSubmitting;

  return (
    <AuthLayout
      icon={step === 'otp' ? ShieldCheck : UserPlus}
      title={step === 'otp' ? t('auth_verify_title', 'Verify your email') : t('auth_register_title', 'Create account')}
      subtitle={step === 'otp'
        ? t('auth_verify_subtitle', 'Enter the code we sent to') + ` ${email}`
        : t('auth_register_subtitle', 'Start using WiKima for free')}
      footer={
        <>
          {t('auth_have_account', 'Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth_login_cta', 'Log in')}
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {step === 'form' ? (
          <>
            <SocialAuthButtons next="/onboarding" />
            <OrDivider />
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth_full_name', 'Full name')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="text" autoComplete="name" autoFocus placeholder={t('auth_full_name_ph', 'Your name')} className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth_email', 'Email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="email" autoComplete="email" placeholder="you@example.com" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth_password', 'Password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="password" autoComplete="new-password" placeholder="••••••••" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth_confirm_password', 'Confirm password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="password" autoComplete="new-password" placeholder="••••••••" className="h-11 pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="h-11 w-full font-medium" disabled={registering}>
                  {registering ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth_creating', 'Creating…')}</> : t('auth_create_account', 'Create account')}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otpCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth_otp_label', 'Verification code')}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" autoFocus placeholder="000000" className="h-12 text-center text-lg tracking-[0.5em]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="h-11 w-full font-medium" disabled={verifying}>
                {verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth_verifying', 'Verifying…')}</> : t('auth_verify_cta', 'Verify')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth_no_code', "Didn't get it?")}{' '}
                <button type="button" onClick={() => api.auth.resendOtp(email)} className="font-medium text-primary hover:underline">
                  {t('auth_resend', 'Resend code')}
                </button>
              </p>
            </form>
          </Form>
        )}
      </div>
    </AuthLayout>
  );
}
