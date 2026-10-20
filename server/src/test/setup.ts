process.env.DATABASE_URL = ':memory:';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

process.env.JWT_SECRET = 'test-secret-key-for-testing-only-32+chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-32+chars';
process.env.MAILGUN_API_KEY = 'test-mailgun-api-key';
process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
process.env.MAILGUN_FROM = 'test@example.com';
process.env.CHEF_EMAIL = 'chef@example.com';
process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-bot-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat-id';
process.env.PUBLIC_ORIGIN = 'http://localhost:3000';
process.env.UPLOADS_DIR = './uploads';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';

const sqlite = new Database(':memory:');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const testDb = drizzle(sqlite, { schema });

sqlite.exec(`
  CREATE TABLE "users" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "email" text NOT NULL,
    "password_hash" text NOT NULL,
    "role" text DEFAULT 'customer' NOT NULL,
    "preferred_lang" text DEFAULT 'es' NOT NULL,
    "email_verified" integer DEFAULT 0 NOT NULL,
    "email_verification_token" text,
    "name" text,
    "phone" text,
    "delivery_address" text,
    "created_at" integer DEFAULT (unixepoch()) NOT NULL
  );
  CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");

  CREATE TABLE "categories" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "slug" text NOT NULL,
    "name_es" text NOT NULL,
    "name_ru" text NOT NULL,
    "name_en" text NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
  );
  CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" ("slug");

  CREATE TABLE "dishes" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "category_id" integer NOT NULL,
    "image_url" text NOT NULL,
    "price" real NOT NULL,
    "name_es" text NOT NULL,
    "name_ru" text NOT NULL,
    "name_en" text NOT NULL,
    "desc_es" text NOT NULL,
    "desc_ru" text NOT NULL,
    "desc_en" text NOT NULL,
    "ingredients_es" text NOT NULL,
    "ingredients_ru" text NOT NULL,
    "ingredients_en" text NOT NULL,
    "is_available" integer DEFAULT 1 NOT NULL,
    "created_at" integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON UPDATE no action ON DELETE no action
  );
  CREATE INDEX "dishes_category_id_idx" ON "dishes" ("category_id");

  CREATE TABLE "orders" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" integer,
    "guest_name" text,
    "guest_phone" text,
    "guest_email" text,
    "delivery_address" text,
    "tracking_token" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "total" real NOT NULL,
    "customer_note" text,
    "created_at" integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
  );
  CREATE UNIQUE INDEX "orders_tracking_token_unique" ON "orders" ("tracking_token");

  CREATE TABLE "order_items" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "order_id" integer NOT NULL,
    "dish_id" integer NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" real NOT NULL,
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON UPDATE no action ON DELETE no action,
    FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON UPDATE no action ON DELETE no action
  );

  CREATE TABLE "page_views" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" integer,
    "dish_id" integer,
    "path" text NOT NULL,
    "viewed_at" integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action,
    FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON UPDATE no action ON DELETE no action
  );

  CREATE TABLE "notification_logs" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "order_id" integer NOT NULL,
    "channel" text NOT NULL,
    "status" text NOT NULL,
    "error_message" text,
    "sent_at" integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON UPDATE no action ON DELETE no action
  );
`);

vi.mock('../db/client.js', () => ({
  db: testDb,
  sqlite,
  default: testDb,
}));

vi.mock('../logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  },
}));

vi.mock('../modules/notifications/email.service.js', () => ({
  sendOrderEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../modules/notifications/telegram.service.js', () => ({
  sendOrderTelegram: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../modules/notifications/notifications.repository.js', () => ({
  sendWithRetry: vi.fn().mockImplementation(
    async (_orderId: number, _channel: string, fn: () => Promise<void>) => fn(),
  ),
  insertNotificationLog: vi.fn(),
}));

afterEach(async () => {
  sqlite.pragma('foreign_keys = OFF');

  const tables = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'drizzle%'",
    )
    .all() as { name: string }[];

  for (const table of tables) {
    sqlite.prepare(`DELETE FROM ${table.name}`).run();
  }
  sqlite.prepare("DELETE FROM sqlite_sequence").run();

  sqlite.pragma('foreign_keys = ON');

  vi.clearAllMocks();
});
