import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyEmail } from '@/api/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { isPending, isError, isSuccess } = useQuery({
    queryKey: ['verifyEmail', token],
    queryFn: () => verifyEmail(token, { silent: true }),
    enabled: token.length > 0,
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        void navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>
            {t('auth.register.subtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {isPending && (
            <p className="text-sm text-muted-foreground">
              {t('auth.register.verifying')}
            </p>
          )}

          {isSuccess && (
            <>
              <p className="text-center text-sm text-green-600">
                {t('auth.register.verificationSuccess')}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.register.redirectToLogin')}
              </p>
            </>
          )}

          {isError && (
            <>
              <p className="text-center text-sm text-destructive">
                {t('auth.register.verificationError')}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">{t('auth.register.loginLink')}</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default VerifyEmailPage;
