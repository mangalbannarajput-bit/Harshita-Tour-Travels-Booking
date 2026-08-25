import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  time,
  index,
} from "drizzle-orm/pg-core";
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PARTIAL",
  "PAID",
]);

export const customerConfirmationStatusEnum = pgEnum("customer_confirmation_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
]);

export const customers = pgTable(
  "customers",
  {
    customerId: serial("customer_id").primaryKey(),
    name: text("name").notNull(),
    mobile: text("mobile").notNull(),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customers_mobile_idx").on(table.mobile)],
);

export const bookings = pgTable(
  "bookings",
  {
    bookingId: serial("booking_id").primaryKey(),
    tourId: text("tour_id").notNull().unique(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.customerId),
    customerName: text("customer_name").notNull(),
    customerMobile: text("customer_mobile").notNull(),
    passengerCount: integer("passenger_count").notNull().default(1),
    journeyDate: date("journey_date").notNull(),
    destination: text("destination").notNull(),
    pickupLocation: text("pickup_location"),
    reportingTime: time("reporting_time"),
    vehicle: text("vehicle"),
    driverName: text("driver_name"),
    driverMobile: text("driver_mobile"),
    notes: text("notes"),
    totalFare: numeric("total_fare", { precision: 10, scale: 2 }).notNull(),
    advancePaid: numeric("advance_paid", { precision: 10, scale: 2 }).notNull().default("0"),
    remainingAmount: numeric("remaining_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    bookingStatus: bookingStatusEnum("booking_status").notNull().default("PENDING"),
    customerConfirmation: customerConfirmationStatusEnum("customer_confirmation").notNull().default("PENDING"),
    customerConfirmedAt: timestamp("customer_confirmed_at", { withTimezone: true }),
    bookingCreatedAt: timestamp("booking_created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bookings_customer_id_idx").on(table.customerId),
    index("bookings_booking_status_idx").on(table.bookingStatus),
    index("bookings_payment_status_idx").on(table.paymentStatus),
    index("bookings_journey_date_idx").on(table.journeyDate),
    index("bookings_customer_mobile_idx").on(table.customerMobile),
  ],
);

export const payments = pgTable(
  "payments",
  {
    paymentId: serial("payment_id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.bookingId),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull().defaultNow(),
    paymentMethod: text("payment_method"),
    transactionReference: text("transaction_reference"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PAID"),
    receiptNumber: text("receipt_number").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_booking_id_idx").on(table.bookingId),
    index("payments_payment_date_idx").on(table.paymentDate),
  ],
);

export const ledger = pgTable(
  "ledger",
  {
    ledgerId: serial("ledger_id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.bookingId),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.customerId),
    description: text("description").notNull(),
    debit: numeric("debit", { precision: 10, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 10, scale: 2 }).notNull().default("0"),
    balance: numeric("balance", { precision: 10, scale: 2 }).notNull(),
    entryDate: timestamp("entry_date", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ledger_booking_id_idx").on(table.bookingId),
    index("ledger_customer_id_idx").on(table.customerId),
    index("ledger_entry_date_idx").on(table.entryDate),
  ],
);
