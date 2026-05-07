export function getDisplayName(user) {
  if (!user) return "Guest";
  if (user.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user.user_metadata?.name) return user.user_metadata.name;
  if (user.user_metadata?.preferred_username) return user.user_metadata.preferred_username;
  if (user.email) return user.email.split("@")[0];
  return "Guest";
}

export function canSubmitBooking(user, booking) {
  return Boolean(
    user?.id &&
      booking?.selectedService &&
      booking?.selectedBarber &&
      booking?.selectedDay &&
      booking?.selectedTime,
  );
}

export function isSupabaseConfigured(config) {
  return Boolean(config?.url && config?.anonKey);
}

export function getSupabaseConfig(env) {
  return {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  };
}

export function getAuthErrorMessage(error) {
  const code = error?.code || error?.status;
  const message = error?.message || "";
  if (message.includes("Invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (message.includes("already registered") || message.includes("already exists")) {
    return "That email is already registered. Try signing in instead.";
  }
  if (message.toLowerCase().includes("password")) {
    return "Use a password with at least 6 characters.";
  }
  if (message.includes("popup") || message.includes("cancelled")) {
    return "Google sign-in was closed before it finished.";
  }
  if (code === 400 || code === "validation_failed") {
    return "Check your email and password, then try again.";
  }
  return "Authentication failed. Please try again.";
}
