import React, { useState } from "react";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { AuthStatusHeader } from "../features/auth/AuthStatusHeader";
import {
  Store,
  Building2,
  Receipt,
  ShoppingBag,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function MainDashboard() {
  const { user, organizationId, orgType, role } = useAuth();
  const [activeTab, setActiveTab] = useState<"merchant" | "supplier" | "procurement">("merchant");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AuthStatusHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Firebase Auth & Data Foundation Active
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                MIZAN Souq Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Turning microbusiness evidence (Darija/French voice, receipts, WhatsApp screenshots) into clear decisions, supplier competition & collective orders.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 min-w-[240px] space-y-2 text-xs">
              <div className="text-slate-400 font-medium">Active Organization Context</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {orgType === "SUPPLIER" ? (
                  <Building2 className="h-4 w-4 text-amber-400" />
                ) : (
                  <Store className="h-4 w-4 text-emerald-400" />
                )}
                {organizationId}
              </div>
              <div className="flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                <span>Role: <strong className="text-emerald-400">{role}</strong></span>
                <span>Type: <strong className="text-amber-400">{orgType}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("merchant")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "merchant"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Store className="h-4 w-4" />
            Merchant Portal
          </button>
          <button
            onClick={() => setActiveTab("procurement")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "procurement"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Collective Purchasing Engine
          </button>
          <button
            onClick={() => setActiveTab("supplier")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "supplier"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Supplier Opportunities Portal
          </button>
        </div>

        {/* Tab Content Cards */}
        {activeTab === "merchant" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Daily Sales</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">12,500 MAD</div>
              <div className="text-[11px] text-emerald-400">1250000 centimes</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Expenses</span>
                <Receipt className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">8,300 MAD</div>
              <div className="text-[11px] text-slate-400">Confirmed purchases</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Profit</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">4,200 MAD</div>
              <div className="text-[11px] text-emerald-400/80">420000 centimes net</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Available Cash</span>
                <ShoppingBag className="h-4 w-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-white">6,100 MAD</div>
              <div className="text-[11px] text-teal-400">Safe reorder cash</div>
            </div>
          </div>
        )}

        {activeTab === "procurement" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Active Collective Order Opportunity</h3>
                <p className="text-slate-400 text-[11px]">Combining nearby shop demand to unlock wholesale prices</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-semibold border border-emerald-500/30">
                Saving 100 MAD (10000 centimes)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div className="text-slate-400 mb-1">Single Merchant Price</div>
                <div className="text-lg font-bold text-red-400 line-through">22.00 MAD / unit</div>
                <div className="text-[10px] text-slate-500">MOQ 10 | Delivery 30 MAD</div>
              </div>
              <div className="rounded-xl bg-emerald-950/30 p-4 border border-emerald-500/40">
                <div className="text-emerald-400 mb-1">Collective Group Price</div>
                <div className="text-lg font-bold text-emerald-300">18.50 MAD / unit</div>
                <div className="text-[10px] text-emerald-400/80">MOQ 50 | Free Bulk Delivery</div>
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div className="text-slate-400 mb-1">Combined Demand</div>
                <div className="text-lg font-bold text-white">55 Units</div>
                <div className="text-[10px] text-slate-400">20 your demand + 35 partners</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "supplier" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Aggregated Demand Opportunities</h3>
                <p className="text-slate-400 text-[11px]">Qualified consolidated demand without exposing merchant identities</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white text-sm">Cooking oil 1L (55 Units)</div>
                <div className="text-slate-400 text-[11px]">Location: Berrechid Center • 3 Merchants combined</div>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition-all">
                Submit Wholesale Quote <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
