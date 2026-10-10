import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useIsAuthenticated } from '../../store/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchAdminOrderById, updateAdminOrderStatus } from '../../api/orders';
import { formatDate, formatPrice } from '../../lib/format';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft } from 'lucide-react';

/**
 * Estados válidos de pedido para el selector de estado.
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
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

/**
 * Transiciones permitidas para el selector de estado.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['sent', 'cancelled'],
  sent: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const isOrderStatus = (status: string): status is OrderStatus =>
  ORDER_STATUSES.some((validStatus) => validStatus === status);

/**
 * Esqueleto de carga para el detalle.
 */
const AdminOrderDetailSkeleton = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" className="animate-pulse">
          <div className="h-4 w-8 rounded bg-muted" />
        </Button>
        <div className="h-9 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/4 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-32 w-full rounded bg-muted" />
          <div className="h-10 w-1/4 rounded bg-muted" />
        </CardContent>
      </Card>
      <Card className="mt-4 animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/4 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full rounded bg-muted" />
        </CardContent>
      </Card>
      <p className="sr-only" role="status">
        {t('admin.orderDetail.loading')}
      </p>
    </main>
  );
};

/**
 * Estado de error con botón de reintento.
 */
const AdminOrderDetailError = ({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold">{t('admin.orders.title')}</h1>
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <p
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
          >
            {t('admin.orderDetail.error')}
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <Button variant="outline" onClick={onRetry}>
              {t('admin.orderDetail.retry')}
            </Button>
            <Button variant="outline" onClick={onBack}>
              {t('common.back')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

/**
 * Badge de estado con color semántico.
 */
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const { t } = useTranslation();

  return (
    <Badge variant="secondary" className={STATUS_COLORS[status]}>
      {t(`admin.orderDetail.statuses.${status}`)}
    </Badge>
  );
};

/**
 * Página de detalle de pedido para admin.
 *
 * Requiere rol admin. Si no hay sesión o no es admin, redirige a /menu.
 * Muestra: datos del cliente (email), fecha, nota, items con cantidades y precios, total.
 * Botones para cambiar estado (según transiciones válidas).
 * Botón "Volver".
 */
const AdminOrderDetail = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const [statusSelection, setStatusSelection] = useState<{
    fromStatus: OrderStatus;
    nextStatus: OrderStatus | '';
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusUpdateFailedFor, setStatusUpdateFailedFor] =
    useState<OrderStatus | null>(null);

  // Redirigir si no hay sesión o no es admin
  useEffect(() => {
    if (!isAuthenticated || !accessToken || user?.role !== 'admin') {
      navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, accessToken, user?.role, navigate]);

  // Query para obtener el detalle del pedido
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['adminOrderDetail', orderId, language],
    queryFn: () => fetchAdminOrderById(orderId),
    enabled: isAuthenticated && user?.role === 'admin' && Number.isInteger(orderId) && orderId > 0,
  });

  const dataStatus =
    data && isOrderStatus(data.status) ? data.status : undefined;
  const selectedStatus =
    dataStatus && statusSelection?.fromStatus === dataStatus
      ? statusSelection.nextStatus
      : '';

  const handleStatusChange = async () => {
    if (
      !data ||
      !isOrderStatus(data.status) ||
      !isOrderStatus(selectedStatus) ||
      !ALLOWED_TRANSITIONS[data.status].includes(selectedStatus)
    ) {
      return;
    }

    setIsUpdating(true);
    setStatusUpdateFailedFor(null);
    try {
      const updatedOrder = await updateAdminOrderStatus(orderId, selectedStatus);
      queryClient.setQueryData(
        ['adminOrderDetail', orderId, language],
        updatedOrder,
      );
      await queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    } catch {
      setStatusUpdateFailedFor(data.status);
    } finally {
      setIsUpdating(false);
    }
  };

  // Mostrar skeleton mientras se resuelve la autenticación/redirect
  if (!isAuthenticated || user?.role !== 'admin') {
    return <AdminOrderDetailSkeleton />;
  }

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">
            {t('admin.orderDetail.title', { id: id ?? '' })}
          </h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{t('admin.orderDetail.invalidId')}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/orders')}>
              {t('common.back')}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isPending && !data) {
    return <AdminOrderDetailSkeleton />;
  }

  if (isError && !data) {
    return <AdminOrderDetailError onRetry={() => refetch()} onBack={() => navigate('/admin/orders')} />;
  }

  const order = data;

  if (!order) {
    return <AdminOrderDetailSkeleton />;
  }

  // Determinar qué transiciones son permitidas para el estado actual
  if (!isOrderStatus(order.status)) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('admin.orders.title')}</h1>
        </div>
        <p role="alert" className="text-destructive">
          {t('admin.orderDetail.invalidStatus')}
        </p>
      </main>
    );
  }

  const currentStatus = order.status;
  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus];
  const isFinalState = allowedNextStatuses.length === 0;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold">
          {t('admin.orderDetail.title', { id: order.id })}
        </h1>
      </div>

      <div className="space-y-4">
        {/* Información del pedido */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.orderDetail.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.orderDetail.client')}</p>
                <p className="font-medium">{order.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.orderDetail.date')}</p>
                <p className="font-medium">{formatDate(order.createdAt, language)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.orderDetail.status')}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={currentStatus} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.orderDetail.total')}</p>
                <p className="font-medium text-lg">{formatPrice(order.total, language)}</p>
              </div>
            </div>

            {order.customerNote && order.customerNote.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">{t('admin.orderDetail.note')}</p>
                <p className="font-medium">{order.customerNote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items del pedido */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.orderDetail.items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="p-3 font-medium">{t('admin.orderDetail.colItem')}</th>
                    <th className="p-3 font-medium text-center">{t('admin.orderDetail.colQty')}</th>
                    <th className="p-3 font-medium text-right">{t('admin.orderDetail.colUnitPrice')}</th>
                    <th className="p-3 font-medium text-right">{t('admin.orderDetail.colSubtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.dishId} className="border-b">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">{formatPrice(item.unitPrice, language)}</td>
                      <td className="p-3 text-right font-medium">
                        {formatPrice(item.unitPrice * item.quantity, language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="p-3" colSpan={3}>{t('admin.orderDetail.total')}</td>
                    <td className="p-3 text-right">{formatPrice(order.total, language)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cambio de estado */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.orderDetail.changeStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isFinalState ? (
              <p className="text-muted-foreground">
                {t('admin.orderDetail.finalState', { status: t(`admin.orderDetail.statuses.${currentStatus}`) })}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">{t('admin.orderDetail.currentStatus')}</p>
                <StatusBadge status={currentStatus} />
                <div className="w-full sm:w-auto">
                  <Select
                    value={selectedStatus}
                    onValueChange={(status) => {
                      if (
                        isOrderStatus(status) &&
                        allowedNextStatuses.includes(status)
                      ) {
                        setStatusSelection({
                          fromStatus: currentStatus,
                          nextStatus: status,
                        });
                      }
                    }}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder={t('admin.orderDetail.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedNextStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`admin.orderDetail.statuses.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStatusChange}
                    disabled={isUpdating || !selectedStatus || selectedStatus === currentStatus}
                  >
                    {isUpdating ? t('admin.orderDetail.updating') : t('admin.orderDetail.update')}
                  </Button>
                </div>
              </div>
            )}
            {statusUpdateFailedFor === currentStatus && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {t('admin.orderDetail.statusUpdateError')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminOrderDetail;