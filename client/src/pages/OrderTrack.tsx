import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useLocation } from 'react-router-dom';
import type { ApiOrderEnvelope, ApiOrder } from '@/api/orders.types';
import { fetchOrderByToken } from '@/api/orders';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type TrackOrderData = ApiOrderEnvelope & { contactEmail?: string };

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  sent: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrderTrackPage() {
  const { t, i18n } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const location = useLocation();

  /**
   * El estado de navegación (`Checkout.tsx` pasa `state: { order }`) se usa como
   * `initialData` para evitar una llamada API innecesaria justo después de crear
   * el pedido: el usuario ya tiene la información y no hay razón para mostrar el
   * loading mientras el servidor responde.
   */
  const locationState = location.state as { order?: ApiOrder } | null;

  const { data, isPending, isError, error, refetch } = useQuery<TrackOrderData>({
    queryKey: ['orderTrack', token],
    queryFn: () => fetchOrderByToken(token ?? '', { silent: true }),
    enabled: token !== undefined && token.length > 0,
    initialData:
      locationState?.order !== undefined
        ? ({ order: locationState.order } as TrackOrderData)
        : undefined,
  });

  if (isPending || !token) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t('track.loading')}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isError || data === undefined) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p role="alert" className="text-destructive">
              {t('track.error')}
            </p>
            {error && (
              <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
            )}
            <div className="mt-4 flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                {t('track.retry')}
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/menu">{t('nav.menu')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const language = i18n.resolvedLanguage ?? i18n.language ?? 'es';
  const order = data.order;

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString(
      language,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {t('track.title')} #{order.id}
        </h1>
        <Button variant="outline" size="sm" asChild>
          <Link to="/menu">{t('nav.menu')}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('track.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('track.date')}</p>
              <p className="font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('track.status')}</p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_BADGE_CLASSES[order.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {t(`orders.statuses.${order.status}`)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('track.name')}</p>
              <p className="font-medium">{order.guestName ?? t('orders.notProvided')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('track.phone')}</p>
              <p className="font-medium">{order.guestPhone ?? t('orders.notProvided')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('track.email')}</p>
              <p className="font-medium">{order.guestEmail ?? data.contactEmail ?? t('orders.notProvided')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('track.address')}</p>
              <p className="font-medium">{order.deliveryAddress ?? t('orders.notProvided')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">{t('track.total')}</p>
              <p className="font-medium text-lg">
                {formatPrice(order.total, language)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{t('track.items')}</p>
            <ul className="mt-2 space-y-1">
              {order.items.map((item) => (
                <li key={item.dishId} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatPrice(item.unitPrice * item.quantity, language)}</span>
                </li>
              ))}
            </ul>
          </div>

          {order.customerNote && order.customerNote.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">{t('track.note')}</p>
              <p className="text-sm">{order.customerNote}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {t('track.createAccountHint')}
            </p>
            <Button asChild className="mt-2 w-full">
              <Link
                to={{
                  pathname: '/register',
                  search: `?email=${encodeURIComponent(data.contactEmail ?? '')}&name=${encodeURIComponent(order.guestName ?? '')}&phone=${encodeURIComponent(order.guestPhone ?? '')}`,
                }}
              >
                {t('track.createAccount')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default OrderTrackPage;