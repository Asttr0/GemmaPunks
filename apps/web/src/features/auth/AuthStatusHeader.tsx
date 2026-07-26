import React, { useState } from "react";
import { useAuth } from "./auth-context";
import { AuthModal } from "./AuthModal";
import { LogOut, LogIn, Building2, Store, Sparkles } from "lucide-react";

export const AuthStatusHeader: React.FC = () => {
  const { user, organizationId, orgType, role, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-950/50">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                MIZAN Control
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                AI Financial Control
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Moroccan distribution intelligence
            </p>
          </div>
        </div>

        {/* Auth Status & Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Organization Pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 shadow-inner">
                {orgType === "SUPPLIER" ? (
                  <Building2 className="h-4 w-4 text-amber-400" />
                ) : (
                  <Store className="h-4 w-4 text-emerald-400" />
                )}
                <div>
                  <span className="font-semibold text-white">
                    {organizationId}
                  </span>
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                    {role}
                  </span>
                </div>
              </div>

              {/* User Email & Sign Out */}
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right text-xs">
                  <span className="font-medium text-slate-200">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Authenticated
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-950/40 hover:bg-emerald-500 active:bg-emerald-700 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In / Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </header>
  );
};
