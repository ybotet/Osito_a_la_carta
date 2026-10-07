import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { useCartStore, selectTotalItems, selectTotalPrice } from '@/store/cart';
import { createOrder } from '@/api/orders';
import { formatPrice } from '@/lib/format';

function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(
    (state) => state.user !== null && state.accessToken !== null,
  );
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalItems = useCartStore(selectTotalItems);
  const totalPrice = useCartStore(selectTotalPrice);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleQuantityChange = (dishId: number, raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value) || value < 1) {
      removeItem(dishId);
    } else {
      updateQuantity(dishId, Math.round(value));
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await createOrder(
        items.map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
        note.trim() || undefined,
      );

      clearCart();
      navigate(`/orders/${response.order.id}`);
    } catch {
      setError(t('cart.error'));
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t('cart.empty')}
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
          <CardTitle>{t('cart.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.dishId}
                className="flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price, language)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${item.dishId}`} className="sr-only">
                    {t('cart.total')}
                  </Label>
                  <Input
                    id={`qty-${item.dishId}`}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.dishId, e.target.value)
                    }
                    className="w-20"
                  />
                </div>
                <p className="w-24 text-right font-medium">
                  {formatPrice(item.price * item.quantity, language)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.dishId)}
                >
                  {t('cart.remove')}
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>{t('cart.totalItems')}</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t('cart.totalPrice')}</span>
              <span>{formatPrice(totalPrice, language)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('cart.note')}</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=""
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? t('cart.checkingOut') : t('cart.checkout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default CartPage;
