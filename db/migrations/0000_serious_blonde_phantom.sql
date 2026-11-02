CREATE TABLE `company_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`public_id` varchar(36) NOT NULL,
	`company_name` varchar(100) NOT NULL,
	`contact_name` varchar(60) NOT NULL,
	`industry` varchar(80) NOT NULL,
	`city` varchar(80) NOT NULL,
	`services` text NOT NULL,
	`service_area` varchar(160) NOT NULL,
	`tone` enum('Rak','Varm','Lugn') NOT NULL,
	`urgent_instructions` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_profiles_public_id_unique` UNIQUE(`public_id`)
);
