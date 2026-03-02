CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`operationType` enum('alquiler','venta') NOT NULL,
	`districts` text,
	`portals` text,
	`minPrice` varchar(20),
	`maxPrice` varchar(20),
	`minBedrooms` varchar(10),
	`maxBedrooms` varchar(10),
	`minArea` varchar(20),
	`maxArea` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operationType` enum('alquiler','venta') NOT NULL,
	`districts` text,
	`portals` text,
	`minPrice` varchar(20),
	`maxPrice` varchar(20),
	`minBedrooms` varchar(10),
	`maxBedrooms` varchar(10),
	`minArea` varchar(20),
	`maxArea` varchar(20),
	`resultsCount` int DEFAULT 0,
	`searchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
