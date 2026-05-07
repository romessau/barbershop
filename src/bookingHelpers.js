export function buildBookingInsert(user, booking, displayName) {
  if (!user?.id) {
    throw new Error("A signed-in Supabase user is required to create a booking.");
  }

  return {
    user_id: user.id,
    service: booking.selectedService.name,
    barber: booking.selectedBarber.name,
    appointment_day: booking.selectedDay,
    appointment_time: booking.selectedTime,
    customer_name: displayName,
    customer_email: user.email,
  };
}

export function buildBookingEmailPayload(bookingRow) {
  return {
    type: "confirmation",
    booking: {
      id: bookingRow.id,
      user_id: bookingRow.user_id,
      service: bookingRow.service,
      barber: bookingRow.barber,
      appointment_day: bookingRow.appointment_day,
      appointment_time: bookingRow.appointment_time,
      customer_email: bookingRow.customer_email,
      customer_name: bookingRow.customer_name,
    },
  };
}
