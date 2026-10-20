import { describe, it, expect } from 'vitest';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';
import bcrypt from 'bcryptjs';

import { createOrder, createGuestOrder } from '../modules/orders/orders.service.js';
import { BadRequestError } from '../shared/errors.js';
import { sendOrderEmail } from '../modules/notifications/email.service.js';
import { sendOrderTelegram } from '../modules/notifications/telegram.service.js';

const BCRYPT_ROUNDS = 10;

const createTestUser = (
  email: string,
  extra: { name?: string | null; phone?: string | null; deliveryAddress?: string | null } = {},
) => {
  const passwordHash = bcrypt.hashSync('password123', BCRYPT_ROUNDS);
  return db
    .insert(schema.users)
    .values({
      email,
      passwordHash,
      preferredLang: 'es',
      role: 'customer',
      name: extra.name ?? null,
      phone: extra.phone ?? null,
      deliveryAddress: extra.deliveryAddress ?? null,
    })
    .returning({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
    .get()!;
};

const createTestCategory = () =>
  db
    .insert(schema.categories)
    .values({
      slug: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nameEs: 'Test Category',
      nameRu: 'Тестовая категория',
      nameEn: 'Test Category',
      sortOrder: 0,
    })
    .returning({ id: schema.categories.id })
    .get()!;

const createTestDish = (
  categoryId: number,
  overrides: { price?: number; isAvailable?: number; nameEs?: string; nameRu?: string; nameEn?: string } = {},
) =>
  db
    .insert(schema.dishes)
    .values({
      categoryId,
      imageUrl: '/uploads/dishes/test.jpg',
      price: overrides.price ?? 10.5,
      nameEs: overrides.nameEs ?? 'Test Dish',
      nameRu: overrides.nameRu ?? 'Тестовое блюдо',
      nameEn: overrides.nameEn ?? 'Test Dish',
      descEs: 'Descripción de prueba',
      descRu: 'Тестовое описание',
      descEn: 'Test description',
      ingredientsEs: 'Ingredientes de prueba',
      ingredientsRu: 'Тестовые ингредиенты',
      ingredientsEn: 'Test ingredients',
      isAvailable: overrides.isAvailable ?? 1,
    })
    .returning({ id: schema.dishes.id, price: schema.dishes.price })
    .get()!;

describe('orders.service', () => {
  describe('createOrder (usuarios autenticados)', () => {
    it('crea un pedido correctamente con userId, total calculado y datos del perfil', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { price: 15.5 });
      const user = createTestUser('auth@example.com', {
        name: 'Juan Pérez',
        phone: '+7 (999) 123-45-67',
        deliveryAddress: 'ul. Tverskaya 10, Moscow',
      });

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 2 }] },
        'es',
        'auth@example.com',
      );

      expect(result.language).toBe('es');
      expect(result.order.userId).toBe(user.id);
      expect(result.order.status).toBe('pending');
      expect(result.order.total).toBe(31);
      expect(result.order.guestName).toBe('Juan Pérez');
      expect(result.order.guestPhone).toBe('+7 (999) 123-45-67');
      expect(result.order.guestEmail).toBe('auth@example.com');
      expect(result.order.deliveryAddress).toBe('ul. Tverskaya 10, Moscow');
      expect(result.order.items).toHaveLength(1);
      expect(result.order.items[0]!.dishId).toBe(dish.id);
      expect(result.order.items[0]!.quantity).toBe(2);
      expect(result.order.items[0]!.unitPrice).toBe(15.5);
      expect(result.order.customerNote).toBeNull();
      expect(result.order.createdAt).toBeGreaterThan(0);
      expect(result.order.trackingToken).toBeNull();
      expect(result.order.items[0]!.name).toBe('Test Dish');

      expect(sendOrderEmail).toHaveBeenCalledTimes(1);
      expect(sendOrderTelegram).toHaveBeenCalledTimes(1);
    });

    it('lanza BadRequestError (DISH_UNAVAILABLE) cuando un plato no está disponible', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { isAvailable: 0 });
      const user = createTestUser('unavailable@example.com');

      expect(() =>
        createOrder(
          user.id,
          { items: [{ dishId: dish.id, quantity: 1 }] },
          'es',
          'unavailable@example.com',
        ),
      ).toThrow(BadRequestError);
      expect(() =>
        createOrder(
          user.id,
          { items: [{ dishId: dish.id, quantity: 1 }] },
          'es',
          'unavailable@example.com',
        ),
      ).toThrow(/Uno o varios platos ya no estan disponibles/);
    });

    it('lanza BadRequestError (DISH_UNAVAILABLE) para un plato inexistente', () => {
      const user = createTestUser('nonexistent@example.com');

      expect(() =>
        createOrder(
          user.id,
          { items: [{ dishId: 99999, quantity: 1 }] },
          'es',
          'nonexistent@example.com',
        ),
      ).toThrow(BadRequestError);
    });

    it('calcula correctamente el total redondeado a céntimos', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { price: 11.9 });
      const user = createTestUser('rounding@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 3 }] },
        'es',
        'rounding@example.com',
      );

      expect(result.order.total).toBe(35.7);
      expect(Math.round(result.order.total * 100)).toBe(3570);
    });

    it('usa el perfil del usuario (perfil vacío) cuando el usuario no tiene datos', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { price: 10 });
      const user = createTestUser('noprofile@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }] },
        'es',
        'noprofile@example.com',
      );

      expect(result.order.guestName).toBeNull();
      expect(result.order.guestPhone).toBeNull();
      expect(result.order.guestEmail).toBe('noprofile@example.com');
      expect(result.order.deliveryAddress).toBeNull();
    });

    it('guarda la nota del cliente', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { price: 10 });
      const user = createTestUser('note@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }], customerNote: 'Sin cebolla por favor' },
        'es',
        'note@example.com',
      );

      expect(result.order.customerNote).toBe('Sin cebolla por favor');
    });

    it('convierte nota vacía a NULL', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { price: 10 });
      const user = createTestUser('empty-note@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }], customerNote: '' },
        'es',
        'empty-note@example.com',
      );

      expect(result.order.customerNote).toBeNull();
    });
  });

  describe('createGuestOrder (usuarios invitados)', () => {
    it('crea un pedido de invitado con userId null y trackingToken', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { price: 25 });

      const result = createGuestOrder(
        {
          items: [{ dishId: dish.id, quantity: 1 }],
          guestName: 'María Gómez',
          guestPhone: '+7 (495) 555-00-00',
          guestEmail: 'maria@example.com',
          deliveryAddress: 'ul. Arbat 5, Moscow',
        },
        'es',
      );

      expect(result.order.userId).toBeNull();
      expect(result.order.status).toBe('pending');
      expect(result.order.total).toBe(25);
      expect(result.order.guestName).toBe('María Gómez');
      expect(result.order.guestPhone).toBe('+7 (495) 555-00-00');
      expect(result.order.guestEmail).toBe('maria@example.com');
      expect(result.order.deliveryAddress).toBe('ul. Arbat 5, Moscow');
      expect(result.order.trackingToken).toBeDefined();
      expect(result.order.trackingToken!.length).toBeGreaterThan(0);
      expect(result.order.items).toHaveLength(1);
    });

    it('lanza BadRequestError (DISH_UNAVAILABLE) para platos inexistentes', () => {
      expect(() =>
        createGuestOrder(
          {
            items: [{ dishId: 99999, quantity: 1 }],
            guestName: 'Test Guest',
            guestPhone: '12345',
            guestEmail: 'guest@example.com',
            deliveryAddress: 'Test address 12345',
          },
          'es',
        ),
      ).toThrow(BadRequestError);
    });
  });

  describe('transaccionalidad', () => {
    it('el pedido y sus items se crean en una sola transacción', () => {
      const category = createTestCategory();
      const dish1 = createTestDish(category.id, { price: 10 });
      const dish2 = createTestDish(category.id, { price: 20 });
      const user = createTestUser('transaction@example.com');

      const result = createOrder(
        user.id,
        {
          items: [
            { dishId: dish1.id, quantity: 1 },
            { dishId: dish2.id, quantity: 2 },
          ],
        },
        'es',
        'transaction@example.com',
      );

      expect(result.order.items).toHaveLength(2);
      expect(result.order.total).toBe(50);

      const orderItems = db.select().from(schema.orderItems).all();
      expect(orderItems).toHaveLength(2);
      expect(orderItems.every((item) => item.orderId === result.order.id)).toBe(true);
    });
  });

  describe('localization', () => {
    it('localiza los nombres de los platos según Accept-Language (ru)', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
      });
      const user = createTestUser('lang-ru@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }] },
        'ru',
        'lang-ru@example.com',
      );

      expect(result.language).toBe('ru');
      expect(result.order.items[0]!.name).toBe('Борщ');
    });

    it('localiza los nombres de los platos según Accept-Language (en)', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
      });
      const user = createTestUser('lang-en@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }] },
        'en',
        'lang-en@example.com',
      );

      expect(result.language).toBe('en');
      expect(result.order.items[0]!.name).toBe('Borsch');
    });

    it('resuelve idioma del header Accept-Language', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
      });
      const user = createTestUser('lang-header@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }] },
        'en;q=1.0, ru;q=0.5, es;q=0.1',
        'lang-header@example.com',
      );

      expect(result.language).toBe('en');
      expect(result.order.items[0]!.name).toBe('Borsch');
    });

    it('usa idioma por defecto (es) cuando Accept-Language es undefined', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
      });
      const user = createTestUser('lang-default@example.com');

      const result = createOrder(
        user.id,
        { items: [{ dishId: dish.id, quantity: 1 }] },
        undefined,
        'lang-default@example.com',
      );

      expect(result.language).toBe('es');
      expect(result.order.items[0]!.name).toBe('Borsch');
    });
  });
});
