CREATE TABLE "results" (
	"recipe" text PRIMARY KEY NOT NULL,
	"result" text,
	"n_uses" integer
);
--> statement-breakpoint
CREATE TABLE "things" (
	"emoji" text,
	"thing" text PRIMARY KEY NOT NULL,
	"vector" vector(3072)
);
