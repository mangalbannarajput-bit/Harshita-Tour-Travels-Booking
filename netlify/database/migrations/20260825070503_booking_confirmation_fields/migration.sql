CREATE TYPE "customer_confirmation_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "customer_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "passenger_count" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "pickup_location" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "customer_confirmation" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "customer_confirmation" SET DATA TYPE "customer_confirmation_status" USING (CASE WHEN "customer_confirmation" THEN 'CONFIRMED' ELSE 'PENDING' END)::"customer_confirmation_status";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "customer_confirmation" SET DEFAULT 'PENDING'::"customer_confirmation_status";