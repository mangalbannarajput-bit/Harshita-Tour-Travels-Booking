import type { Config, Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { bookings } from "../../db/schema.js";

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const tourId = new URL(req.url).searchParams.get("tourId")?.trim();

  if (!tourId) {
    return Response.json({ error: "tourId is required" }, { status: 400 });
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.tourId, tourId)).limit(1);

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  return Response.json({
    tourId: booking.tourId,
    passengerName: booking.customerName,
    mobile: booking.customerMobile,
    journeyDate: booking.journeyDate,
    destination: booking.destination,
    pickup: booking.pickupLocation ?? "",
    reportingTime: booking.reportingTime ?? "",
    vehicle: booking.vehicle ?? "",
    totalFare: toNumber(booking.totalFare),
    advancePaid: toNumber(booking.advancePaid),
    remaining: toNumber(booking.remainingAmount),
    bookingStatus: booking.bookingStatus,
    customerConfirmation: booking.customerConfirmation,
    customerConfirmedAt: booking.customerConfirmedAt,
  });
};

export const config: Config = {
  path: "/api/booking-confirmation",
};
