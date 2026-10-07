import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { listOrders } from '@/api/orders';
import { formatPrice } from '@/lib/format';

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  sent: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(
    (state) => state.user !== null && state.accessToken !== null,
  );
  const [orders, setOrders] = useState<
    { id: number; createdAt: number; status: string; total: number; itemCount: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const language = i18n.resolvedLanguage ?? i18n.language ?? 'es';

   useEffect(() => {
     if (!isAuthenticated) {
       navigate('/login', { replace: true });
       return;
     }

     const load = async () => {
       try {
         const response = await listOrders();

         const mapped = response.orders.map((order) => ({
           id: order.id,
           createdAt: order.createdAt,
           status: order.status,
           total: order.total,
           itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
         }));

         setOrders(mapped);
       } catch {
         setError(t('orders.error'));
       } finally {
         setIsLoading(false);
       }
     };

     load();
   }, [isAuthenticated, navigate, i18n, t]);

   const formatDate = (timestamp: number): string => {
     return new Date(timestamp * 1000).toLocaleDateString(language, {
       year: 'numeric',
       month: 'short',
       day: 'numeric',
     });
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

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <Card>
          <CardContent className="p-6 text-center text-destructive" role="alert">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t('orders.empty')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('orders.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => navigate(`/orders/${order.id}`)}
              className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex-1">
                <p className="font-medium">#{order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {t('orders.date')}: {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="mx-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_BADGE_CLASSES[order.status] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {t(`orders.statuses.${order.status}`)}
                </span>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatPrice(order.total, language)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('orders.items')}: {order.itemCount}
                </p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default OrdersPage;
