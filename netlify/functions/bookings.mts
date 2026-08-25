import type { Config, Context } from "@netlify/functions";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "../../db/index.js";
import { bookings, customers } from "../../db/schema.js";

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function computePaymentStatus(totalFare: number, advancePaid: number): "PENDING" | "PARTIAL" | "PAID" {
  const remaining = Math.max(totalFare - advancePaid, 0);
  if (advancePaid <= 0) return "PENDING";
  if (remaining <= 0) return "PAID";
  return "PARTIAL";
}

async function generateUniqueTourId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `HTT-${year}-`;

  const existingForYear = await db
    .select({ tourId: bookings.tourId })
    .from(bookings)
    .where(like(bookings.tourId, `${prefix}%`));

  let nextNumber = existingForYear.length + 1;

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${prefix}${String(nextNumber).padStart(3, "0")}`;
    const clash = await db
      .select({ bookingId: bookings.bookingId })
      .from(bookings)
      .where(eq(bookings.tourId, candidate))
      .limit(1);

    if (clash.length === 0) return candidate;
    nextNumber += 1;
  }

  throw new Error("Could not generate a unique tour ID");
}

async function findOrCreateCustomer(name: string, mobile: string): Promise<number> {
  const existing = await db
    .select({ customerId: customers.customerId })
    .from(customers)
    .where(eq(customers.mobile, mobile))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(customers)
      .set({ name, updatedAt: new Date() })
      .where(eq(customers.customerId, existing[0].customerId));
    return existing[0].customerId;
  }

  const [created] = await db
    .insert(customers)
    .values({ name, mobile })
    .returning({ customerId: customers.customerId });

  return created.customerId;
}

function serializeBooking(row: typeof bookings.$inferSelect) {
  const totalFare = toNumber(row.totalFare);
  const advancePaid = toNumber(row.advancePaid);
  const remaining = toNumber(row.remainingAmount);

  return {
    bookingId: row.bookingId,
    tourId: row.tourId,
    passengerName: row.customerName,
    mobile: row.customerMobile,
    journeyDate: row.journeyDate,
    destination: row.destination,
    pickup: row.pickupLocation ?? "",
    reportingTime: row.reportingTime ?? "",
    vehicle: row.vehicle ?? "",
    driverName: row.driverName ?? "",
    driverMobile: row.driverMobile ?? "",
    notes: row.notes ?? "",
    totalFare,
    advancePaid,
    remaining,
    status: row.bookingStatus,
    paymentStatus: row.paymentStatus,
    customerConfirmation: row.customerConfirmation,
    customerConfirmedAt: row.customerConfirmedAt,
    createdAt: row.bookingCreatedAt,
    completedAt: row.completedAt,
  };
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const rows = await db.select().from(bookings).orderBy(desc(bookings.bookingCreatedAt));
    return Response.json(rows.map(serializeBooking));
  }

  if (req.method === "POST") {
    const body = await req.json();

    const passengerName = String(body.passengerName ?? "").trim();
    const mobile = String(body.mobile ?? "").trim();
    const journeyDate = String(body.journeyDate ?? "").trim();
    const destination = String(body.destination ?? "").trim();

    if (!passengerName || !mobile || !journeyDate || !destination) {
      return Response.json(
        { error: "passengerName, mobile, journeyDate and destination are required" },
        { status: 400 },
      );
    }

    const totalFare = toNumber(body.totalFare);
    const advancePaid = toNumber(body.advancePaid);
    const remaining = Math.max(totalFare - advancePaid, 0);
    const requestedStatus = body.bookingStatus === "CONFIRMED" ? "CONFIRMED" : "PENDING";

    const customerId = await findOrCreateCustomer(passengerName, mobile);
    const tourId = await generateUniqueTourId();

    const [created] = await db
      .insert(bookings)
      .values({
        tourId,
        customerId,
        customerName: passengerName,
        customerMobile: mobile,
        journeyDate,
        destination,
        pickupLocation: body.pickup ? String(body.pickup) : null,
        reportingTime: body.reportingTime ? String(body.reportingTime) : null,
        vehicle: body.vehicle ? String(body.vehicle) : null,
        driverName: body.driverName ? String(body.driverName) : null,
        driverMobile: body.driverMobile ? String(body.driverMobile) : null,
        notes: body.notes ? String(body.notes) : null,
        totalFare: totalFare.toFixed(2),
        advancePaid: advancePaid.toFixed(2),
        remainingAmount: remaining.toFixed(2),
        paymentStatus: computePaymentStatus(totalFare, advancePaid),
        bookingStatus: requestedStatus,
      })
      .returning();

    return Response.json(serializeBooking(created), { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/bookings",
};
