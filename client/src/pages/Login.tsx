import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { createLoginBodySchema } from '../../../shared/schemas';
import { ApiError } from '../api/http';
import { loginUser } from '../api/auth';
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

type LoginFields = {
  email: string;
  password: string;
};

/**
 * `/login`: email y contraseña contra `POST /api/auth/login`.
 *
 * **El esquema se construye dentro del componente y con `useMemo`, no fuera del módulo.** Las
 * reglas vienen de `shared/schemas.ts` (las mismas que aplica el servidor) pero **los mensajes
 * salen de `t()`**: un esquema escrito en el módulo llevaría los textos en español en una
 * pantalla que puede estar en ruso. `useMemo` es para que cambiar de idioma rehaga el esquema
 * con los textos nuevos en vez de dejar los de cuando se montó.
 */
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const schema = useMemo(
    () =>
      createLoginBodySchema({
        emailMax: t('auth.errors.emailMax'),
        emailFormat: t('auth.errors.emailFormat'),
        passwordRequired: t('auth.errors.passwordRequired'),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(schema),
    // Los valores por defecto se escriben: sin ellos el campo vale `undefined`, Zod lo
    // rechaza y el usuario ve un error de campo obligatorio antes de haber tecleado nada.
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await loginUser(values);

      setSession(session.user, session.accessToken, session.refreshToken);
      // `replace` para que el login no quede en el historial: si el usuario pulsa "atrás"
      // vuelve al menú, no al formulario con la sesión ya iniciada.
      void navigate('/menu', { replace: true });
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError && error.code === 'INVALID_CREDENTIALS'
            ? t('auth.errors.invalidCredentials')
            : t('auth.errors.loginFailed'),
      });
    }
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.login.title')}</CardTitle>
          <CardDescription>{t('auth.login.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          {/*
            El error va **dentro del formulario y con `role="alert"`**, no en un toast: el
            sistema de avisos (`ErrorBoundary` + toasts) es de T-092, que es quien instala el
            componente `toast` de shadcn. Mientras tanto, un error que solo se ve en un
            elemento que desaparece a los cinco segundos dejaría a un usuario de teclado sin
            ninguna pista de por qué no le deja entrar.
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
                autoComplete="current-password"
                {...register('password')}
                aria-invalid={errors.password !== undefined}
              />
              {errors.password !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('auth.login.submitting')
                : t('auth.login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="underline underline-offset-4">
          {t('auth.login.registerLink')}
        </Link>
      </p>
    </main>
  );
};

export default Login;
