import assert from "node:assert/strict";
import test from "node:test";
import { buildBookingEmailPayload, buildBookingInsert } from "./bookingHelpers.js";

const booking = {
  selectedService: { name: "Signature Cut" },
  selectedBarber: { name: "Marcus Taylor" },
  selectedDay: "Fri",
  selectedTime: "2:00",
};

test("buildBookingInsert maps UI booking state to the Supabase bookings row", () => {
  assert.deepEqual(
    buildBookingInsert({ id: "user-1", email: "ava@example.com" }, booking, "Ava Carter"),
    {
      user_id: "user-1",
      service: "Signature Cut",
      barber: "Marcus Taylor",
      appointment_day: "Fri",
      appointment_time: "2:00",
      customer_name: "Ava Carter",
      customer_email: "ava@example.com",
    },
  );
});

test("buildBookingInsert rejects missing Supabase user ids", () => {
  assert.throws(() => buildBookingInsert({ email: "ava@example.com" }, booking, "Ava Carter"), /signed-in Supabase user/);
});

test("buildBookingEmailPayload includes the booking reference and email fields", () => {
  assert.deepEqual(
    buildBookingEmailPayload({
      id: "booking-1",
      user_id: "user-1",
      service: "Signature Cut",
      barber: "Marcus Taylor",
      appointment_day: "Fri",
      appointment_time: "2:00",
      customer_email: "ava@example.com",
      customer_name: "Ava Carter",
    }),
    {
      type: "confirmation",
      booking: {
        id: "booking-1",
        user_id: "user-1",
        service: "Signature Cut",
        barber: "Marcus Taylor",
        appointment_day: "Fri",
        appointment_time: "2:00",
        customer_email: "ava@example.com",
        customer_name: "Ava Carter",
      },
    },
  );
});
