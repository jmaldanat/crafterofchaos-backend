PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`price` real NOT NULL,
	`asin` text NOT NULL,
	`code` text NOT NULL,
	`created` text DEFAULT (datetime('now')),
	`modified` text DEFAULT (datetime('now')),
	`category_id` integer,
	`disponible` integer DEFAULT true NOT NULL,
	`habilitado` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "title", "price", "asin", "code", "created", "modified", "category_id", "disponible", "habilitado") SELECT "id", "title", "price", "asin", "code", "created", "modified", "category_id", "disponible", "habilitado" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);