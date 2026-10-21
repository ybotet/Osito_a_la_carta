import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useIsAuthenticated } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { listAdminUsers } from '../../api/users';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { formatDate } from '../../lib/format';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const AdminUsersSkeleton = () => (
  <main className="mx-auto max-w-7xl p-4">
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold animate-pulse">Usuarios</h1>
      <div className="animate-pulse w-48 h-10 bg-muted rounded" />
    </div>
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold animate-pulse">Lista</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {['#', 'Email', 'Rol', 'Verificado', 'Creado'].map((h) => (
                  <th key={h} className="p-3 text-left animate-pulse bg-muted h-10" />
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  {Array.from({ length: 5 }, (_, j) => (
                    <td key={j} className="p-3">
                      <div className="h-4 w-20 bg-muted rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </main>
);

const AdminUsersError = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-3xl font-bold">{t('admin.users.title')}</h1>
      <Card>
        <CardContent className="p-6 text-center">
          <p
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
          >
            {t('admin.users.error')}
          </p>
          {message && (
            <p className="mt-2 text-xs text-muted-foreground">{message}</p>
          )}
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            {t('admin.users.retry')}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

const AdminUsers = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !accessToken || user?.role !== 'admin') {
      navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, accessToken, user?.role, navigate]);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => listAdminUsers({ silent: true }),
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 30_000,
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return <AdminUsersSkeleton />;
  }

  if (isPending && !data) {
    return <AdminUsersSkeleton />;
  }

  if (isError) {
    return <AdminUsersError message={error?.message} onRetry={() => refetch()} />;
  }

  const users = data ?? [];

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('admin.users.title')}</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {t('admin.users.refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('admin.users.listTitle')}</h2>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('admin.users.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">{t('admin.users.colId')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colEmail')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colRole')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colName')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colPhone')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colAddress')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colVerified')}</th>
                    <th className="p-3 text-left font-medium">{t('admin.users.colCreated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="p-3">{u.id}</td>
                      <td className="p-3 break-all">{u.email}</td>
                      <td className="p-3">
                        <Badge
                          variant="secondary"
                          className={roleColors[u.role] ?? roleColors.customer}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3">{u.name ?? '—'}</td>
                      <td className="p-3">{u.phone ?? '—'}</td>
                      <td className="p-3">{u.deliveryAddress ?? '—'}</td>
                      <td className="p-3">
                        {u.emailVerified === 1 ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {t('admin.users.verified')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            {t('admin.users.unverified')}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {formatDate(u.createdAt, language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminUsers;
