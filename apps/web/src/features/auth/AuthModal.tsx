import React, { useState } from "react";
import { useAuth } from "./auth-context";
import {
  LogIn,
  UserPlus,
  Store,
  Building2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, demoSignIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"MERCHANT" | "SUPPLIER">("MERCHANT");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim() || !orgName.trim()) {
          throw new Error("Please fill in your name and business name.");
        }
        await signUp(email, password, displayName, orgName, orgType);
        setSuccessMsg("Account created successfully! Welcome to MIZAN Souq.");
      } else {
        await signIn(email, password);
        setSuccessMsg("Signed in successfully!");
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error("Auth error:", err);
      let msg =
        err instanceof Error
          ? err.message
          : "An authentication error occurred.";
      if (
        msg.includes("auth/invalid-credential") ||
        msg.includes("auth/user-not-found")
      ) {
        msg =
          "Invalid email or password. Please try again or use Demo accounts.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg =
          "An account with this email already exists. Try signing in instead.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters long.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "merchant" | "supplier") => {
    setError(null);
    setLoading(true);
    try {
      await demoSignIn(role);
      setSuccessMsg(
        `Signed in as ${role === "merchant" ? "Demo Merchant" : "Demo Supplier"}!`,
      );
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      setError(
        "Demo sign-in failed. Make sure Firebase Emulator or credentials are set.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/20 text-slate-100">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 border-emerald-500/30 py-1 text-xs font-medium text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            MIZAN Souq Authentication
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
            {isSignUp ? "Create Business Account" : "Sign In to MIZAN Souq"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {isSignUp
              ? "Join Morocco's Darija-first intelligent procurement network"
              : "Manage daily sales, stockout alerts & collective orders"}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-800/80 p-1 border border-slate-700/50">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              !isSignUp
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              isSignUp
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {isSignUp && (
            <>
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Hassan Slimani"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Berrechid Central Grocery"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Business Role & Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrgType("MERCHANT")}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                      orgType === "MERCHANT"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <Store className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <div className="text-xs">Merchant</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Local Shop / Grocery
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrgType("SUPPLIER")}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                      orgType === "SUPPLIER"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <div className="text-xs">Supplier</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Wholesaler / Distributor
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. merchant.demo@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            {loading
              ? "Processing..."
              : isSignUp
                ? "Create Account & Continue"
                : "Sign In to Portal"}
          </button>
        </form>

        {/* Demo Fast Login Options */}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-[11px] font-medium text-center text-slate-400 mb-2.5 uppercase tracking-wider">
            ⚡ Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin("merchant")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-medium text-slate-200 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all"
            >
              <Store className="h-3.5 w-3.5 text-emerald-400" />
              Demo Merchant
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin("supplier")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-medium text-slate-200 hover:border-amber-500/60 hover:bg-amber-500/10 transition-all"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              Demo Supplier
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
