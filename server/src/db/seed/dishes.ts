import { logger } from '../../logger.js';
import { db, sqlite } from '../client.js';
import { categories, dishes } from '../schema.js';
import type { NewCategory, NewDish } from '../schema.js';

const IMAGE_BASE_URL = 'https://placehold.co/600x400';

const SEED_CATEGORIES: NewCategory[] = [
  {
    slug: 'sopas',
    nameEs: 'Sopas y caldos',
    nameRu: 'Супы и бульоны',
    nameEn: 'Soups and broths',
    sortOrder: 1,
  },
  {
    slug: 'pastas',
    nameEs: 'Pastas y arroces',
    nameRu: 'Паста и рис',
    nameEn: 'Pasta and rice',
    sortOrder: 2,
  },
  {
    slug: 'ensaladas',
    nameEs: 'Ensaladas',
    nameRu: 'Салаты',
    nameEn: 'Salads',
    sortOrder: 3,
  },
  {
    slug: 'postres',
    nameEs: 'Postres',
    nameRu: 'Десерты',
    nameEn: 'Desserts',
    sortOrder: 4,
  },
  {
    slug: 'bebidas',
    nameEs: 'Bebidas',
    nameRu: 'Напитки',
    nameEn: 'Drinks',
    sortOrder: 5,
  },
];

type SeedDish = Omit<NewDish, 'categoryId'> & { categorySlug: string };

const SEED_DISHES: SeedDish[] = [
  {
    categorySlug: 'sopas',
    imageUrl: `${IMAGE_BASE_URL}/F5E6C8/5B4632?text=Soup`,
    price: 6.5,
    nameEs: 'Sopa de verduras',
    nameRu: 'Овощной суп',
    nameEn: 'Vegetable soup',
    descEs:
      'Caldo casero con zanahoria, patata, cebolla y apio, cocido a fuego lento.',
    descRu:
      'Домашний бульон с морковью, картофелем, луком и сельдереем, сваренный на медленном огне.',
    descEn:
      'Homemade broth with carrot, potato, onion and celery, slowly simmered.',
    ingredientsEs: 'zanahoria, patata, cebolla, apio, laurel, sal',
    ingredientsRu: 'морковь, картофель, лук, сельдерей, лавровый лист, соль',
    ingredientsEn: 'carrot, potato, onion, celery, bay leaf, salt',
    isAvailable: 1,
  },
  {
    categorySlug: 'pastas',
    imageUrl: `${IMAGE_BASE_URL}/FADBD8/922B21?text=Pasta`,
    price: 11.9,
    nameEs: 'Pasta al tomate',
    nameRu: 'Паста с томатами',
    nameEn: 'Tomato pasta',
    descEs: 'Espaguetis con salsa de tomate casera, ajo fresco y albahaca.',
    descRu: 'Спагетти с домашним томатным соусом, свежим чесноком и базиликом.',
    descEn: 'Spaghetti with homemade tomato sauce, fresh garlic and basil.',
    ingredientsEs: 'espaguetis, tomate, ajo, albahaca, aceite de oliva, sal',
    ingredientsRu: 'спагетти, томаты, чеснок, базилик, оливковое масло, соль',
    ingredientsEn: 'spaghetti, tomato, garlic, basil, olive oil, salt',
    isAvailable: 1,
  },
  {
    categorySlug: 'ensaladas',
    imageUrl: `${IMAGE_BASE_URL}/D5F5E3/196F3D?text=Salad`,
    price: 8.75,
    nameEs: 'Ensalada rusa',
    nameRu: 'Оливье',
    nameEn: 'Russian salad',
    descEs:
      'Ensalada clásica de patata, zanahoria, huevo y guisante con mayonesa suave.',
    descRu:
      'Классический салат с картофелем, морковью, яйцом и зелёным горошком с мягким майонезом.',
    descEn:
      'Classic salad with potato, carrot, egg and peas with soft mayonnaise.',
    ingredientsEs: 'patata, zanahoria, huevo, guisante, mayonesa, pickles',
    ingredientsRu:
      'картофель, морковь, яйцо, зелёный горошек, майонез, солёные огурцы',
    ingredientsEn: 'potato, carrot, egg, peas, mayonnaise, pickles',
    isAvailable: 1,
  },
  {
    categorySlug: 'postres',
    imageUrl: `${IMAGE_BASE_URL}/FDEBD0/784212?text=Pie`,
    price: 14.2,
    nameEs: 'Tarta de manzana',
    nameRu: 'Яблочный пирог',
    nameEn: 'Apple pie',
    descEs: 'Masa quebrada rellena de manzana caramelizada y canela, horneada.',
    descRu:
      'Песочное тесто с карамелизированными яблоками и корицей, запечённое в духовке.',
    descEn:
      'Shortcrust pastry filled with caramelised apple and cinnamon, baked.',
    ingredientsEs: 'harina, mantequilla, manzana, azúcar, canela',
    ingredientsRu: 'мука, сливочное масло, яблоко, сахар, корица',
    ingredientsEn: 'flour, butter, apple, sugar, cinnamon',
    isAvailable: 1,
  },
  {
    categorySlug: 'bebidas',
    imageUrl: `${IMAGE_BASE_URL}/D6EAF8/1A5276?text=Compote`,
    price: 5.25,
    nameEs: 'Compota de fruta',
    nameRu: 'Фруктовый компот',
    nameEn: 'Fruit compote',
    descEs: 'Compota casera de manzana y canela, servida fría o caliente.',
    descRu:
      'Домашний компот из яблок с корицей, подаётся холодным или горячим.',
    descEn: 'Homemade apple compote with cinnamon, served cold or hot.',
    ingredientsEs: 'manzana, canela, azúcar, agua',
    ingredientsRu: 'яблоко, корица, сахар, вода',
    ingredientsEn: 'apple, cinnamon, sugar, water',
    isAvailable: 1,
  },
];

const seedDishes = (): void => {
  db.transaction((tx) => {
    tx.delete(dishes).run();
    tx.delete(categories).run();

    tx.insert(categories).values(SEED_CATEGORIES).run();

    const categoryIds = new Map(
      tx
        .select()
        .from(categories)
        .all()
        .map((row) => [row.slug, row.id]),
    );

    const rows = SEED_DISHES.map(({ categorySlug, ...dish }) => {
      const categoryId = categoryIds.get(categorySlug);

      if (categoryId === undefined) {
        throw new Error(`Categoria desconocida en el seed: ${categorySlug}`);
      }

      return { ...dish, categoryId };
    });

    tx.insert(dishes).values(rows).run();
  });

  const inserted = db.select().from(dishes).all();
  logger.info(
    { count: inserted.length, names: inserted.map((dish) => dish.nameEs) },
    'Seed de platos completado',
  );
};

seedDishes();

sqlite.close();
