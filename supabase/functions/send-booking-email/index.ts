import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Booking = {
  id: string;
  user_id: string;
  service: string;
  barber: string;
  appointment_day: string;
  appointment_time: string;
  customer_email?: string | null;
  customer_name?: string | null;
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Crown & Blade <onboarding@resend.dev>";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const cronSecret = Deno.env.get("CRON_SECRET");

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailHtml(title: string, booking: Booking) {
  const safeBooking = {
    id: escapeHtml(booking.id),
    service: escapeHtml(booking.service),
    barber: escapeHtml(booking.barber),
    appointment_day: escapeHtml(booking.appointment_day),
    appointment_time: escapeHtml(booking.appointment_time),
  };

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
      <h2>${escapeHtml(title)}</h2>
      <p><strong>Reference:</strong> ${safeBooking.id}</p>
      <p><strong>Service:</strong> ${safeBooking.service}</p>
      <p><strong>Barber:</strong> ${safeBooking.barber}</p>
      <p><strong>Day:</strong> ${safeBooking.appointment_day}</p>
      <p><strong>Time:</strong> ${safeBooking.appointment_time}</p>
    </div>
  `;
}

function emailText(title: string, booking: Booking) {
  return [
    title,
    "",
    `Reference: ${booking.id}`,
    `Service: ${booking.service}`,
    `Barber: ${booking.barber}`,
    `Day: ${booking.appointment_day}`,
    `Time: ${booking.appointment_time}`,
  ].join("\n");
}

async function sendEmail({ booking, subject, title }: { booking: Booking; subject: string; title: string }) {
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!booking.customer_email) throw new Error(`Booking ${booking.id} has no customer email.`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: booking.customer_email,
      subject,
      html: emailHtml(title, booking),
      text: emailText(title, booking),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? `Resend returned ${response.status}`);
  }
  return data;
}

function getBearerToken(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await request.json().catch(() => ({}));

    if (body.type === "confirmation") {
      if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase Auth environment is not configured.");
      const token = getBearerToken(request);
      if (!token) return jsonResponse({ error: "Missing authorization token" }, 401);

      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data.user) return jsonResponse({ error: "Invalid user token" }, 401);

      const booking = body.booking as Booking;
      if (!booking?.id || booking.user_id !== data.user.id) {
        return jsonResponse({ error: "Booking does not belong to the signed-in user" }, 403);
      }

      const result = await sendEmail({
        booking: { ...booking, customer_email: booking.customer_email ?? data.user.email },
        subject: `Crown & Blade booking confirmed: ${booking.service}`,
        title: "Your booking is confirmed",
      });

      if (supabaseUrl && supabaseServiceRoleKey) {
        const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
        await adminClient
          .from("bookings")
          .update({ confirmation_email_sent_at: new Date().toISOString(), confirmation_email_error: null })
          .eq("id", booking.id);
      }

      return jsonResponse({ ok: true, email: result });
    }

    if (body.type === "reminders") {
      if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
        return jsonResponse({ error: "Invalid cron secret" }, 401);
      }
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Supabase service role environment is not configured.");
      }

      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: bookings, error } = await adminClient
        .from("bookings")
        .select("id,user_id,service,barber,appointment_day,appointment_time,customer_email,customer_name")
        .is("reminder_sent_at", null)
        .lte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .limit(50);

      if (error) throw error;

      const sent: string[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const booking of bookings ?? []) {
        try {
          await sendEmail({
            booking,
            subject: `Reminder: Crown & Blade appointment for ${booking.appointment_day}`,
            title: "Appointment reminder",
          });
          const { error: updateError } = await adminClient
            .from("bookings")
            .update({ reminder_sent_at: new Date().toISOString(), reminder_email_error: null })
            .eq("id", booking.id);
          if (updateError) throw updateError;
          sent.push(booking.id);
        } catch (sendError) {
          const message = sendError instanceof Error ? sendError.message : "Unknown reminder error";
          failed.push({ id: booking.id, error: message });
          await adminClient
            .from("bookings")
            .update({ reminder_email_error: message })
            .eq("id", booking.id);
        }
      }

      return jsonResponse({ ok: true, sent, failed });
    }

    return jsonResponse({ error: "Unknown email request type" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected email function error";
    return jsonResponse({ error: message }, 500);
  }
});
