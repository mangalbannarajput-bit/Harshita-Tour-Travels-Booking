CREATE TYPE "booking_status" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID');--> statement-breakpoint
CREATE TABLE "bookings" (
	"booking_id" serial PRIMARY KEY,
	"tour_id" text NOT NULL UNIQUE,
	"customer_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_mobile" text NOT NULL,
	"passenger_count" integer NOT NULL,
	"journey_date" date NOT NULL,
	"destination" text NOT NULL,
	"pickup_location" text NOT NULL,
	"reporting_time" time,
	"vehicle" text,
	"driver_name" text,
	"driver_mobile" text,
	"total_fare" numeric(10,2) NOT NULL,
	"advance_paid" numeric(10,2) DEFAULT '0' NOT NULL,
	"remaining_amount" numeric(10,2) DEFAULT '0' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING'::"payment_status" NOT NULL,
	"booking_status" "booking_status" DEFAULT 'PENDING'::"booking_status" NOT NULL,
	"customer_confirmation" boolean DEFAULT false NOT NULL,
	"booking_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"customer_id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"mobile" text NOT NULL,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"ledger_id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"description" text NOT NULL,
	"debit" numeric(10,2) DEFAULT '0' NOT NULL,
	"credit" numeric(10,2) DEFAULT '0' NOT NULL,
	"balance" numeric(10,2) NOT NULL,
	"entry_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"payment_id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_method" text,
	"transaction_reference" text,
	"payment_status" "payment_status" DEFAULT 'PAID'::"payment_status" NOT NULL,
	"receipt_number" text UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bookings_customer_id_idx" ON "bookings" ("customer_id");--> statement-breakpoint
CREATE INDEX "bookings_booking_status_idx" ON "bookings" ("booking_status");--> statement-breakpoint
CREATE INDEX "bookings_payment_status_idx" ON "bookings" ("payment_status");--> statement-breakpoint
CREATE INDEX "bookings_journey_date_idx" ON "bookings" ("journey_date");--> statement-breakpoint
CREATE INDEX "bookings_customer_mobile_idx" ON "bookings" ("customer_mobile");--> statement-breakpoint
CREATE INDEX "customers_mobile_idx" ON "customers" ("mobile");--> statement-breakpoint
CREATE INDEX "ledger_booking_id_idx" ON "ledger" ("booking_id");--> statement-breakpoint
CREATE INDEX "ledger_customer_id_idx" ON "ledger" ("customer_id");--> statement-breakpoint
CREATE INDEX "ledger_entry_date_idx" ON "ledger" ("entry_date");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" ("payment_date");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id");--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_booking_id_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id");--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_customer_id_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id");