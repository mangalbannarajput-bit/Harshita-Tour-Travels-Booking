import type { Config, Context } from "@netlify/functions";
import { applyCustomerConfirmation } from "../../db/booking-helpers.js";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();
  const tourId = String(body.tourId ?? "").trim();

  if (!tourId) {
    return Response.json({ error: "tourId is required" }, { status: 400 });
  }

  const result = await applyCustomerConfirmation(tourId, "CANCELLED");

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    tourId: result.booking.tourId,
    bookingStatus: result.booking.bookingStatus,
    customerConfirmation: result.booking.customerConfirmation,
    customerConfirmedAt: result.booking.customerConfirmedAt,
  });
};

export const config: Config = {
  path: "/api/booking-cancel",
};
