import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { bookings } from "../../db/schema.js";

export default async (request: Request) => {
  const url = new URL(request.url);
  const tourId = url.searchParams.get("tourId");

  if (!tourId) {
    return new Response(
      JSON.stringify({ error: "Booking ID is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.tourId, tourId))
      .limit(1);

    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ error: "Could not load booking" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
