"use client";

import { useEffect, useMemo, useState } from "react";
import { Bolt, Camera, Check } from "lucide-react";
import { createCheckoutSession, getPaymentSummary, type PaymentSummary } from "@/services/payment.service";
import { getTeams } from "@/services/teams.service";
import { userHasActivePersonalSubscription } from "@/helpers/subscription.helpers";
import { SupportRequestDialog } from "@/components/SupportRequestDialog";
import ContactSalesForm from "@/components/support/ContactSalesForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthGateModal from "@/components/AuthGateModal";
import type { Team } from "@/types/teams.types";
import { trackStartTrial } from "@/lib/analytics";
import { showInfo } from "./toastUtils";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { useRouter } from "next/navigation";

type Audience = "individual" | "team";
type Billing = "monthly" | "annual";

interface PlanConfig {
  id: "starter" | "pro" | "team" | "enterprise";
  name: string;
  tagline: string;
  monthly: number | "custom";
  annual: number | "custom";
  monthlyCredits: number | "custom";
  seats: number | "custom";
  productKey?: {
    monthly: string;
    annual: string;
  };
  bullets: string[];
  highlighted?: boolean;
  dark?: boolean;
  ctaLabel: string;
  contactSales?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For trying the product and light use",
    monthly: 29,
    annual: 25,
    monthlyCredits: 60,
    seats: 1,
    productKey: { monthly: "plan_starter", annual: "plan_starter_annual" },
    bullets: [
      "Best for first-time users and occasional projects",
      "Cost per credit: $0.48",
    ],
    ctaLabel: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For agents and freelancers",
    monthly: 69,
    annual: 62,
    monthlyCredits: 160,
    seats: 2,
    productKey: { monthly: "plan_pro", annual: "plan_pro_annual" },
    bullets: [
      "Add 1 extra user for $20/month",
      "Stage & customize multiple images in one batch",
      "Cost per credit: $0.43",
    ],
    highlighted: true,
    ctaLabel: "Get Started",
  },
  {
    id: "team",
    name: "Team",
    tagline: "For small teams and agencies",
    monthly: 139,
    annual: 125,
    monthlyCredits: 360,
    seats: 5,
    productKey: { monthly: "plan_team", annual: "plan_team_annual" },
    bullets: [
      "Add 1 extra user for $15/month",
      "Stage & customize multiple images in one batch",
      "Team access, shared usage, photo storage up to 1 month",
      "Cost per credit: $0.39",
    ],
    ctaLabel: "Get Team Plan",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For high volume teams, brokerages, and custom workflows",
    monthly: "custom",
    annual: "custom",
    monthlyCredits: "custom",
    seats: "custom",
    dark: true,
    contactSales: true,
    bullets: [
      "Best rates with annual commitment",
      "Built for teams of 6 or more",
      "Priority support & custom onboarding",
      "Volume discounts for larger annual commitments",
    ],
    ctaLabel: "Contact Sales",
  },
];

export default function Pricing() {
  const [audience, setAudience] = useState<Audience>("individual");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [extraCreditQty, setExtraCreditQty] = useState<number>(25);
  const [payPerImageQty, setPayPerImageQty] = useState<number>(1);
  const router = useRouter();

  const isAnnual = billing === "annual";
  const auth = useMemo(
    () => (typeof window !== "undefined" ? getAuthFromStorage() : null),
    []
  );
  const isLoggedIn = Boolean(auth?.token);
  const currentUserId = auth?.user?.id ?? null;

  const [ownedTeams, setOwnedTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [contactSalesOpen, setContactSalesOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  // Plan the guest clicked before signing in — resumed on auth success.
  const [pendingCheckout, setPendingCheckout] = useState<
    | { kind: "plan"; plan: PlanConfig; audience: Audience; billing: Billing }
    | { kind: "extra"; audience: Audience; quantity: number }
    | { kind: "ppi"; audience: Audience; quantity: number }
    | null
  >(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const s = await getPaymentSummary();
        setPaymentSummary(s);
      } catch {}
    })();
  }, [isLoggedIn]);

  const hasActiveSubscription = useMemo(
    () => userHasActivePersonalSubscription(paymentSummary),
    [paymentSummary]
  );

  const activeSubscriptionPerCreditUsd = useMemo(() => {
    if (!hasActiveSubscription) return null;
    const sub = paymentSummary?.activeSubscriptions?.find((s: any) => {
      const pkg = String(s.package || "").toLowerCase();
      return pkg.includes("plan_") || pkg.includes("pro") || pkg.includes("team") || pkg.includes("starter") || pkg === "enterprise";
    });
    const pkg = String(sub?.package || "").toLowerCase();
    // Match to a known plan to derive per-credit rate. Falls back to plan bullets.
    const rates: Record<string, number> = {
      plan_starter: 29 / 60,
      plan_pro: 69 / 160,
      plan_team: 139 / 360,
      plan_starter_annual: 300 / 720,
      plan_pro_annual: 744 / 1920,
      plan_team_annual: 1500 / 4320,
    };
    return rates[pkg] ?? null;
  }, [hasActiveSubscription, paymentSummary]);

  useEffect(() => {
    if (audience !== "team" || !isLoggedIn || !currentUserId) return;
    let cancelled = false;
    setTeamsLoading(true);
    (async () => {
      try {
        const res = await getTeams();
        if (cancelled) return;
        const mine = (res.teams || []).filter((t) => t.owner_id === currentUserId);
        setOwnedTeams(mine);
        setSelectedTeamId((prev) =>
          prev && mine.some((t) => t.id === prev) ? prev : mine[0]?.id ?? ""
        );
      } catch (err: any) {
        showInfo(err?.message || "Failed to load your teams");
        setOwnedTeams([]);
        setSelectedTeamId("");
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audience, isLoggedIn, currentUserId]);

  const priceOf = (p: PlanConfig) => (isAnnual ? p.annual : p.monthly);

  const requireTeamId = (): string | null => {
    if (audience !== "team") return null;
    if (teamsLoading) {
      showInfo("Loading your teams…");
      return null;
    }
    if (ownedTeams.length === 0) {
      showInfo("Create a team first — any teams you own will appear in the selector above.");
      return null;
    }
    if (!selectedTeamId) {
      showInfo("Please select a team to buy for.");
      return null;
    }
    return selectedTeamId;
  };

  const startCheckout = async (p: PlanConfig) => {
    if (!p.productKey) return;
    if (!isLoggedIn) {
      setPendingCheckout({ kind: "plan", plan: p, audience, billing });
      setAuthOpen(true);
      return;
    }
    let teamId: string | undefined;
    if (audience === "team") {
      const id = requireTeamId();
      if (!id) return;
      teamId = id;
    }
    const productKey = isAnnual ? p.productKey.annual : p.productKey.monthly;
    try {
      setLoadingKey(p.id);
      trackStartTrial(productKey, Number(priceOf(p)) || 0);
      const res = await createCheckoutSession({
        productKey,
        uiUnitAmountUsd: Number(priceOf(p)) || undefined,
        purchaseFor: audience,
        teamId,
      });
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      showInfo(err?.message || "Failed to start checkout");
    } finally {
      setLoadingKey(null);
    }
  };

  const buyExtra = async () => {
    if (!isLoggedIn) {
      setPendingCheckout({ kind: "extra", audience, quantity: extraCreditQty });
      setAuthOpen(true);
      return;
    }
    let teamId: string | undefined;
    if (audience === "team") {
      const id = requireTeamId();
      if (!id) return;
      teamId = id;
    }
    // With an active subscription, extra credits are billed at the plan's
    // per-credit rate via subscription_topup. Without one, the copy promises
    // the $1.50 / image pay-per-image rate, so route through pay_per_image.
    const productKey = hasActiveSubscription ? "subscription_topup" : "pay_per_image";
    try {
      setLoadingKey("extra");
      const res = await createCheckoutSession({
        productKey,
        purchaseFor: audience,
        quantity: extraCreditQty,
        teamId,
      });
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      showInfo(err?.message || "Failed to start checkout");
    } finally {
      setLoadingKey(null);
    }
  };

  const payPerImage = async () => {
    if (!isLoggedIn) {
      setPendingCheckout({ kind: "ppi", audience, quantity: payPerImageQty });
      setAuthOpen(true);
      return;
    }
    let teamId: string | undefined;
    if (audience === "team") {
      const id = requireTeamId();
      if (!id) return;
      teamId = id;
    }
    try {
      setLoadingKey("ppi");
      const res = await createCheckoutSession({
        productKey: "pay_per_image",
        purchaseFor: audience,
        quantity: payPerImageQty,
        teamId,
      });
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      showInfo(err?.message || "Failed to start checkout");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section id="pricing" className="bg-cream-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="text-center max-w-lg mx-auto mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-brand-900">
            Simple, transparent pricing
          </h2>
          <p className="text-cream-800/60 text-sm md:text-base mt-2">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        {/* Audience toggle */}
        <div className="flex justify-center gap-3 mb-3">
          <div className="inline-flex bg-white border border-cream-200 rounded-xl p-1">
            {(["individual", "team"] as Audience[]).map((a) => {
              const active = audience === a;
              return (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={
                    "px-4 py-2 rounded-lg text-xs font-semibold transition-all " +
                    (active ? "bg-brand-500 text-white" : "text-cream-800/60 hover:text-brand-900")
                  }
                >
                  {a === "individual" ? "Buy for Individual" : "Buy for Team"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team selector — only when buying for a team */}
        {audience === "team" && isLoggedIn && (
          <div className="flex justify-center mb-3">
            <div className="inline-flex flex-col items-center gap-1">
              <label className="text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider">
                Select team
              </label>
              {teamsLoading ? (
                <span className="text-xs text-cream-800/60 px-3 py-2">Loading your teams…</span>
              ) : ownedTeams.length === 0 ? (
                <span className="text-xs text-cream-800/60 px-3 py-2 text-center">
                  Any teams you own will show up here. Create a team to unlock team plans.
                </span>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="min-w-[220px] border border-cream-200 rounded-lg px-3 py-2 text-xs text-cream-800/80 bg-white"
                >
                  {ownedTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center gap-3 mb-8">
          <div className="inline-flex bg-white border border-cream-200 rounded-xl p-1">
            {(["monthly", "annual"] as Billing[]).map((b) => {
              const active = billing === b;
              return (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={
                    "px-4 py-2 rounded-lg text-xs font-semibold transition-all " +
                    (active ? "bg-brand-500 text-white" : "text-cream-800/60 hover:text-brand-900")
                  }
                >
                  {b === "monthly" ? "Monthly" : "Annual Billing"}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[11px] text-cream-800/50 max-w-xl mx-auto mb-10">
          If you change plans while already on a paid subscription, your current plan will be
          canceled and any unused credits will be transferred to your wallet. Each individual or
          team can have only one active subscription at a time.
        </p>

        {/* Plan grid */}
        <div
          className={
            "grid sm:grid-cols-2 gap-5 " +
            (audience === "team" ? "lg:grid-cols-3" : "lg:grid-cols-4")
          }
        >
          {PLANS.filter((p) => !(audience === "team" && p.id === "starter")).map((p) => {
            const price = priceOf(p);
            const isDark = Boolean(p.dark);
            const isHighlighted = Boolean(p.highlighted);
            const isBusy = loadingKey === p.id;
            const cardCls = isDark
              ? "bg-brand-900 text-white rounded-2xl p-6 flex flex-col relative"
              : isHighlighted
              ? "bg-white border-2 border-accent-500 rounded-2xl p-6 flex flex-col relative"
              : "bg-white border border-cream-200 rounded-2xl p-6 flex flex-col relative";
            const btnCls = isDark
              ? "bg-white text-brand-900 hover:bg-cream-100 text-xs font-semibold py-2.5 rounded-lg transition-colors mb-5"
              : isHighlighted
              ? "bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors mb-5"
              : "bg-brand-100 hover:bg-brand-500 hover:text-white text-brand-500 text-xs font-semibold py-2.5 rounded-lg transition-colors mb-5";
            const bulletTextCls = isDark ? "text-white/70" : "text-cream-800/70";
            const bulletIconCls = isDark ? "text-accent-400" : "text-brand-500";

            return (
              <div key={p.id} className={cardCls}>
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ⭐ Most Popular
                  </span>
                )}
                <h3 className="font-bold text-sm mb-1">{p.name}</h3>
                <p className={"text-xs mb-4 " + (isDark ? "text-white/60" : "text-cream-800/50")}>
                  {p.tagline}
                </p>
                <div className="font-display text-3xl font-bold mb-1">
                  {typeof price === "number" ? (
                    <>
                      ${price}
                      <span
                        className={
                          "text-sm font-medium " + (isDark ? "text-white/50" : "text-cream-800/50")
                        }
                      >
                        {isAnnual ? " /mo billed annually" : " /mo"}
                      </span>
                    </>
                  ) : (
                    "Custom"
                  )}
                </div>
                <p className={"text-xs mb-5 " + (isDark ? "text-white/60" : "text-cream-800/60")}>
                  {typeof p.monthlyCredits === "number"
                    ? `${p.monthlyCredits} photos per month · ${p.seats} seat${p.seats === 1 ? "" : "s"}`
                    : "Custom volume & seats"}
                </p>
                <button
                  onClick={() =>
                    p.contactSales ? setContactSalesOpen(true) : startCheckout(p)
                  }
                  disabled={isBusy}
                  className={btnCls + " disabled:opacity-60 disabled:cursor-not-allowed"}
                >
                  {isBusy ? "Loading…" : p.ctaLabel}
                </button>
                <ul className={"text-xs space-y-2 mt-auto " + bulletTextCls}>
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-1.5">
                      <Check className={"w-3 h-3 mt-0.5 shrink-0 " + bulletIconCls} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Buy Extra + Pay Per Image */}
        <div className="mt-8 grid sm:grid-cols-2 gap-5">
          <div className="bg-white border border-cream-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-500 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1 text-brand-900">Buy Extra Credits</h3>
              <p className="text-xs text-cream-800/60 mb-3">
                {hasActiveSubscription && activeSubscriptionPerCreditUsd
                  ? `Billed at your plan's rate: $${activeSubscriptionPerCreditUsd.toFixed(2)} / credit (${extraCreditQty} credits ≈ $${(activeSubscriptionPerCreditUsd * extraCreditQty).toFixed(2)}).`
                  : hasActiveSubscription
                  ? "Billed at your plan's per-credit rate."
                  : "Without an active subscription, extra credits are billed at the $1.50 / image pay-per-image rate."}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={extraCreditQty}
                  onChange={(e) => setExtraCreditQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50"
                />
                <button
                  onClick={buyExtra}
                  disabled={loadingKey === "extra"}
                  className="bg-brand-100 hover:bg-brand-500 hover:text-white text-brand-500 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {loadingKey === "extra" ? "Loading…" : "Buy Extra Credits"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-cream-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-500 flex items-center justify-center shrink-0">
              <Bolt className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-brand-900">Pay Per Image</h3>
                <span className="bg-accent-500/10 text-accent-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Save More
                </span>
              </div>
              <p className="text-xs text-cream-800/60 mb-3">
                Flexible usage starting from{" "}
                <span className="text-brand-500 font-semibold">$1.50</span> / image.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={payPerImageQty}
                  onChange={(e) => setPayPerImageQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50"
                />
                <button
                  onClick={payPerImage}
                  disabled={loadingKey === "ppi"}
                  className="bg-brand-100 hover:bg-brand-500 hover:text-white text-brand-500 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {loadingKey === "ppi" ? "Loading…" : "Pay Per Image"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-[11px] text-cream-800/50">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-brand-500" /> Cancel anytime
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-brand-500" /> Secure payments
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-brand-500" /> Commercial use included
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-brand-500" /> Satisfaction guaranteed
          </span>
        </div>
        <p className="text-center text-[11px] text-cream-800/40 mt-4">
          Prices are in USD. Standard taxes apply. Need help?{" "}
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="underline hover:text-brand-500"
          >
            Contact Support
          </button>{" "}
          — typical response time within 24 hours.
        </p>
      </div>

      <AuthGateModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingCheckout(null);
        }}
        onSuccess={async () => {
          setAuthOpen(false);
          const pending = pendingCheckout;
          setPendingCheckout(null);
          if (!pending) return;

          // Team purchases still need a team the new user owns; without one,
          // route them home to create one instead of a dead-end error toast.
          if (pending.audience === "team") {
            showInfo("Create a team first, then continue your Team plan purchase.");
            router.push("/teams");
            return;
          }

          try {
            if (pending.kind === "plan") {
              const productKey =
                pending.billing === "annual"
                  ? pending.plan.productKey!.annual
                  : pending.plan.productKey!.monthly;
              const price =
                pending.billing === "annual" ? pending.plan.annual : pending.plan.monthly;
              setLoadingKey(pending.plan.id);
              const res = await createCheckoutSession({
                productKey,
                uiUnitAmountUsd: Number(price) || undefined,
                purchaseFor: pending.audience,
              });
              if (res?.url) window.location.href = res.url;
            } else if (pending.kind === "extra") {
              setLoadingKey("extra");
              const key = hasActiveSubscription ? "subscription_topup" : "pay_per_image";
              const res = await createCheckoutSession({
                productKey: key,
                purchaseFor: pending.audience,
                quantity: pending.quantity,
              });
              if (res?.url) window.location.href = res.url;
            } else if (pending.kind === "ppi") {
              setLoadingKey("ppi");
              const res = await createCheckoutSession({
                productKey: "pay_per_image",
                purchaseFor: pending.audience,
                quantity: pending.quantity,
              });
              if (res?.url) window.location.href = res.url;
            }
          } catch (err: any) {
            showInfo(err?.message || "Failed to start checkout");
          } finally {
            setLoadingKey(null);
          }
        }}
      />

      <SupportRequestDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
        defaultFullName={auth?.user?.name || ""}
        defaultEmail={auth?.user?.email || ""}
      />

      <Dialog open={contactSalesOpen} onOpenChange={setContactSalesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Sales — Enterprise plan</DialogTitle>
          </DialogHeader>
          <ContactSalesForm onClose={() => setContactSalesOpen(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
