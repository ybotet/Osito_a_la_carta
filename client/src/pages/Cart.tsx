import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore, selectTotalItems, selectTotalPrice } from '@/store/cart';
import { formatPrice } from '@/lib/format';

function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalItems = useCartStore(selectTotalItems);
  const totalPrice = useCartStore(selectTotalPrice);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const handleQuantityChange = (dishId: number, raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value) || value < 1) {
      removeItem(dishId);
    } else {
      updateQuantity(dishId, Math.round(value));
    }
  };

  const handleCheckout = () => {
    setError(null);
    // Ir al formulario de checkout (invitado o autenticado)
    void navigate('/checkout');
  };

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
          >
            {t('cart.checkout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default CartPage;
