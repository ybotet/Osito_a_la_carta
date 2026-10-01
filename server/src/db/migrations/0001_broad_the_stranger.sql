-- Migracion 0001: anade la tabla `categories` y `dishes.category_id`.
--
-- SQLite no permite `ALTER TABLE dishes ADD category_id integer NOT NULL
-- REFERENCES categories(id)` sobre una tabla que ya tiene filas: falla con
-- "Cannot add a NOT NULL column with default value NULL", y tampoco acepta la
-- variante con default no nulo si la columna lleva REFERENCES
-- ("Cannot add a REFERENCES column with non-NULL default value").
--
-- Por eso esta migracion sigue el procedimiento oficial de SQLite para modificar
-- una tabla: crear una tabla nueva con el esquema definitivo, copiar los datos,
-- borrar la vieja y renombrar. Se hace dentro de una transaccion y con
-- `PRAGMA foreign_keys = OFF`, porque durante la ventana en la que `dishes` esta
-- borrada las FKs de `order_items` y `page_views` quedarian colgando.
--
-- `PRAGMA foreign_keys` es un no-op dentro de una transaccion, asi que se activa
-- explicitamente antes y despues. Si este archivo se aplica dentro de una
-- transaccion gestionada por drizzle-kit, el PRAGMA inicial se ignora, pero la
-- migracion sigue siendo correcta porque `PRAGMA foreign_keys = OFF` se emite
-- como sentencia propia antes de la transaccion util.

PRAGMA foreign_keys = OFF;
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_es` text NOT NULL,
	`name_ru` text NOT NULL,
	`name_en` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
-- Categoria de reserva para los platos que ya existieran antes de esta
-- migracion: no hay forma de saber a cual pertenece cada uno. `npm run db:seed`
-- los vuelve a crear con su categoria correcta.
INSERT INTO `categories` (`slug`, `name_es`, `name_ru`, `name_en`, `sort_order`) VALUES ('sin-categoria', 'Sin categoría', 'Без категории', 'Uncategorized', 999);
--> statement-breakpoint
CREATE TABLE `__dishes_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`image_url` text NOT NULL,
	`price` real NOT NULL,
	`name_es` text NOT NULL,
	`name_ru` text NOT NULL,
	`name_en` text NOT NULL,
	`desc_es` text NOT NULL,
	`desc_ru` text NOT NULL,
	`desc_en` text NOT NULL,
	`ingredients_es` text NOT NULL,
	`ingredients_ru` text NOT NULL,
	`ingredients_en` text NOT NULL,
	`is_available` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__dishes_new` (`id`, `category_id`, `image_url`, `price`, `name_es`, `name_ru`, `name_en`, `desc_es`, `desc_ru`, `desc_en`, `ingredients_es`, `ingredients_ru`, `ingredients_en`, `is_available`, `created_at`)
	SELECT `id`, (SELECT `id` FROM `categories` WHERE `slug` = 'sin-categoria'), `image_url`, `price`, `name_es`, `name_ru`, `name_en`, `desc_es`, `desc_ru`, `desc_en`, `ingredients_es`, `ingredients_ru`, `ingredients_en`, `is_available`, `created_at`
	FROM `dishes`;
--> statement-breakpoint
DROP TABLE `dishes`;
--> statement-breakpoint
ALTER TABLE `__dishes_new` RENAME TO `dishes`;
--> statement-breakpoint
PRAGMA foreign_keys = ON;