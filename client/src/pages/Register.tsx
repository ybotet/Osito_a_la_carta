import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  BCRYPT_MAX_BYTES,
  createRegisterBodySchema,
} from '../../../shared/schemas';
import { ApiError } from '../api/http';
import { loginUser, registerUser } from '../api/auth';
import type { ApiPreferredLang } from '../api/auth.types';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../lib/i18n';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
 * **Después de registrarse entra sola.** El criterio de la tarea es "registro nuevo redirige
 * a `/menu` autenticado", y `POST /api/auth/register` (T-040) devuelve **solo** el usuario:
 * no hay tokens que guardar. La página hace por eso las dos llamadas, `register` y luego
 * `login` con las mismas credenciales, y solo entonces mete la sesión en el store y redirige.
 * La alternativa (que el registro devolviera tokens) tocaría un endpoint ya verificado y
 * además dejaría al usuario parado en un formulario vacío.
 */
const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const schema = useMemo(
    () =>
      // `omit` porque el formulario solo valida **lo que teclea el usuario**. `preferredLang`
      // no es un campo del formulario: sale del idioma de la interfaz, y por eso se quita
      // aquí y se añade en el `submit` (donde además se comprueba contra la lista de
      // idiomas). Quitándolo, el tipo del formulario y el del esquema cuadran sin `cast`, y
      // la regla del enum sigue aplicándola el servidor, que es quien recibe el valor.
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
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    // El idioma del alta es el que el usuario está viendo, que es lo que SPEC §7.2 guarda.
    // `resolvedLanguage` es el que i18next tiene resuelto ('es', 'ru' o 'en'); se filtra por
    // la lista porque el backend solo acepta esos tres y un valor raro sería un 400.
    const language: ApiPreferredLang = isSupportedLanguage(
      i18n.resolvedLanguage,
    )
      ? i18n.resolvedLanguage
      : DEFAULT_LANGUAGE;

    try {
      await registerUser({ ...values, preferredLang: language });

      const session = await loginUser(values);

      setSession(session.user, session.accessToken, session.refreshToken);
      void navigate('/menu', { replace: true });
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
          {/*
            Mismo criterio que en `Login`: el error va dentro del formulario con
            `role="alert"` porque el sistema de avisos es de T-092. Un 409 `EMAIL_TAKEN` no es
            un fallo del formulario sino que la cuenta ya existe, y por eso tiene su propio
            mensaje en lugar del genérico.
          */}
          {errors.root?.message !== undefined && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

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
