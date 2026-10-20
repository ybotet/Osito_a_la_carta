import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';

import { listDishes, getDish, createDish } from '../modules/dishes/dishes.service.js';
import { BadRequestError, NotFoundError } from '../shared/errors.js';

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

const createTestDish = (categoryId: number, overrides: Partial<Record<string, unknown>> = {}) =>
  db
    .insert(schema.dishes)
    .values({
      categoryId,
      imageUrl: '/uploads/dishes/test.jpg',
      price: 10.5,
      nameEs: 'Borsch',
      nameRu: 'Борщ',
      nameEn: 'Borsch',
      descEs: 'Descripción de prueba',
      descRu: 'Тестовое описание',
      descEn: 'Test description',
      ingredientsEs: 'Ingredientes de prueba',
      ingredientsRu: 'Тестовые ингредиенты',
      ingredientsEn: 'Test ingredients',
      isAvailable: 1,
      ...overrides,
    })
    .returning({ id: schema.dishes.id })
    .get()!;

describe('dishes.service', () => {
  describe('listDishes', () => {
    it('devuelve platos localizados en español por defecto', () => {
      const category = createTestCategory();
      createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
        descEs: 'Sopa tradicional rusa',
        descRu: 'Традиционный русский суп',
        descEn: 'Traditional Russian soup',
        ingredientsEs: 'Carne y verduras',
        ingredientsRu: 'Мясо и овощи',
        ingredientsEn: 'Meat and vegetables',
      });

      const result = listDishes(undefined);

      expect(result.language).toBe('es');
      expect(result.dishes).toHaveLength(1);
      expect(result.dishes[0]!.name).toBe('Borsch');
      expect(result.dishes[0]!.description).toBe('Sopa tradicional rusa');
      expect(result.dishes[0]!.ingredients).toBe('Carne y verduras');
      expect(result.dishes[0]!.category.name).toBe('Test Category');
    });

    it('localiza platos al idioma ruso con Accept-Language: ru', () => {
      const category = createTestCategory();
      createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
        descEs: 'Sopa tradicional rusa',
        descRu: 'Традиционный русский суп',
        descEn: 'Traditional Russian soup',
      });

      const result = listDishes('ru');

      expect(result.language).toBe('ru');
      expect(result.dishes[0]!.name).toBe('Борщ');
      expect(result.dishes[0]!.description).toBe('Традиционный русский суп');
    });

    it('localiza platos al idioma inglés con Accept-Language: en', () => {
      const category = createTestCategory();
      createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
      });

      const result = listDishes('en');

      expect(result.language).toBe('en');
      expect(result.dishes[0]!.name).toBe('Borsch');
    });

    it('resuelve el primer idioma soportado del header Accept-Language', () => {
      const category = createTestCategory();
      createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
      });

      const result = listDishes('en;q=1.0, ru;q=0.5, es;q=0.1');

      expect(result.language).toBe('en');
      expect(result.dishes[0]!.name).toBe('Borsch');
    });

    it('solo muestra platos disponibles (isAvailable=1)', () => {
      const category = createTestCategory();
      createTestDish(category.id, { isAvailable: 0 });

      const result = listDishes('es');

      expect(result.dishes).toHaveLength(0);
    });

    it('ordena platos por sortOrder de categoría y luego por id ascendente', () => {
      const cat1 = createTestCategory();
      const cat2 = createTestCategory();
      db.update(schema.categories)
        .set({ sortOrder: 1 })
        .where(eq(schema.categories.id, cat2.id))
        .run();

      createTestDish(cat1.id, { nameEs: 'Dish 1' });
      createTestDish(cat2.id, { nameEs: 'Dish 2' });

      const result = listDishes('es');

      expect(result.dishes).toHaveLength(2);
      expect(result.dishes[0]!.category.id).toBe(cat1.id);
    });
  });

  describe('getDish', () => {
    it('devuelve un plato disponible localizado al idioma solicitado', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, {
        nameEs: 'Borsch',
        nameRu: 'Борщ',
        nameEn: 'Borsch',
        price: 12.5,
      });

      const result = getDish(dish.id, 'ru');

      expect(result.language).toBe('ru');
      expect(result.dish.id).toBe(dish.id);
      expect(result.dish.name).toBe('Борщ');
      expect(result.dish.price).toBe(12.5);
      expect(result.dish.imageUrl).toMatch(/^https?:\/\//);
      expect(result.dish.category.id).toBe(category.id);
    });

    it('lanza NotFoundError para un plato inexistente', () => {
      expect(() => getDish(99999, 'es')).toThrow(NotFoundError);
      try {
        getDish(99999, 'es');
        expect.fail('Debería haber lanzado NotFoundError');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundError);
        expect((e as { code: string }).code).toBe('DISH_NOT_FOUND');
      }
    });

    it('lanza NotFoundError para un plato deshabilitado', () => {
      const category = createTestCategory();
      const dish = createTestDish(category.id, { isAvailable: 0 });

      expect(() => getDish(dish.id, 'es')).toThrow(NotFoundError);
    });
  });

  describe('createDish', () => {
    it('crea un plato y devuelve la proyección localizada', () => {
      const category = createTestCategory();

      const result = createDish(
        {
          categoryId: category.id,
          imageUrl: '/uploads/dishes/new-dish.jpg',
          price: 25.0,
          nameEs: 'Paella',
          nameRu: 'Паэлья',
          nameEn: 'Paella',
          descEs: 'Arroz con marisco',
          descRu: 'Рис с морепродуктами',
          descEn: 'Rice with seafood',
          ingredientsEs: 'Arroz, marisco, azafrán',
          ingredientsRu: 'Рис, морепродукты, шафран',
          ingredientsEn: 'Rice, seafood, saffron',
        },
        'es',
      );

      expect(result.language).toBe('es');
      expect(result.dish.id).toBeGreaterThan(0);
      expect(result.dish.name).toBe('Paella');
      expect(result.dish.price).toBe(25.0);
      expect(result.dish.category.id).toBe(category.id);
    });

    it('lanza BadRequestError (CATEGORY_NOT_FOUND) para una categoría inexistente', () => {
      expect(() =>
        createDish(
          {
            categoryId: 99999,
            imageUrl: '/uploads/dishes/test.jpg',
            price: 10,
            nameEs: 'Test',
            nameRu: 'Тест',
            nameEn: 'Test',
            descEs: 'Test',
            descRu: 'Тест',
            descEn: 'Test',
            ingredientsEs: 'Test',
            ingredientsRu: 'Тест',
            ingredientsEn: 'Test',
          },
          'es',
        ),
      ).toThrow(BadRequestError);
    });
  });

  describe('localization via Accept-Language', () => {
    it('resuelve Accept-Language: ru-RU,ru;q=0.9,en;q=0.8 al idioma "ru"', () => {
      const category = createTestCategory();
      createTestDish(category.id);

      const result = listDishes('ru-RU,ru;q=0.9,en;q=0.8');

      expect(result.language).toBe('ru');
    });

    it('resuelve Accept-Language: * al idioma por defecto (es)', () => {
      const category = createTestCategory();
      createTestDish(category.id);

      const result = listDishes('*/*');

      expect(result.language).toBe('es');
    });

    it('ignora q=0 (idioma no deseado) y usa el siguiente disponible', () => {
      const category = createTestCategory();
      createTestDish(category.id);

      const result = listDishes('ru;q=0, en;q=1');

      expect(result.language).toBe('en');
    });
  });
});
