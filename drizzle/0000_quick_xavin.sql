CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`host_hash` text NOT NULL,
	`guest_hash` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
