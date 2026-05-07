import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { canSubmitBooking, getAuthErrorMessage, getDisplayName } from "./authHelpers.js";
import { buildBookingEmailPayload, buildBookingInsert } from "./bookingHelpers.js";
import { isAuthConfigured, supabase } from "./supabase.js";

const SERVICES = [
  {
    name: "Signature Cut",
    price: 34,
    duration: "35 min",
    desc: "A tailored scissor or clipper cut, finished with a rinse and style.",
    tag: "Most booked",
  },
  {
    name: "Skin Fade",
    price: 40,
    duration: "45 min",
    desc: "Clean graduation, sharp neckline, and a finish built to last.",
    tag: "Precision",
  },
  {
    name: "Hot Towel Shave",
    price: 38,
    duration: "40 min",
    desc: "Warm towel prep, straight razor detail, cool towel, and aftershave.",
    tag: "Classic",
  },
  {
    name: "Beard Sculpt",
    price: 24,
    duration: "25 min",
    desc: "Shape, line-up, conditioning oil, and a natural finish.",
    tag: "Detail",
  },
  {
    name: "Cut + Beard",
    price: 58,
    duration: "65 min",
    desc: "Full haircut and beard work in one polished appointment.",
    tag: "Best value",
  },
  {
    name: "Junior Cut",
    price: 22,
    duration: "25 min",
    desc: "Patient, clean cuts for younger guests age 12 and under.",
    tag: "Family",
  },
];

const BARBERS = [
  {
    name: "Marcus Taylor",
    title: "Master Barber",
    years: 14,
    specialty: "Fades and textured crops",
    initials: "MT",
  },
  {
    name: "Leo Vargas",
    title: "Senior Barber",
    years: 8,
    specialty: "Classic cuts and styling",
    initials: "LV",
  },
  {
    name: "Dante Reed",
    title: "Barber",
    years: 5,
    specialty: "Beard shaping and line-ups",
    initials: "DR",
  },
];

const REVIEWS = [
  {
    name: "James K.",
    text: "The fade was exact, the shop was calm, and I was out on time. Easy five stars.",
  },
  {
    name: "Omar S.",
    text: "The hot towel shave is the reason I keep coming back. Old-school care without the wait.",
  },
  {
    name: "Tyler B.",
    text: "Dante cleaned up my beard perfectly. The shape lasted longer than any trim I have had.",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMES = ["9:00", "10:00", "11:00", "1:00", "2:00", "3:00", "4:00"];
const NAV_ITEMS = ["home", "services", "barbers", "contact"];

function Icon({ name }) {
  const icons = {
    scissors: (
      <>
        <circle cx="6.5" cy="6.5" r="3" />
        <circle cx="6.5" cy="17.5" r="3" />
        <path d="M8.8 8.8 20 20" />
        <path d="M20 4 8.8 15.2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    map: (
      <>
        <path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: (
      <path d="M21 16.5v3a1.5 1.5 0 0 1-1.7 1.5 18 18 0 0 1-7.8-2.8 17.5 17.5 0 0 1-5.4-5.4A18 18 0 0 1 3.3 5 1.5 1.5 0 0 1 4.8 3.3h3A1.5 1.5 0 0 1 9.3 4.6l.5 3a1.5 1.5 0 0 1-.4 1.3l-1.3 1.3a14 14 0 0 0 5.7 5.7l1.3-1.3a1.5 1.5 0 0 1 1.3-.4l3 .5A1.5 1.5 0 0 1 21 16.5Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    google: (
      <>
        <path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7Z" />
        <path d="M12 21c2.5 0 4.7-.8 6.2-2.2l-3.1-2.4c-.8.6-1.9.9-3.1.9a5.3 5.3 0 0 1-5-3.7H3.8v2.5A9.3 9.3 0 0 0 12 21Z" />
        <path d="M7 13.6a5.4 5.4 0 0 1 0-3.4V7.7H3.8a9.2 9.2 0 0 0 0 8.2L7 13.6Z" />
        <path d="M12 6.7c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.1 9.1 0 0 0 3.8 7.7L7 10.2a5.3 5.3 0 0 1 5-3.5Z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
}

function SectionHeading({ kicker, title, text }) {
  return (
    <div className="section-heading">
      <p>{kicker}</p>
      <h2>{title}</h2>
      {text ? <span>{text}</span> : null}
    </div>
  );
}

function AuthModal({
  authBusy,
  authError,
  authMode,
  isOpen,
  onClose,
  onEmailSubmit,
  onGoogleSignIn,
  setAuthError,
  setAuthMode,
}) {
  if (!isOpen) return null;

  const isSignUp = authMode === "signup";

  return (
    <div className="auth-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className="auth-modal"
        role="dialog"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in">
          ×
        </button>
        <p className="eyebrow">Member access</p>
        <h2 id="auth-title">{isSignUp ? "Create your account" : "Sign in to book"}</h2>
        <p className="auth-copy">
          Sign in with Google or use email and password. Bookings are protected until you are signed in.
        </p>

        {!isAuthConfigured ? (
          <div className="auth-config-note">
            Add Supabase values to `.env.local`, then enable Google and Email providers in Supabase Auth.
          </div>
        ) : null}

        <button
          className="google-btn"
          type="button"
          disabled={authBusy || !isAuthConfigured}
          onClick={onGoogleSignIn}
        >
          <Icon name="google" />
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-form" onSubmit={onEmailSubmit}>
          <label>
            Email
            <input required name="email" type="email" autoComplete="email" disabled={authBusy || !isAuthConfigured} />
          </label>
          <label>
            Password
            <input
              required
              minLength="6"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              disabled={authBusy || !isAuthConfigured}
            />
          </label>
          {authError ? <p className="auth-error">{authError}</p> : null}
          <button className="primary-btn full-width" type="submit" disabled={authBusy || !isAuthConfigured}>
            {authBusy ? "Working..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setAuthError("");
            setAuthMode(isSignUp ? "signin" : "signup");
          }}
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </section>
    </div>
  );
}

export default function BarberShop() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedBarber, setSelectedBarber] = useState(BARBERS[0]);
  const [selectedDay, setSelectedDay] = useState("Fri");
  const [selectedTime, setSelectedTime] = useState("2:00");
  const [bookingDone, setBookingDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const booking = { selectedService, selectedBarber, selectedDay, selectedTime };
  const bookingReady = selectedService && selectedBarber && selectedDay && selectedTime;
  const bookingAllowed = canSubmitBooking(currentUser, booking);
  const signedInName = getDisplayName(currentUser);

  const bookingSummary = useMemo(() => {
    if (!bookingReady) return "Choose a service, barber, day, and time.";
    return `${selectedService.name} with ${selectedBarber.name} on ${selectedDay} at ${selectedTime}`;
  }, [bookingReady, selectedBarber, selectedDay, selectedService, selectedTime]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setAuthOpen(false);
        setAuthError("");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setAuthOpen(false);
        setAuthError("");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    NAV_ITEMS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBook = async () => {
    if (!bookingReady) return;
    if (!currentUser) {
      setAuthError("");
      setAuthMode("signin");
      setAuthOpen(true);
      return;
    }
    if (!bookingAllowed || !supabase) return;

    setBookingBusy(true);
    setBookingError("");
    try {
      const bookingInsert = buildBookingInsert(currentUser, booking, signedInName);
      const { data, error } = await supabase.from("bookings").insert(bookingInsert).select().single();
      if (error) throw error;

      setConfirmedBooking(data);
      setBookingDone(true);

      supabase.functions
        .invoke("send-booking-email", { body: buildBookingEmailPayload(data) })
        .catch(() => undefined);
    } catch (error) {
      setBookingError(error.message || "Booking could not be confirmed. Please try again.");
    } finally {
      setBookingBusy(false);
    }
  };

  const resetBooking = () => {
    setSelectedService(SERVICES[0]);
    setSelectedBarber(BARBERS[0]);
    setSelectedDay("Fri");
    setSelectedTime("2:00");
    setBookingDone(false);
    setConfirmedBooking(null);
    setBookingError("");
  };

  const handleMessage = (event) => {
    event.preventDefault();
    setMessageSent(true);
    event.currentTarget.reset();
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    setAuthBusy(true);
    setAuthError("");
    try {
      const response =
        authMode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (response.error) throw response.error;
      if (authMode === "signup") {
        setAuthError("Check your email to confirm your account, then sign in.");
      }
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setBookingDone(false);
  };

  return (
    <div className="site-shell">
      <nav className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
        <button className="brand" type="button" onClick={() => scrollTo("home")} aria-label="Go to home">
          <span className="brand-mark">
            <Icon name="scissors" />
          </span>
          <span>Crown & Blade</span>
        </button>

        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={activeSection === item ? "is-active" : ""}
              type="button"
              onClick={() => scrollTo(item)}
            >
              {item}
            </button>
          ))}
          <div className="mobile-auth-panel">
            {currentUser ? (
              <>
                <span>Signed in as {signedInName}</span>
                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setAuthMode("signin");
                  setAuthError("");
                  setAuthOpen(true);
                }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        <button className="nav-book" type="button" onClick={() => scrollTo("booking")}>
          Book
        </button>
        <div className="auth-nav">
          {currentUser ? (
            <>
              <span>
                <Icon name="user" />
                {signedInName}
              </span>
              <button type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setAuthError("");
                setAuthOpen(true);
              }}
            >
              Sign in
            </button>
          )}
        </div>
        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name="menu" />
        </button>
      </nav>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-media" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">Established 2009 - Downtown</p>
            <h1>Crown & Blade</h1>
            <p>
              A modern barbershop for sharp cuts, precise fades, and straight razor work
              delivered with quiet confidence.
            </p>
            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={() => scrollTo("booking")}>
                Book appointment
                <Icon name="arrow" />
              </button>
              <button className="secondary-btn" type="button" onClick={() => scrollTo("services")}>
                View services
              </button>
            </div>
          </div>
          <div className="hero-panel" aria-label="Shop highlights">
            <div>
              <strong>4.9</strong>
              <span>average rating</span>
            </div>
            <div>
              <strong>17k+</strong>
              <span>cuts served</span>
            </div>
            <div>
              <strong>6 days</strong>
              <span>open weekly</span>
            </div>
          </div>
        </section>

        <section className="intro-band">
          <div>
            <Icon name="clock" />
            <span>Same-day appointments available before 3 PM.</span>
          </div>
          <div>
            <Icon name="map" />
            <span>142 Main Street, Suite 1, Downtown.</span>
          </div>
          <div>
            <Icon name="phone" />
            <span>(555) 214-0988 for walk-in availability.</span>
          </div>
        </section>

        <section className="section services-section" id="services">
          <SectionHeading
            kicker="Services"
            title="Cuts with a clear point of view"
            text="Simple menu, transparent timing, and no surprise add-ons."
          />
          <div className="service-grid">
            {SERVICES.map((service) => (
              <article className="service-card" key={service.name}>
                <div className="card-topline">
                  <span>{service.tag}</span>
                  <strong>${service.price}</strong>
                </div>
                <h3>{service.name}</h3>
                <p>{service.desc}</p>
                <small>{service.duration}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="craft-section">
          <div className="craft-image" />
          <div className="craft-copy">
            <p className="eyebrow">The shop standard</p>
            <h2>Every seat runs on preparation, pace, and finish.</h2>
            <p>
              Each appointment starts with a quick consultation, then moves into clean sectioning,
              deliberate detail work, and a finish matched to your routine.
            </p>
            <ul>
              <li>Sanitized tools and fresh towels for every guest.</li>
              <li>Consult-first service for cut, beard, and styling decisions.</li>
              <li>Easy rebooking with your preferred barber and time.</li>
            </ul>
          </div>
        </section>

        <section className="section barbers-section" id="barbers">
          <SectionHeading
            kicker="Barbers"
            title="Pick your chair"
            text="Three specialists, one shared standard for clean lines and considered service."
          />
          <div className="barber-grid">
            {BARBERS.map((barber) => (
              <article className="barber-card" key={barber.name}>
                <div className="avatar">{barber.initials}</div>
                <div>
                  <p>{barber.title}</p>
                  <h3>{barber.name}</h3>
                  <span>{barber.years} years experience</span>
                </div>
                <small>{barber.specialty}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="reviews-section" aria-label="Customer reviews">
          {REVIEWS.map((review) => (
            <figure key={review.name}>
              <div aria-hidden="true">★★★★★</div>
              <blockquote>{review.text}</blockquote>
              <figcaption>{review.name}</figcaption>
            </figure>
          ))}
        </section>

        <section className="booking-section" id="booking">
          <div className="booking-copy">
            <p className="eyebrow">Reserve your seat</p>
            <h2>Book in under a minute</h2>
            <p>
              Choose your service, barber, day, and time. This demo confirms instantly so the
              flow feels complete.
            </p>
            <div className="summary-box">
              <span>Your selection</span>
              <strong>{bookingSummary}</strong>
              <em>
                {authLoading
                  ? "Checking sign-in..."
                  : currentUser
                    ? `Booking as ${signedInName}`
                    : "Sign in before confirming your booking."}
              </em>
            </div>
          </div>

          <div className="booking-card">
            {bookingDone ? (
              <div className="booking-success">
                <span className="success-icon">
                  <Icon name="check" />
                </span>
                <h3>You are booked</h3>
                <p>Booking confirmed! You will receive a confirmation email shortly.</p>
                <p>{bookingSummary}</p>
                {confirmedBooking?.id ? <p className="booking-reference">Reference: {confirmedBooking.id}</p> : null}
                <p className="booking-user">Confirmed for {signedInName}</p>
                <button className="secondary-btn" type="button" onClick={resetBooking}>
                  Book another
                </button>
              </div>
            ) : (
              <>
                <div className="booking-step">
                  <span>01</span>
                  <h3>Service</h3>
                  <div className="choice-grid">
                    {SERVICES.map((service) => (
                      <button
                        className={selectedService?.name === service.name ? "is-selected" : ""}
                        key={service.name}
                        type="button"
                        onClick={() => setSelectedService(service)}
                      >
                        <strong>{service.name}</strong>
                        <small>${service.price} - {service.duration}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="booking-step">
                  <span>02</span>
                  <h3>Barber</h3>
                  <div className="barber-choice-row">
                    {BARBERS.map((barber) => (
                      <button
                        className={selectedBarber?.name === barber.name ? "is-selected" : ""}
                        key={barber.name}
                        type="button"
                        onClick={() => setSelectedBarber(barber)}
                      >
                        <strong>{barber.initials}</strong>
                        <span>{barber.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="booking-step">
                  <span>03</span>
                  <h3>Day and time</h3>
                  <div className="slot-row">
                    {DAYS.map((day) => (
                      <button
                        className={selectedDay === day ? "is-selected" : ""}
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="slot-row">
                    {TIMES.map((time) => (
                      <button
                        className={selectedTime === time ? "is-selected" : ""}
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="primary-btn full-width"
                  type="button"
                  disabled={!bookingReady || bookingBusy}
                  onClick={handleBook}
                >
                  {bookingBusy ? "Confirming..." : currentUser ? "Confirm booking" : "Sign in to book"}
                  <Icon name={currentUser ? "check" : "user"} />
                </button>
                {bookingError ? <p className="booking-error">{bookingError}</p> : null}
                {!currentUser ? (
                  <p className="booking-lock">Bookings can only be submitted after sign-in.</p>
                ) : null}
              </>
            )}
          </div>
        </section>

        <section className="contact-section" id="contact">
          <SectionHeading
            kicker="Contact"
            title="Hours, location, and messages"
            text="Questions, private events, and group bookings can start here."
          />
          <div className="contact-grid">
            <div className="hours-card">
              {[
                ["Monday - Friday", "9:00 AM - 7:00 PM"],
                ["Saturday", "9:00 AM - 6:00 PM"],
                ["Sunday", "Closed"],
              ].map(([day, hours]) => (
                <div key={day}>
                  <span>{day}</span>
                  <strong>{hours}</strong>
                </div>
              ))}
              <address>
                142 Main Street, Suite 1
                <br />
                Downtown
                <br />
                hello@crownblade.com
              </address>
              <a className="whatsapp-link" href="https://wa.me/923193164488" target="_blank" rel="noreferrer">
                <Icon name="phone" />
                Chat with us on WhatsApp
              </a>
            </div>

            <form className="contact-form" onSubmit={handleMessage}>
              <label>
                Name
                <input required name="name" autoComplete="name" />
              </label>
              <label>
                Email
                <input required name="email" type="email" autoComplete="email" />
              </label>
              <label>
                Message
                <textarea required name="message" rows="5" />
              </label>
              <button className="primary-btn" type="submit">
                Send message
                <Icon name="arrow" />
              </button>
              {messageSent ? <p className="form-note">Thanks. Your message is ready for the shop team.</p> : null}
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <button type="button" onClick={() => scrollTo("home")}>
          <Icon name="scissors" />
          Crown & Blade
        </button>
        <span>2026 Crown & Blade Barbershop. All rights reserved.</span>
      </footer>

      <AuthModal
        authBusy={authBusy}
        authError={authError}
        authMode={authMode}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onEmailSubmit={handleEmailAuth}
        onGoogleSignIn={handleGoogleSignIn}
        setAuthError={setAuthError}
        setAuthMode={setAuthMode}
      />
    </div>
  );
}
