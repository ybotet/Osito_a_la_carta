import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useIsAuthenticated } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listAdminOrders } from '../../api/orders';
import { formatPrice } from '../../lib/format';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowUpDown } from 'lucide-react';

/**
 * Estados válidos de pedido para el filtro.
 */
const ORDER_STATUSES = [
  'pending',
  'preparing',
  'sent',
  'delivered',
  'cancelled',
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Mapa de colores para badges de estado.
 */
const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

/**
 * Formatea un timestamp Unix a fecha legible.
 */
const formatDate = (timestamp: number, language: string): string => {
  try {
    return new Date(timestamp * 1000).toLocaleDateString(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(timestamp);
  }
};

/**
 * Esqueleto de carga para la tabla.
 */
const AdminOrdersSkeleton = () => (
  <main className="mx-auto max-w-7xl p-4">
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold animate-pulse">Estadísticas</h1>
      <div className="animate-pulse w-48 h-10 bg-muted rounded" />
    </div>
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold animate-pulse">Pedidos</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {['#', 'Cliente', 'Fecha', 'Estado', 'Total', 'Acciones'].map((h) => (
                  <th key={h} className="p-3 text-left animate-pulse bg-muted h-10" />
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className="p-3">
                      <div className="h-4 w-24 bg-muted rounded" />
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

/**
 * Estado de error con botón de reintento.
 */
const AdminOrdersError = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-3xl font-bold">{t('admin.orders.title')}</h1>
      <Card>
        <CardContent className="p-6 text-center">
          <p
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
          >
            {t('admin.orders.error')}
          </p>
          {message && (
            <p className="mt-2 text-xs text-muted-foreground">{message}</p>
          )}
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            {t('admin.orders.retry')}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

/**
 * Badge de estado con color semántico.
 */
const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge variant="secondary" className={statusColors[status]}>
    {status}
  </Badge>
);

/**
 * Página de administración de pedidos.
 *
 * Requiere rol admin. Si no hay sesión o no es admin, redirige a /menu.
 * Tabla con: #pedido, cliente, fecha, estado, total, acciones.
 * Polling cada 10s (refetchInterval).
 * Filtro por estado (dropdown).
 * Click en un pedido abre detalle (página).
 */
const AdminOrders = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  // Redirigir si no hay sesión o no es admin
  useEffect(() => {
    if (!isAuthenticated || !accessToken || user?.role !== 'admin') {
      navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, accessToken, user?.role, navigate]);

  // Filtro de estado
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Query con polling cada 10s
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['adminOrders', statusFilter, language],
    queryFn: () => listAdminOrders(statusFilter === 'all' ? undefined : statusFilter),
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 10_000, // 10 segundos
    staleTime: 5_000,
  });

  // Mostrar skeleton mientras se resuelve la autenticación/redirect
  if (!isAuthenticated || user?.role !== 'admin') {
    return <AdminOrdersSkeleton />;
  }

  if (isPending && !data) {
    return <AdminOrdersSkeleton />;
  }

  if (isError) {
    return <AdminOrdersError message={error?.message} onRetry={() => refetch()} />;
  }

  const orders = data ?? [];

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('admin.orders.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.orders.filterAll')} />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.orders.filterAll')}</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`admin.orders.statuses.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
</Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {t('admin.orders.refresh')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('admin.orders.listTitle')}</h2>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('admin.orders.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="p-3 font-medium">{t('admin.orders.colId')}</th>
                    <th className="p-3 font-medium">{t('admin.orders.colClient')}</th>
                    <th className="p-3 font-medium">{t('admin.orders.colDate')}</th>
                    <th className="p-3 font-medium">{t('admin.orders.colStatus')}</th>
                    <th className="p-3 font-medium text-right">{t('admin.orders.colTotal')}</th>
                    <th className="p-3 font-medium text-right">{t('admin.orders.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <td className="p-3 font-mono text-sm">#{order.id}</td>
                      <td className="p-3">
                        <div className="font-medium">{order.userEmail}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {order.userId}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDate(order.createdAt, language)}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatPrice(order.total, language)}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${order.id}`);
                          }}
                        >
                          {t('admin.orders.view')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/*
        Indicador de última actualización (silencioso, solo para debug visual).
        Se actualiza cada vez que refetchInterval dispara una nueva query.
      */}
      <p className="mt-4 text-xs text-muted-foreground text-center">
        {t('admin.orders.lastUpdate', { time: new Date().toLocaleTimeString(language) })}
      </p>
    </main>
  );
};

export default AdminOrders;