import { useId, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Mic2,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../lib/utils";
import { useAuth } from "./auth-context";

type AuthMode = "sign-in" | "sign-up";

export interface LoginPageProps {
  initialMode?: AuthMode;
  onAuthenticated?: () => void;
}

function getAuthErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "An authentication error occurred.";

  if (
    message.includes("auth/invalid-credential") ||
    message.includes("auth/user-not-found") ||
    message.includes("auth/wrong-password")
  ) {
    return "The email or password is incorrect. Try again or use a demo account.";
  }

  if (message.includes("auth/email-already-in-use")) {
    return "An account already uses this email. Sign in instead.";
  }

  if (message.includes("auth/invalid-email")) {
    return "Enter a valid email address.";
  }

  if (message.includes("auth/weak-password")) {
    return "Use a password with at least 6 characters.";
  }

  if (message.includes("auth/network-request-failed")) {
    return "We could not reach Firebase. Check your connection and try again.";
  }

  return message;
}

const inputClassName =
  "min-h-11 w-full rounded-control border border-border-strong bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-standard placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70";

export function LoginPage({
  initialMode = "sign-in",
  onAuthenticated,
}: LoginPageProps) {
  const { signIn, signUp, demoSignIn, loading: authLoading } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const emailId = useId();
  const passwordId = useId();
  const displayNameId = useId();
  const organizationNameId = useId();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = authLoading || submitting || demoSubmitting;
  const isSignUp = mode === "sign-up";

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!displayName.trim() || !organizationName.trim()) {
          setError("Enter your name and business name to create an account.");
          return;
        }

        await signUp(
          email.trim(),
          password,
          displayName.trim(),
          organizationName.trim(),
          "MERCHANT",
        );
      } else {
        await signIn(email.trim(), password);
      }

      onAuthenticated?.();
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setDemoSubmitting(true);

    try {
      await demoSignIn("merchant");
      onAuthenticated?.();
    } catch {
      setError(
        "Demo sign-in failed. Check that the demo Firebase accounts are available, then try again.",
      );
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-subtle via-info-subtle to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-app lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-dvh flex-col justify-between px-10 py-10 lg:flex xl:px-16 xl:py-12">
          <div>
            <a
              href="/"
              aria-label="MIZAN Control home"
              className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4"
            >
              <span className="text-2xl font-semibold tracking-tight text-brand-950">
                MIZAN <span className="text-primary">Control</span>
              </span>
            </a>
          </div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-badge border border-violet-200 bg-ai-subtle px-3 py-1.5 text-sm font-semibold text-ai">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              AI financial control for Moroccan distributors
            </div>
            <h2 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-brand-950 xl:text-5xl">
              Turn fragmented company records into financial control.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground-muted">
              Find leakage, forecast cash, and control supplier risk.
            </p>

            <ol className="mt-10 grid max-w-2xl gap-4 xl:grid-cols-3">
              <li className="rounded-card border border-border bg-surface/90 p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-ai-subtle text-ai">
                  <Mic2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-foreground">
                  Share evidence
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  Upload invoices, orders, deliveries, or exports.
                </p>
              </li>
              <li className="rounded-card border border-border bg-surface/90 p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-subtle text-primary">
                  <FileCheck2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-foreground">
                  Confirm the draft
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  Review uncertainty before records change.
                </p>
              </li>
              <li className="rounded-card border border-border bg-surface/90 p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-success-subtle text-success">
                  <UsersRound aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-foreground">
                  Control every dirham
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  See risks and next actions in one place.
                </p>
              </li>
            </ol>
          </motion.div>

          <div className="flex items-center gap-3 text-sm text-foreground-muted">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-success" />
            <span>AI creates drafts. You approve every important action.</span>
          </div>
        </section>

        <section className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:border-l lg:border-border lg:bg-surface/55 xl:px-16">
          <div className="w-full max-w-lg">
            <div className="mb-7 text-center lg:hidden">
              <a
                href="/"
                aria-label="MIZAN Control home"
                className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4"
              >
                <span className="text-2xl font-semibold tracking-tight text-brand-950">
                  MIZAN <span className="text-primary">Control</span>
                </span>
              </a>
              <p className="mt-2 text-sm text-foreground-muted">
                Financial control for distribution teams.
              </p>
            </div>

            <Card className="shadow-raised">
              <CardContent className="p-6 sm:p-8">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Welcome to MIZAN Control
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {isSignUp
                      ? "Create your business account"
                      : "Sign in to your portal"}
                  </h1>
                  <p className="mt-3 text-base leading-relaxed text-foreground-muted">
                    {isSignUp
                      ? "Create your finance workspace."
                      : "Open your finance workspace."}
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="Authentication mode"
                  className="mt-6 grid grid-cols-2 rounded-control border border-border bg-surface-subtle p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isSignUp}
                    onClick={() => changeMode("sign-in")}
                    className={cn(
                      "min-h-11 rounded-[0.625rem] px-4 text-sm font-semibold outline-none transition-[background-color,color,box-shadow] duration-standard focus-visible:ring-2 focus-visible:ring-focus",
                      !isSignUp
                        ? "bg-surface text-brand-950 shadow-sm"
                        : "text-foreground-muted hover:text-foreground",
                    )}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSignUp}
                    onClick={() => changeMode("sign-up")}
                    className={cn(
                      "min-h-11 rounded-[0.625rem] px-4 text-sm font-semibold outline-none transition-[background-color,color,box-shadow] duration-standard focus-visible:ring-2 focus-visible:ring-focus",
                      isSignUp
                        ? "bg-surface text-brand-950 shadow-sm"
                        : "text-foreground-muted hover:text-foreground",
                    )}
                  >
                    Create account
                  </button>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 rounded-control border border-red-200 bg-danger-subtle p-3.5 text-sm leading-relaxed text-danger"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0"
                    />
                    <span>{error}</span>
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} aria-busy={busy} className="mt-6">
                  <AnimatePresence mode="wait" initial={false}>
                    {isSignUp ? (
                      <motion.div
                        key="registration-fields"
                        initial={
                          prefersReducedMotion ? false : { opacity: 0, y: 8 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          prefersReducedMotion
                            ? undefined
                            : { opacity: 0, y: -4 }
                        }
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="space-y-4"
                      >
                        <div>
                          <label
                            htmlFor={displayNameId}
                            className="mb-2 block text-sm font-semibold text-foreground"
                          >
                            Your full name
                          </label>
                          <input
                            id={displayNameId}
                            type="text"
                            autoComplete="name"
                            required
                            disabled={busy}
                            value={displayName}
                            onChange={(event) =>
                              setDisplayName(event.target.value)
                            }
                            placeholder="Hassan Slimani"
                            className={inputClassName}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={organizationNameId}
                            className="mb-2 block text-sm font-semibold text-foreground"
                          >
                            Business name
                          </label>
                          <input
                            id={organizationNameId}
                            type="text"
                            autoComplete="organization"
                            required
                            disabled={busy}
                            value={organizationName}
                            onChange={(event) =>
                              setOrganizationName(event.target.value)
                            }
                            placeholder="Atlas Distribution Maroc"
                            className={inputClassName}
                          />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className={cn("space-y-4", isSignUp && "mt-4")}>
                    <div>
                      <label
                        htmlFor={emailId}
                        className="mb-2 block text-sm font-semibold text-foreground"
                      >
                        Email address
                      </label>
                      <input
                        id={emailId}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        disabled={busy}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={passwordId}
                        className="mb-2 block text-sm font-semibold text-foreground"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <LockKeyhole
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                        />
                        <input
                          id={passwordId}
                          type={showPassword ? "text" : "password"}
                          autoComplete={
                            isSignUp ? "new-password" : "current-password"
                          }
                          required
                          minLength={6}
                          disabled={busy}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="At least 6 characters"
                          className={cn(inputClassName, "pl-10 pr-12")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          disabled={busy}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-badge text-foreground-muted outline-none transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {showPassword ? (
                            <EyeOff aria-hidden="true" className="h-5 w-5" />
                          ) : (
                            <Eye aria-hidden="true" className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {isSignUp ? (
                        <p className="mt-2 text-sm text-foreground-muted">
                          Use at least 6 characters.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    loading={submitting}
                    disabled={busy}
                    className="mt-6 w-full"
                  >
                    {isSignUp ? "Create account" : "Sign in"}
                    {!submitting ? (
                      <ArrowRight aria-hidden="true" className="h-5 w-5" />
                    ) : null}
                  </Button>
                </form>

                <div
                  className="my-6 flex items-center gap-3"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Quick demo
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div>
                  <Button
                    variant="outline"
                    loading={demoSubmitting}
                    disabled={busy}
                    onClick={() => void handleDemoSignIn()}
                    className="w-full"
                  >
                    <Store
                      aria-hidden="true"
                      className="h-5 w-5 text-primary"
                    />
                    Demo finance team
                  </Button>
                </div>

                <p className="mt-5 flex items-center justify-center gap-2 text-xs text-foreground-muted">
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-4 w-4 text-success"
                  />
                  Synthetic demo data only
                </p>
              </CardContent>
            </Card>

            <p className="mt-5 text-center text-sm text-foreground-muted">
              Your business data remains private to your organization.
            </p>
          </div>
        </section>
      </div>

      <div className="sr-only" aria-live="polite">
        {submitting
          ? isSignUp
            ? "Creating your account"
            : "Signing you in"
          : demoSubmitting
            ? "Signing in to the finance demo"
            : ""}
      </div>
    </main>
  );
}
