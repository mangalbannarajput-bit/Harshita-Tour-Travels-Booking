import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { bookings } from "./schema.js";

export type ConfirmationAction = "CONFIRMED" | "CANCELLED";

export type ConfirmationResult =
  | { ok: true; booking: typeof bookings.$inferSelect }
  | { ok: false; status: number; error: string };

export async function applyCustomerConfirmation(
  tourId: string,
  action: ConfirmationAction,
): Promise<ConfirmationResult> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.tourId, tourId)).limit(1);

  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  if (booking.bookingStatus === "COMPLETED") {
    return { ok: false, status: 409, error: "This booking is already completed and cannot be changed" };
  }

  if (booking.customerConfirmation === action) {
    return { ok: true, booking };
  }

  if (booking.customerConfirmation !== "PENDING") {
    return {
      ok: false,
      status: 409,
      error: `This booking has already been ${booking.customerConfirmation.toLowerCase()} and cannot be changed`,
    };
  }

  const now = new Date();

  const [updated] = await db
    .update(bookings)
    .set({
      customerConfirmation: action,
      bookingStatus: action,
      customerConfirmedAt: now,
      updatedAt: now,
    })
    .where(eq(bookings.tourId, tourId))
    .returning();

  return { ok: true, booking: updated };
}
