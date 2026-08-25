import { applyCustomerConfirmation } from "../../db/booking-helpers.js";

export default async (request: Request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const tourId = body?.tourId;

    if (!tourId) {
      return new Response(
        JSON.stringify({ error: "Booking ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await applyCustomerConfirmation(
      String(tourId),
      "CONFIRMED"
    );

    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: result.error }),
        {
          status: result.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        tourId: result.booking.tourId,
        bookingStatus: result.booking.bookingStatus,
        customerConfirmation: result.booking.customerConfirmation,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ error: "Could not confirm booking" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
