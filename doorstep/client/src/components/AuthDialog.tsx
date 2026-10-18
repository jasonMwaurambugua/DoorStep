import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  KeyRound,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "seeker" | "realtor" | "admin";
  emailVerified: boolean;
  realtorVerified: boolean;
};

type Props = {
  onClose: () => void;
  onComplete: (account: Account) => void;
};

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function AuthDialog({ onClose, onComplete }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [stage, setStage] = useState<"credentials" | "otp">("credentials");
  const [challengeId, setChallengeId] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const body: Record<string, FormDataEntryValue> = {
      email: data.get("email") || "",
      password: data.get("password") || "",
    };
    if (mode === "register") {
      body.name = data.get("name") || "";
      body.phone = data.get("phone") || "";
      body.role = data.get("role") || "seeker";
    }
    try {
      const response = await fetch(
        `${API_BASE}/auth/${mode === "register" ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(body),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Could not start sign-in.");
      setEmail(String(body.email));
      setChallengeId(result.challengeId);
      setDevelopmentCode(result.developmentCode || "");
      setStage("otp");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not start sign-in.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ challengeId, code: data.get("code") }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "That code did not work.");
      onComplete(result.user as Account);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not verify the code.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop auth-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <aside className="auth-aside">
          <a className="brand auth-brand" href="#top">
            <span className="brand-mark">
              <Home size={16} />
            </span>
            <span>doorstep</span>
            <small>KENYA</small>
          </a>
          <div className="auth-aside-copy">
            <span className="eyebrow">A BETTER WAY HOME</span>
            <h2>
              Good moves
              <br />
              start here.
            </h2>
            <p>
              One trusted place for finding a home and meeting the realtor
              behind it.
            </p>
          </div>
          <div className="auth-aside-foot">
            <ShieldCheck size={16} /> A verified email protects your account.
          </div>
        </aside>
        <div className="auth-main">
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
          {stage === "credentials" ? (
            <>
              <span className="auth-step">
                {mode === "login" ? "WELCOME BACK" : "YOUR DOORSTEP ACCOUNT"}
              </span>
              <h1 id="auth-title">
                {mode === "login" ? "Sign in" : "Create your account"}
              </h1>
              <p className="auth-subtitle">
                {mode === "login"
                  ? "Find the right place, or pick up where you left off."
                  : "Start saving homes or bringing your listings to life."}
              </p>
              <form className="auth-form" onSubmit={submitCredentials}>
                {mode === "register" && (
                  <>
                    <label>
                      Full name
                      <input
                        name="name"
                        required
                        minLength={2}
                        autoComplete="name"
                        placeholder="Your name"
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        name="phone"
                        required
                        type="tel"
                        autoComplete="tel"
                        placeholder="+254 7xx xxx xxx"
                      />
                    </label>
                  </>
                )}
                <label>
                  Email address
                  <div className="auth-input-icon">
                    <Mail size={16} />
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    required
                    type="password"
                    minLength={mode === "register" ? 10 : 1}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    placeholder={
                      mode === "register"
                        ? "At least 10 characters"
                        : "Your password"
                    }
                  />
                </label>
                {mode === "register" && (
                  <label>
                    I'm here as
                    <select name="role">
                      <option value="seeker">Looking for a home</option>
                      <option value="realtor">A realtor</option>
                    </select>
                  </label>
                )}
                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="auth-submit" type="submit" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : mode === "login"
                      ? "Continue securely"
                      : "Create account"}
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="auth-switch">
                {mode === "login"
                  ? "New to Doorstep?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError("");
                  }}
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
            </>
          ) : (
            <>
              <button
                className="back-step"
                onClick={() => {
                  setStage("credentials");
                  setError("");
                }}
              >
                <ArrowLeft size={15} /> Back
              </button>
              <span className="auth-step">
                <KeyRound size={13} /> TWO-STEP SIGN-IN
              </span>
              <h1 id="auth-title">Check your email.</h1>
              <p className="auth-subtitle">
                Enter the six-digit code sent to <strong>{email}</strong>. It
                expires in 10 minutes.
              </p>
              {developmentCode && (
                <div className="dev-code" role="status">
                  <span>Local development code</span>
                  <b>{developmentCode}</b>
                </div>
              )}
              <form className="auth-form otp-form" onSubmit={submitCode}>
                <label>
                  6-digit code
                  <input
                    name="code"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                  />
                </label>
                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="auth-submit" type="submit" disabled={busy}>
                  {busy ? "Verifying…" : "Verify and sign in"}
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="auth-secure-note">
                <ShieldCheck size={14} /> Your code can only be used once.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
