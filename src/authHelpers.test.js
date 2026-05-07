import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitBooking, getDisplayName, isSupabaseConfigured } from "./authHelpers.js";

test("getDisplayName prefers Supabase metadata name, then email prefix, then Guest", () => {
  assert.equal(getDisplayName({ user_metadata: { full_name: "Ava Carter" }, email: "ava@example.com" }), "Ava Carter");
  assert.equal(getDisplayName({ user_metadata: { name: "Leo Vargas" }, email: "leo@example.com" }), "Leo Vargas");
  assert.equal(getDisplayName({ email: "marcus@example.com" }), "marcus");
  assert.equal(getDisplayName(null), "Guest");
});

test("canSubmitBooking requires a signed-in user and complete booking", () => {
  const completeBooking = {
    selectedService: { name: "Signature Cut" },
    selectedBarber: { name: "Marcus Taylor" },
    selectedDay: "Fri",
    selectedTime: "2:00",
  };

  assert.equal(canSubmitBooking(null, completeBooking), false);
  assert.equal(canSubmitBooking({ id: "user-1" }, completeBooking), true);
  assert.equal(canSubmitBooking({ id: "user-1" }, { ...completeBooking, selectedTime: null }), false);
});

test("isSupabaseConfigured requires the Supabase URL and anon key", () => {
  assert.equal(isSupabaseConfigured({}), false);
  assert.equal(
    isSupabaseConfigured({
      url: "https://project.supabase.co",
      anonKey: "public-anon-key",
    }),
    true,
  );
});
