import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  createGuestOrderBodySchema,
  type GuestOrderBodyMessages,
} from '../../../shared/schemas';
import { ApiError } from '@/api/http';
import { createOrder, createGuestOrder } from '@/api/orders';
import { updateUserProfile } from '@/api/auth';
import { useCartStore } from '@/store/cart';
import { useAuthStore, useIsAuthenticated } from '@/store/auth';
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

type GuestOrderFields = {
  items: { dishId: number; quantity: number }[];
  customerNote?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  deliveryAddress: string;
};

type AuthOrderFields = {
  items: { dishId: number; quantity: number }[];
  customerNote?: string;
  name: string;
  phone: string;
  email: string;
  deliveryAddress: string;
};

function AuthCheckoutForm({
  items,
  clearCart,
  navigate,
  user,
  t,
}: {
  items: { dishId: number; quantity: number }[];
  clearCart: () => void;
  navigate: ReturnType<typeof useNavigate>;
  user: { email: string; name?: string | null; phone?: string | null; deliveryAddress?: string | null } | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const authSchema = useMemo(() => {
    return z.object({
      items: z
        .array(
          z.object({
            dishId: z.number().int().positive(),
            quantity: z.number().int().min(1),
          }),
        )
        .min(1, { message: t('cart.itemsMin') })
        .refine(
          (items) =>
            new Set(items.map((item) => item.dishId)).size === items.length,
          { message: 'No se puede repetir el mismo plato en un pedido' },
        ),
      customerNote: z.string().trim().max(500).optional(),
      name: z
        .string()
        .trim()
        .min(2, { message: t('checkout.nameMin') })
        .max(100, { message: t('checkout.nameMax') }),
      phone: z
        .string()
        .trim()
        .min(5, { message: t('checkout.phoneMin') })
        .max(20, { message: t('checkout.phoneMax') }),
      email: z
        .string()
        .trim()
        .email({ message: t('auth.errors.emailFormat') })
        .max(254, { message: t('auth.errors.emailMax') }),
      deliveryAddress: z
        .string()
        .trim()
        .min(5, { message: t('checkout.addressMin') })
        .max(500, { message: t('checkout.addressMax') }),
    });
  }, [t]);

  const baseValues = useMemo(
    () => ({
      items: items.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
      })),
      customerNote: '',
    }),
    [items],
  );

  const authDefaultValues = useMemo(
    () => ({
      ...baseValues,
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      deliveryAddress: user?.deliveryAddress ?? '',
    }),
    [baseValues, user?.name, user?.phone, user?.email, user?.deliveryAddress],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: authIsSubmitting },
  } = useForm<AuthOrderFields>({
    resolver: zodResolver(authSchema),
    defaultValues: authDefaultValues,
  });

  const onSubmitAuth = async (values: AuthOrderFields) => {
    try {
      // Guardar el perfil si ha cambiado
      const profileData = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        deliveryAddress: values.deliveryAddress.trim(),
      };

      await updateUserProfile(profileData, { silent: true });

      const response = await createOrder(
        values.items,
        values.customerNote?.trim() || undefined,
        { silent: true },
      );

      clearCart();

      navigate(`/orders/${response.order.id}`, {
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
  };

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

          <p className="mb-4 text-sm text-muted-foreground">
            {t('checkout.authInfo', { email: user?.email })}
          </p>

          <form
            onSubmit={(event) => void handleSubmit(onSubmitAuth)(event)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('checkout.name')}</Label>
              <Input
                id="name"
                autoComplete="name"
                {...register('name')}
                aria-invalid={errors.name !== undefined}
              />
              {errors.name !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t('checkout.phone')}</Label>
              <Input
                id="phone"
                autoComplete="tel"
                {...register('phone')}
                aria-invalid={errors.phone !== undefined}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
              {errors.phone !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('checkout.phoneFormat')}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('checkout.email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                aria-invalid={errors.email !== undefined}
                readOnly
                disabled
              />
              {errors.email !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
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

            <Button type="submit" disabled={authIsSubmitting}>
              {authIsSubmitting ? t('checkout.submitting') : t('checkout.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t('checkout.loginInfo')}
      </p>
    </main>
  );
}

function GuestCheckoutForm({
  items,
  clearCart,
  navigate,
  user,
  t,
}: {
  items: { dishId: number; quantity: number }[];
  clearCart: () => void;
  navigate: ReturnType<typeof useNavigate>;
  user: { email: string } | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const guestSchema = useMemo(() => {
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
  }, [t]);

  const baseValues = useMemo(
    () => ({
      items: items.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
      })),
      customerNote: '',
    }),
    [items],
  );

  const guestDefaultValues = useMemo(
    () => ({
      ...baseValues,
      guestName: '',
      guestPhone: '',
      guestEmail: user?.email ?? '',
      deliveryAddress: '',
    }),
    [baseValues, user?.email],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: guestIsSubmitting },
  } = useForm<GuestOrderFields>({
    resolver: zodResolver(guestSchema),
    defaultValues: guestDefaultValues,
  });

  const onSubmit = async (values: GuestOrderFields) => {
    try {
      const response = await createGuestOrder(
        {
          items: values.items,
          customerNote: values.customerNote?.trim() || undefined,
          guestName: values.guestName.trim(),
          guestPhone: values.guestPhone.trim(),
          guestEmail: values.guestEmail?.trim() || undefined,
          deliveryAddress: values.deliveryAddress.trim(),
        },
        { silent: true },
      );

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
  };

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
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
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
                placeholder="+7 (XXX) XXX-XX-XX"
              />
              {errors.guestPhone !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.guestPhone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('checkout.phoneFormat')}
              </p>
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

            <Button type="submit" disabled={guestIsSubmitting}>
              {guestIsSubmitting ? t('checkout.submitting') : t('checkout.submit')}
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

function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((state) => state.user);

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

  if (isAuthenticated) {
    return (
      <AuthCheckoutForm
        items={items}
        clearCart={clearCart}
        navigate={navigate}
        user={user}
        t={t}
      />
    );
  }

  return (
    <GuestCheckoutForm
      items={items}
      clearCart={clearCart}
      navigate={navigate}
      user={user}
      t={t}
    />
  );
}

export default CheckoutPage;