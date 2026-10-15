PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`guest_name` text,
	`guest_phone` text,
	`guest_email` text,
	`delivery_address` text,
	`tracking_token` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`total` real NOT NULL,
	`customer_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "user_id", "guest_name", "guest_phone", "guest_email", "delivery_address", "tracking_token", "status", "total", "customer_note", "created_at") SELECT "id", "user_id", "guest_name", "guest_phone", "guest_email", "delivery_address", "tracking_token", "status", "total", "customer_note", "created_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_tracking_token_unique` ON `orders` (`tracking_token`);