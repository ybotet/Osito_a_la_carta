import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { fetchOrderById } from '@/api/orders';
import { formatPrice } from '@/lib/format';

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  sent: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isAuthenticated = useAuthStore(
    (state) => state.user !== null && state.accessToken !== null,
  );
  const [order, setOrder] = useState<{
    id: number;
    createdAt: number;
    status: string;
    total: number;
    customerNote: string | null;
    items: { dishId: number; name: string; quantity: number; unitPrice: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetchOrderById(Number(id));
        setOrder(response.order);
      } catch {
        setError(t('orders.error'));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, isAuthenticated, t]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString(
      i18n.resolvedLanguage ?? i18n.language ?? 'es',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t('orders.loading')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <Card>
          <CardContent className="p-6 text-center text-destructive" role="alert">
            {error ?? t('orders.error')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const language = i18n.resolvedLanguage ?? i18n.language ?? 'es';

  return (
    <div className="mx-auto max-w-5xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {t('orders.title')} #{order.id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{t('orders.date')}</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('orders.status')}</p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_BADGE_CLASSES[order.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {t(`orders.statuses.${order.status}`)}
              </span>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t('cart.total')}</p>
              <p className="text-2xl font-bold">
                {formatPrice(order.total, language)}
              </p>
            </div>
            {order.customerNote && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {t('cart.note')}
                </p>
                <p className="font-medium">{order.customerNote}</p>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="font-medium">{t('orders.items')}</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.dishId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unitPrice, language)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.unitPrice * item.quantity, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderDetailPage;
