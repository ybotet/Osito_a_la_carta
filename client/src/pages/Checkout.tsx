import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  createGuestOrderBodySchema,
  type GuestOrderBodyMessages,
} from '../../../shared/schemas';
import { ApiError } from '@/api/http';
import { createGuestOrder } from '@/api/orders';
import { useCartStore } from '@/store/cart';
import { saveToken } from '@/lib/guest-orders';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CheckoutFields = {
  items: { dishId: number; quantity: number }[];
  customerNote?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  deliveryAddress: string;
};

function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const schema = useMemo(() => {
    const messages: GuestOrderBodyMessages = {
      itemsMin: t('cart.itemsMin'),
      nameMin: t('checkout.nameMin'),
      nameMax: t('checkout.nameMax'),
      phoneMin: t('checkout.phoneMin'),
      phoneMax: t('checkout.phoneMax'),
      emailFormat: t('auth.errors.emailFormat'),
      emailMax: t('auth.errors.emailMax'),
      addressMin: t('checkout.addressMin'),
      addressMax: t('checkout.addressMax'),
    };

    return createGuestOrderBodySchema(messages).pick({
      items: true,
      customerNote: true,
      guestName: true,
      guestPhone: true,
      guestEmail: true,
      deliveryAddress: true,
    });
  }, [
    t,
  ]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: items.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
      })),
      customerNote: '',
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      deliveryAddress: '',
    },
  });

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t('cart.empty')}
          </CardContent>
        </Card>
        <Button asChild variant="outline" className="w-full">
          <Link to="/menu">{t('nav.menu')}</Link>
        </Button>
      </main>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await createGuestOrder({
        items: values.items,
        customerNote: values.customerNote?.trim() || undefined,
        guestName: values.guestName.trim(),
        guestPhone: values.guestPhone.trim(),
        guestEmail: values.guestEmail?.trim() || undefined,
        deliveryAddress: values.deliveryAddress.trim(),
      });

      clearCart();
      saveToken({
        token: response.order.trackingToken ?? '',
        orderId: response.order.id,
        createdAt: response.order.createdAt,
      });

      navigate(`/orders/track/${response.order.trackingToken}`, {
        state: { order: response.order },
      });
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError && error.code === 'DISH_UNAVAILABLE'
            ? t('cart.error')
            : t('checkout.error'),
      });
    }
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.title')}</CardTitle>
          <CardDescription>{t('checkout.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          {errors.root?.message !== undefined && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <form
            onSubmit={(event) => void onSubmit(event)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="guestName">{t('checkout.name')}</Label>
              <Input
                id="guestName"
                autoComplete="name"
                {...register('guestName')}
                aria-invalid={errors.guestName !== undefined}
              />
              {errors.guestName !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.guestName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="guestPhone">{t('checkout.phone')}</Label>
              <Input
                id="guestPhone"
                autoComplete="tel"
                {...register('guestPhone')}
                aria-invalid={errors.guestPhone !== undefined}
              />
              {errors.guestPhone !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.guestPhone.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="guestEmail">{t('checkout.email')}</Label>
              <Input
                id="guestEmail"
                type="email"
                autoComplete="email"
                {...register('guestEmail')}
                aria-invalid={errors.guestEmail !== undefined}
              />
              {errors.guestEmail !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.guestEmail.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryAddress">{t('checkout.address')}</Label>
              <Input
                id="deliveryAddress"
                autoComplete="street-address"
                {...register('deliveryAddress')}
                aria-invalid={errors.deliveryAddress !== undefined}
              />
              {errors.deliveryAddress !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.deliveryAddress.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="customerNote">{t('checkout.note')}</Label>
              <Input
                id="customerNote"
                {...register('customerNote')}
                aria-invalid={errors.customerNote !== undefined}
              />
              {errors.customerNote !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.customerNote.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('checkout.submitting') : t('checkout.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t('checkout.guestInfo')}
      </p>
    </main>
  );
}

export default CheckoutPage;