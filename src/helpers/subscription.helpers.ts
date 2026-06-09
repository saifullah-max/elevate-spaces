import { PaymentSummary } from "@/services/payment.service";
import { Team } from "@/types/teams.types";

const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function isSubscriptionEffectivelyActive(subscription: any): boolean {
    if (subscription.status && subscription.status !== "completed") {
        return false;
    }

    const now = new Date();

    // If not cancelled and auto-renew enabled, it's active
    if (!subscription.cancelledAt && subscription.autoRenewEnabled) {
        return true;
    }

    // If cancelled or auto-renew disabled, check if within 30-day grace period from completedAt
    if (subscription.completedAt) {
        const graceExpiry = new Date(new Date(subscription.completedAt).getTime() + GRACE_PERIOD_MS);
        return now < graceExpiry;
    }

    return false;
}

/**
 * Check if user has an active personal subscription for Pro or Pro+ plans (including grace period)
 */
export function userHasActivePersonalSubscription(paymentSummary: PaymentSummary | null): boolean {
    if (!paymentSummary?.activeSubscriptions || paymentSummary.activeSubscriptions.length === 0) {
        return false;
    }

    // Check if any active subscription is Pro or Pro+ (case-insensitive) and still within grace period
    return paymentSummary.activeSubscriptions.some(
        (sub: any) => {
            const pkg = String(sub.package || "").toLowerCase();
            const isPro = pkg === "plan_pro" || pkg === "plan_team" || pkg === "enterprise" || pkg.includes("pro") || pkg.includes("team");
            return isPro && isSubscriptionEffectivelyActive(sub);
        }
    );
}

/**
 * Check if a team has an active paid subscription (Pro or Pro+)
 */
export function teamHasActiveSubscription(team: Team | null | undefined): boolean {
    if (!team?.purchases || team.purchases.length === 0) {
        return false;
    }

    // Check if any purchase has status "completed" (meaning it's an active paid subscription)
    return team.purchases.some(purchase => purchase.status === "completed");
}

/**
 * Determine if user can use project linking based on credit source and subscription status
 */
export function canUserLinkProjects(
    creditSource: "personal" | "team",
    selectedTeam: Team | null | undefined,
    userPaymentSummary: PaymentSummary | null
): boolean {
    if (creditSource === "team") {
        // For team credits, the team must have an active subscription
        return teamHasActiveSubscription(selectedTeam);
    } else {
        // For personal credits, user must have an active personal subscription
        return userHasActivePersonalSubscription(userPaymentSummary);
    }
}

/**
 * Determine if user can use customize-styling feature (Pro/Pro+ required)
 * Considers personal subscriptions (including grace period) and team eligibility when provided
 */
export function canUserCustomizeStyling(
    creditSource: "personal" | "team",
    selectedTeam: Team | null | undefined,
    userPaymentSummary: PaymentSummary | null,
    teamEligibility?: any
): boolean {
    if (creditSource === "team") {
        // If we have teamEligibility from the server, rely on it (it includes owner fallback and grace expiry)
        if (teamEligibility) {
            return Boolean(
                teamEligibility.teamHasActivePurchase ||
                teamEligibility.ownerHasActivePersonal ||
                teamEligibility.userHasActivePersonal
            );
        }

        // Fallback: check team purchases directly
        return teamHasActiveSubscription(selectedTeam);
    }

    // Personal credits: user needs Pro/Pro+ and subscription effectively active
    return userHasActivePersonalSubscription(userPaymentSummary);
}
