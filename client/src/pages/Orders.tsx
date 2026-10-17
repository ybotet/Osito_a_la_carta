import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { listOrders } from '@/api/orders';
import { formatPrice } from '@/lib/format';
import { getTokens, removeToken } from '@/lib/guest-orders';
import type { GuestTokenEntry } from '@/lib/guest-orders';
import { Button } from '@/components/ui/button';

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
    {
      id: number;
      createdAt: number;
      status: string;
      total: number;
      itemCount: number;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [guestTokens, setGuestTokens] = useState<GuestTokenEntry[]>(
    () => getTokens(),
  );
  const [showAllGuest, setShowAllGuest] = useState(false);

  const language = i18n.resolvedLanguage ?? i18n.language ?? 'es';

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const load = async () => {
      try {
        const response = await listOrders({ silent: true });

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

  const handleGuestClick = (token: string) => {
    removeToken(token);
    setGuestTokens(getTokens());
    void navigate(`/orders/track/${token}`);
  };

  const handleCreateAccount = () => {
    void navigate(`/register`);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.guestOrdersTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {guestTokens.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                {t('orders.guestOrdersEmpty')}
              </p>
            ) : (
              <div className="space-y-3">
                {(showAllGuest ? guestTokens : [guestTokens[0]!]).map((entry) => (
                  <button
                    key={entry.token}
                    type="button"
                    onClick={() => handleGuestClick(entry.token)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        #{entry.orderId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('orders.date')}: {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <Button variant="link" size="sm">
                      {t('orders.guestOrdersLast')}
                    </Button>
                  </button>
                ))}
                {!showAllGuest && guestTokens.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllGuest(true)}
                    className="w-full"
                  >
                    {t('orders.guestOrdersAll')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {guestTokens.length > 0 && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={handleCreateAccount}
              >
                {t('track.createAccount')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    );
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
          <CardContent
            className="p-6 text-center text-destructive"
            role="alert"
          >
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
                    STATUS_BADGE_CLASSES[order.status] ??
                    'bg-gray-100 text-gray-800'
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
