import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BCRYPT_MAX_BYTES,
  createRegisterBodySchema,
} from '../../../shared/schemas';
import { ApiError } from '@/api/http';
import { registerUser } from '@/api/auth';
import type { ApiPreferredLang } from '@/api/auth.types';
import { DEFAULT_LANGUAGE, LANGUAGES } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegisterFields = {
  email: string;
  password: string;
};

const isSupportedLanguage = (
  value: string | undefined,
): value is ApiPreferredLang =>
  LANGUAGES.some((language) => language === value);

/**
 * `/register`: alta de cliente.
 *
 * **Tras registrarse, se envía un email de verificación.** El endpoint
 * `POST /api/auth/register` devuelve el usuario sin tokens de sesión; el
 * servidor genera un token de verificación y envía un email con el enlace.
 * El cliente no hace login automático hasta que el usuario haga click en el
 * enlace de verificación.
 *
 * **Precarga desde query params (T-098b):** si viene de `/orders/track/:token`
 * con `?email=`, precarga el email para que el usuario no tenga que repetirlo.
 * Los campos `name` y `phone` no son parte del RegisterBody (el registro solo
 * toma email, password y preferredLang), así que no se precargan.
 */
const Register = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const preemail = searchParams.get('email') ?? '';

  const schema = useMemo(
    () =>
      createRegisterBodySchema({
        emailMax: t('auth.errors.emailMax'),
        emailFormat: t('auth.errors.emailFormat'),
        passwordMin: t('auth.errors.passwordMin'),
        passwordOnlySpaces: t('auth.errors.passwordOnlySpaces'),
        passwordTooLong: t('auth.errors.passwordTooLong', {
          max: BCRYPT_MAX_BYTES,
        }),
      }).omit({ preferredLang: true }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: preemail,
      password: '',
    },
  });

  const [registeredEmail, setRegisteredEmail] = useState('');

  const onSubmit = handleSubmit(async (values) => {
    const language: ApiPreferredLang = isSupportedLanguage(
      i18n.resolvedLanguage,
    )
      ? i18n.resolvedLanguage
      : DEFAULT_LANGUAGE;

    try {
      await registerUser({ ...values, preferredLang: language }, { silent: true });
      setRegisteredEmail(values.email);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError && error.code === 'EMAIL_TAKEN'
            ? t('auth.errors.emailTaken')
            : t('auth.errors.registerFailed'),
      });
    }
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          {errors.root?.message !== undefined && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          {registeredEmail ? (
            <p className="text-center text-sm text-muted-foreground">
              {t('auth.register.verificationSent', { email: registeredEmail })}
            </p>
          ) : (
            <form
              onSubmit={(event) => void onSubmit(event)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t('auth.fields.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  aria-invalid={errors.email !== undefined}
                />
                {errors.email !== undefined && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t('auth.fields.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  aria-invalid={errors.password !== undefined}
                />
                {errors.password !== undefined && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('auth.register.passwordHint', { min: 8 })}
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('auth.register.submitting')
                  : t('auth.register.submit')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="underline underline-offset-4">
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </main>
  );
};

export default Register;
