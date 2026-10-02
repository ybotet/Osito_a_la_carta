import { asc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { categories } from '../../db/schema.js';

/**
 * Trae todas las categorías del menú. El orden es `sort_order` y después `id`: el
 * primero es el que define el admin con `sortOrder` y el segundo solo desempata, para
 * que el resultado sea estable y reproducible.
 *
 * **No hay filtro de disponibilidad**: `categories` no tiene columna `is_available`
 * (solo la tiene `dishes`), y SPEC §6 define `Category` con `id`, `slug`, los tres
 * nombres y `sortOrder`. Ocultar una categoría del menú, si alguna vez hace falta, es
 * una columna nueva en una migración nueva.
 */
const findAllCategories = () =>
  db
    .select({
      id: categories.id,
      slug: categories.slug,
      nameEs: categories.nameEs,
      nameRu: categories.nameRu,
      nameEn: categories.nameEn,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all();

export { findAllCategories };

export type CategoryRow = ReturnType<typeof findAllCategories>[number];
