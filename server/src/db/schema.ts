import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['customer', 'admin'] })
    .notNull()
    .default('customer'),
  preferredLang: text('preferred_lang', { enum: ['es', 'ru', 'en'] })
    .notNull()
    .default('es'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const dishes = sqliteTable('dishes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageUrl: text('image_url').notNull(),
  price: real('price').notNull(),

  nameEs: text('name_es').notNull(),
  nameRu: text('name_ru').notNull(),
  nameEn: text('name_en').notNull(),

  descEs: text('desc_es').notNull(),
  descRu: text('desc_ru').notNull(),
  descEn: text('desc_en').notNull(),

  ingredientsEs: text('ingredients_es').notNull(),
  ingredientsRu: text('ingredients_ru').notNull(),
  ingredientsEn: text('ingredients_en').notNull(),

  isAvailable: integer('is_available').notNull().default(1),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status', {
    enum: ['pending', 'preparing', 'sent', 'delivered', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  total: real('total').notNull(),
  customerNote: text('customer_note'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  dishId: integer('dish_id')
    .notNull()
    .references(() => dishes.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
});

export const pageViews = sqliteTable('page_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  dishId: integer('dish_id').references(() => dishes.id),
  path: text('path').notNull(),
  viewedAt: integer('viewed_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const notificationLogs = sqliteTable('notification_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  channel: text('channel', { enum: ['email', 'telegram'] }).notNull(),
  status: text('status', { enum: ['sent', 'failed'] }).notNull(),
  errorMessage: text('error_message'),
  sentAt: integer('sent_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Dish = typeof dishes.$inferSelect;
export type NewDish = typeof dishes.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;

export type UserRole = (typeof users.$inferSelect)['role'];
export type PreferredLang = (typeof users.$inferSelect)['preferredLang'];
export type OrderStatus = (typeof orders.$inferSelect)['status'];
export type NotificationChannel =
  (typeof notificationLogs.$inferSelect)['channel'];
export type NotificationStatus =
  (typeof notificationLogs.$inferSelect)['status'];
