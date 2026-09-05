CREATE TABLE `registry_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_json` text NOT NULL,
	`published_json` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registry_events` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`revision` integer NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`note` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `registry_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_entry_revision` ON `registry_events` (`entry_id`,`revision`);--> statement-breakpoint
CREATE TABLE `registry_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
