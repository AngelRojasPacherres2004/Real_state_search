CREATE TABLE `alertNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`propertyId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`operationType` enum('alquiler','venta'),
	`propertyType` varchar(50),
	`districts` text,
	`minPrice` decimal(12,2),
	`maxPrice` decimal(12,2),
	`currency` varchar(10) DEFAULT 'USD',
	`minArea` decimal(10,2),
	`maxArea` decimal(10,2),
	`minBedrooms` int,
	`maxBedrooms` int,
	`minBathrooms` int,
	`maxBathrooms` int,
	`amenities` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastChecked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`propertyId` int,
	`interestedIn` text,
	`status` enum('nuevo','contactado','calificado','convertido','descartado') NOT NULL DEFAULT 'nuevo',
	`notes` text,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`currency` varchar(10) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`portal` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`operationType` enum('alquiler','venta') NOT NULL,
	`propertyType` varchar(50) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`area` decimal(10,2),
	`bedrooms` int,
	`bathrooms` int,
	`district` varchar(100) NOT NULL,
	`province` varchar(100),
	`department` varchar(100),
	`address` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`imageUrl` text,
	`sourceUrl` text NOT NULL,
	`amenities` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`scrapedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cacheKey` varchar(255) NOT NULL,
	`portal` varchar(50) NOT NULL,
	`results` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `searchCache_cacheKey_unique` UNIQUE(`cacheKey`)
);
--> statement-breakpoint
ALTER TABLE `alertNotifications` ADD CONSTRAINT `alertNotifications_alertId_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alertNotifications` ADD CONSTRAINT `alertNotifications_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceHistory` ADD CONSTRAINT `priceHistory_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alert_property_idx` ON `alertNotifications` (`alertId`,`propertyId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `user_property_idx` ON `favorites` (`userId`,`propertyId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `leads` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `priceHistory` (`propertyId`);--> statement-breakpoint
CREATE INDEX `portal_external_id_idx` ON `properties` (`portal`,`externalId`);--> statement-breakpoint
CREATE INDEX `district_idx` ON `properties` (`district`);--> statement-breakpoint
CREATE INDEX `operation_type_idx` ON `properties` (`operationType`);--> statement-breakpoint
CREATE INDEX `price_idx` ON `properties` (`price`);--> statement-breakpoint
CREATE INDEX `cache_key_idx` ON `searchCache` (`cacheKey`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `searchCache` (`expiresAt`);