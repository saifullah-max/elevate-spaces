"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { showInfo } from './toastUtils';
import { toast } from 'react-toastify';
import { Check, X, Building, Camera, Users, Zap, Home } from 'lucide-react';
import { createCheckoutSession, getPaymentSummary, getUserCredits } from '@/services/payment.service';
import ContactSalesForm from '@/components/support/ContactSalesForm';
import SupportModalTrigger from '@/components/support/SupportModalTrigger';
import { getTeams, cancelInvitation, removeTeamMember } from '@/services/teams.service';
import { getAuthFromStorage } from '@/lib/auth.storage';
import { AgreementItem } from './AgreementChecklistModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Team } from '@/types/teams.types';

type DowngradeRemovalCandidate = {
  teamId: string;
  kind: 'member' | 'invite';
  id: string;
  email: string | null;
  name: string | null;
  roleName: string | null;
  joinedAt: string | null;
};

type TeamSeatPolicy = {
  includedGeneralSeats: number;
  includedPhotographerSeats: number;
  extraSeatPriceUsdMonthly: number | null;
};

type TeamDowngradeImpact = {
  teamId: string;
  teamName: string;
  pendingInvitesCount: number;
  requiredRemovalCount: number;
  removalCandidates: DowngradeRemovalCandidate[];
  protectedPaidSeats: Array<{
    id: string;
    email: string | null;
    name: string | null;
    roleName: string | null;
    seatExpiresAt: string | null;
  }>;
  protectedSeatTopUpUsdMonthly: number;
};

type DowngradeSeatImpact = {
  activeGeneralMembers: number;
  activePhotographerMembers: number;
  pendingGeneralInvites: number;
  pendingPhotographerInvites: number;
  paidExtraSeatCount: number;
  paidExtraSeatMonthlyTopUpUsd: number | null;
  currentExtraSeatPriceUsdMonthly: number | null;
  targetExtraSeatPriceUsdMonthly: number | null;
  requiredRemovalCount: number;
  requiredGeneralRemovals: number;
  requiredPhotographerRemovals: number;
  targetGeneralSeats: number;
  targetPhotographerSeats: number;
  extraSeatPriceUsdMonthly: number | null;
  extraSeatProductKey: string | null;
  removalCandidates: DowngradeRemovalCandidate[];
  protectedPaidSeats: Array<{
    id: string;
    email: string | null;
    name: string | null;
    roleName: string | null;
    seatExpiresAt: string | null;
  }>;
};

const CURRENT_EXTRA_SEAT_PRICE_BY_PRODUCT_KEY: Record<string, number> = {
  pro_extra_user_seat: 20,
  team_extra_user_seat: 15,
};

function getTargetSeatPolicy(productKey?: string | null): TeamSeatPolicy | null {
  switch (String(productKey || '').toLowerCase()) {
    case 'plan_pro':
    case 'plan_pro_annual':
      return {
        includedGeneralSeats: 2,
        includedPhotographerSeats: 2,
        extraSeatPriceUsdMonthly: 20,
      };
    case 'plan_team':
    case 'plan_team_annual':
      return {
        includedGeneralSeats: 5,
        includedPhotographerSeats: 3,
        extraSeatPriceUsdMonthly: 15,
      };
    default:
      return null;
  }
}

function parseDateOrZero(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
}

const PricingPage = () => {
  const FIRST_PAYMENT_AGREEMENTS: AgreementItem[] = [
    {
      id: 'authorizeCharges',
      required: true,
      label: 'I authorize Elevate Spaces and its third-party payment processors to charge my payment method.',
    },
    {
      id: 'creditsNonRefundable',
      required: true,
      label: 'I understand that credits expire at the end of each billing cycle and are non-refundable.',
    },
    // {
    //   id: 'marketplaceTermsAcknowledged',
    //   required: true,
    //   label: 'I acknowledge that marketplace payments and photographer payouts are subject to platform terms and dispute resolution procedures.',
    // },
  ];

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [purchaseFor, setPurchaseFor] = useState<'individual' | 'team'>('individual');
  const [teamId, setTeamId] = useState('');
  const [ownedTeams, setOwnedTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [topUpCredits, setTopUpCredits] = useState(25);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planChangePending, setPlanChangePending] = useState<null | { productKey: string; qty?: number }>(null);
  const [pendingSeatImpact, setPendingSeatImpact] = useState<DowngradeSeatImpact | null>(null);
  const [showPlanChangeConfirmDialog, setShowPlanChangeConfirmDialog] = useState(false);
  const [showManageInvitesModal, setShowManageInvitesModal] = useState(false);
  const [downgradeRemovalCandidates, setDowngradeRemovalCandidates] = useState<DowngradeRemovalCandidate[]>([]);
  const [paidExtraSeatMembers, setPaidExtraSeatMembers] = useState<DowngradeSeatImpact['protectedPaidSeats']>([]);
  const [pendingTargetPlanKey, setPendingTargetPlanKey] = useState<string | null>(null);
  const [downgradeSelectedTeamId, setDowngradeSelectedTeamId] = useState<string>('');
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [hasPriorStagingPurchase, setHasPriorStagingPurchase] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [showSubscriptionTip, setShowSubscriptionTip] = useState(false);
  const [requiresFirstPaymentAgreements, setRequiresFirstPaymentAgreements] = useState(true);
  const [showFirstPaymentModal, setShowFirstPaymentModal] = useState(false);
  const [firstPaymentAgreementError, setFirstPaymentAgreementError] = useState<string | null>(null);
  const [pendingCheckoutAfterAgreement, setPendingCheckoutAfterAgreement] = useState<null | {
    productKey: string;
    qty?: number;
    confirmPlanChange?: boolean;
  }>(null);
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  const [firstPaymentAgreements, setFirstPaymentAgreements] = useState<Record<string, boolean>>({
    authorizeCharges: false,
    creditsNonRefundable: false,
    marketplaceTermsAcknowledged: false,
  });

  const [autoRenewEnabled, setAutoRenewEnabled] = useState(false);
  const [ownedTeamDetails, setOwnedTeamDetails] = useState<Team[]>([]);

  const isAnnual = billingCycle === 'annual';
  const starterProductKey = isAnnual ? 'plan_starter_annual' : 'plan_starter';
  const proProductKey = isAnnual ? 'plan_pro_annual' : 'plan_pro';
  const teamProductKey = isAnnual ? 'plan_team_annual' : 'plan_team';

  const starterPrice = isAnnual ? 25 : 29;
  const proPrice = isAnnual ? 62 : 69;
  const teamPrice = isAnnual ? 125 : 139;

  const starterCredits = 60;
  const proCredits = 160;
  const teamCredits = 360;

  const starterPerCredit = isAnnual ? '0.42' : '0.48';
  const proPerCredit = isAnnual ? '0.39' : '0.43';
  const teamPerCredit = isAnnual ? '0.35' : '0.39';

  const billingLabel = isAnnual ? '/ month billed annually' : '/ month';
  const creditsLabel = 'photos per month';

  const hasAcceptedRequiredFirstPaymentAgreements = () => {
    return FIRST_PAYMENT_AGREEMENTS
      .filter((agreement) => agreement.required)
      .every((agreement) => Boolean(firstPaymentAgreements[agreement.id]));
  };

  const isSubscriptionPlanKey = (productKey: string) => {
    return productKey === 'plan_starter' || productKey === 'plan_starter_annual' || productKey === 'plan_pro' || productKey === 'plan_pro_annual' || productKey === 'plan_team' || productKey === 'plan_team_annual';
  };

  useEffect(() => {
    let isMounted = true;



    const loadOwnedTeams = async () => {
      try {
        setTeamsLoading(true);
        setTeamsError(null);
        const response = await getTeams();
        if (!isMounted) return;
        setOwnedTeamDetails(response.teams || []);
        const teams = (response.teams || []).map((team) => ({ id: team.id, name: team.name }));
        setOwnedTeams(teams);

        if (teams.length > 0 && !teamId) {
          setTeamId(teams[0].id);
        }
      } catch (error: any) {
        if (!isMounted) return;
        setOwnedTeams([]);
        setOwnedTeamDetails([]);
        setTeamsError(error?.message || 'Failed to load owned teams');
      } finally {
        if (isMounted) {
          setTeamsLoading(false);
        }
      }
    };

    const checkSubscriptionStatus = async () => {
      if (isMounted) {
        setEligibilityLoading(true);
      }

      const auth = getAuthFromStorage();
      if (!auth?.token) {
        if (isMounted) {
          setHasActiveSubscription(false);
          setHasPriorStagingPurchase(false);
          setEligibilityLoading(false);
        }
        return;
      }

      try {
        const credits = await getUserCredits();

        let hasCurrentActiveSubscription = false;
        try {
          const summary = await getPaymentSummary();
          hasCurrentActiveSubscription = (summary.activeSubscriptions?.length || 0) > 0;
        } catch (summaryError) {
        }

        const hasStagingPurchaseHistory = credits.recentPurchases?.some((purchase) => {
          if (purchase.status !== 'completed' || !purchase.packageName) {
            return false;
          }

          const packageName = purchase.packageName.toLowerCase();
          return (
            packageName.includes('staging') ||
            packageName.includes('starter') ||
            packageName.includes('pro') ||
            packageName.includes('team') ||
            packageName.includes('subscription') ||
            packageName.includes('pay per image')
          );
        }) || false;

        if (isMounted) {
          // Only treat a plan as active when backend marks it active now.
          setHasActiveSubscription(hasCurrentActiveSubscription);
          setHasPriorStagingPurchase(hasStagingPurchaseHistory);
          setRequiresFirstPaymentAgreements(!hasCurrentActiveSubscription);
        }
      } catch (error: any) {
        const isUnauthorized = error?.status === 401 || error?.message === 'Unauthorized';
        if (isUnauthorized) {
          if (isMounted) {
            setHasActiveSubscription(false);
            setHasPriorStagingPurchase(false);
            setRequiresFirstPaymentAgreements(true);
            setEligibilityLoading(false);
          }
          return;
        }
      } finally {
        if (isMounted) {
          setEligibilityLoading(false);
        }
      }
    };

    loadOwnedTeams();
    checkSubscriptionStatus();

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        void checkSubscriptionStatus();
      }
    };

    const handleWindowFocus = () => {
      void checkSubscriptionStatus();
    };

    window.addEventListener('visibilitychange', handleVisibilityRefresh);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityRefresh);
      window.removeEventListener('focus', handleWindowFocus);
      isMounted = false;
    };
  }, []);

  const selectedOwnedTeam = useMemo(() => {
    return ownedTeamDetails.find((team) => team.id === teamId) || null;
  }, [ownedTeamDetails, teamId]);

  const targetSeatPolicy = useMemo(() => {
    return getTargetSeatPolicy(pendingTargetPlanKey);
  }, [pendingTargetPlanKey]);

  const teamDowngradeImpacts = useMemo<Record<string, TeamDowngradeImpact>>(() => {
    if (!targetSeatPolicy) {
      return {};
    }

    const nowEpoch = Date.now();
    return ownedTeamDetails.reduce<Record<string, TeamDowngradeImpact>>((acc, team) => {
      const activeMembers = (team.members || []).filter((member) => !member.deleted_at);
      const pendingInvites = (team.teamInvites || []).filter((invite) => invite.status === 'PENDING');

      const protectedPaidSeats = activeMembers.filter((member) => {
        const hasPaidSeatSignal = Boolean(
          member.is_paid_extra_seat ||
          member.seat_payment_product_key ||
          member.seat_last_paid_at ||
          member.seat_auto_renew
        );
        if (!hasPaidSeatSignal) {
          return false;
        }
        return !member.seat_expires_at || parseDateOrZero(member.seat_expires_at) > nowEpoch;
      });

      const protectedIds = new Set(protectedPaidSeats.map((member) => member.id));
      const nonProtectedMembers = activeMembers.filter((member) => !protectedIds.has(member.id));

      const generalCandidates: DowngradeRemovalCandidate[] = [
        ...nonProtectedMembers
          .filter((member) => member.role?.name !== 'TEAM_PHOTOGRAPHER')
          .map((member) => ({
            teamId: team.id,
            kind: 'member' as const,
            id: member.id,
            email: member.user?.email || null,
            name: member.user?.name || null,
            roleName: member.role?.name || null,
            joinedAt: member.joined_at || null,
          })),
        ...pendingInvites
          .filter((invite) => invite.role?.name !== 'TEAM_PHOTOGRAPHER')
          .map((invite) => ({
            teamId: team.id,
            kind: 'invite' as const,
            id: invite.id,
            email: invite.email,
            name: null,
            roleName: invite.role?.name || null,
            joinedAt: invite.invited_at || null,
          })),
      ].sort((a, b) => parseDateOrZero(b.joinedAt) - parseDateOrZero(a.joinedAt));

      const photographerCandidates: DowngradeRemovalCandidate[] = [
        ...nonProtectedMembers
          .filter((member) => member.role?.name === 'TEAM_PHOTOGRAPHER')
          .map((member) => ({
            teamId: team.id,
            kind: 'member' as const,
            id: member.id,
            email: member.user?.email || null,
            name: member.user?.name || null,
            roleName: member.role?.name || null,
            joinedAt: member.joined_at || null,
          })),
        ...pendingInvites
          .filter((invite) => invite.role?.name === 'TEAM_PHOTOGRAPHER')
          .map((invite) => ({
            teamId: team.id,
            kind: 'invite' as const,
            id: invite.id,
            email: invite.email,
            name: null,
            roleName: invite.role?.name || null,
            joinedAt: invite.invited_at || null,
          })),
      ].sort((a, b) => parseDateOrZero(b.joinedAt) - parseDateOrZero(a.joinedAt));

      const requiredGeneralRemovals = Math.max(0, generalCandidates.length - targetSeatPolicy.includedGeneralSeats);
      const requiredPhotographerRemovals = Math.max(0, photographerCandidates.length - targetSeatPolicy.includedPhotographerSeats);
      const removalCandidates = [
        ...generalCandidates.slice(0, requiredGeneralRemovals),
        ...photographerCandidates.slice(0, requiredPhotographerRemovals),
      ];

      const protectedSeatTopUpUsdMonthly = protectedPaidSeats.reduce((sum, member) => {
        const currentPrice = member.seat_payment_product_key
          ? CURRENT_EXTRA_SEAT_PRICE_BY_PRODUCT_KEY[String(member.seat_payment_product_key)] || 0
          : 0;
        const targetPrice = targetSeatPolicy.extraSeatPriceUsdMonthly || 0;
        return sum + Math.max(0, targetPrice - currentPrice);
      }, 0);

      acc[team.id] = {
        teamId: team.id,
        teamName: team.name,
        pendingInvitesCount: pendingInvites.length,
        requiredRemovalCount: removalCandidates.length,
        removalCandidates,
        protectedPaidSeats: protectedPaidSeats.map((member) => ({
          id: member.id,
          email: member.user?.email || null,
          name: member.user?.name || null,
          roleName: member.role?.name || null,
          seatExpiresAt: member.seat_expires_at || null,
        })),
        protectedSeatTopUpUsdMonthly,
      };

      return acc;
    }, {});
  }, [ownedTeamDetails, targetSeatPolicy]);

  const exceededTeamIds = useMemo(() => {
    return Object.values(teamDowngradeImpacts)
      .filter((impact) => impact.requiredRemovalCount > 0)
      .map((impact) => impact.teamId);
  }, [teamDowngradeImpacts]);

  const totalProtectedSeatTopUpUsdMonthly = useMemo(() => {
    return Object.values(teamDowngradeImpacts).reduce((sum, impact) => sum + impact.protectedSeatTopUpUsdMonthly, 0);
  }, [teamDowngradeImpacts]);

  const totalRequiredRemovalsAcrossTeams = useMemo(() => {
    return Object.values(teamDowngradeImpacts).reduce((sum, impact) => sum + impact.requiredRemovalCount, 0);
  }, [teamDowngradeImpacts]);

  const activeDowngradeTeamId = downgradeSelectedTeamId || teamId;
  const activeDowngradeImpact = activeDowngradeTeamId ? teamDowngradeImpacts[activeDowngradeTeamId] : undefined;

  useEffect(() => {
    if (!showManageInvitesModal) {
      return;
    }

    if (downgradeSelectedTeamId && teamDowngradeImpacts[downgradeSelectedTeamId]) {
      return;
    }

    const preferredTeamId = exceededTeamIds[0] || teamId || ownedTeams[0]?.id || '';
    setDowngradeSelectedTeamId(preferredTeamId);
  }, [showManageInvitesModal, downgradeSelectedTeamId, teamDowngradeImpacts, exceededTeamIds, teamId, ownedTeams]);

  const getUiUnitAmountUsd = (productKey: string) => {
    switch (productKey) {
      case 'plan_starter':
      case 'plan_starter_annual':
        return starterPrice;
      case 'plan_pro':
      case 'plan_pro_annual':
        return proPrice;
      case 'plan_team':
      case 'plan_team_annual':
        return teamPrice;
      case 'pay_per_image':
        return 1.5;
      case 'extra_credits_50':
        return 22;
      case 'extra_credits_100':
        return 40;
      case 'furnishing_addon':
        return 39.99;
      default:
        return undefined;
    }
  };

  const startCheckout = async (productKey: string, qty?: number, confirmPlanChange?: boolean, skipAgreementModal?: boolean) => {
    const shouldRequireAgreementModal = isSubscriptionPlanKey(productKey) && !skipAgreementModal;

    if (shouldRequireAgreementModal && !hasAcceptedRequiredFirstPaymentAgreements()) {
      setFirstPaymentAgreementError('You must accept all required payment agreements to continue.');
      setPendingCheckoutAfterAgreement({ productKey, qty, confirmPlanChange });
      setShowFirstPaymentModal(true);
      return;
    }

    try {
      setErrorMessage(null);
      setLoadingKey(productKey);

      if (purchaseFor === 'team' && !teamId.trim()) {
        throw new Error('Team ID is required for team purchases');
      }

      const session = await createCheckoutSession({
        productKey,
        uiUnitAmountUsd: getUiUnitAmountUsd(productKey),
        purchaseFor,
        teamId: purchaseFor === 'team' ? teamId.trim() : undefined,
        quantity: qty,
        confirmPlanChange,
        autoRenewEnabled: isSubscriptionPlanKey(productKey) ? autoRenewEnabled : undefined,
        downgradeSeatTopUpUsdMonthly: confirmPlanChange && totalProtectedSeatTopUpUsdMonthly > 0 ? totalProtectedSeatTopUpUsdMonthly : undefined,
      });

      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      const isUnauthorized = err?.status === 401 || err?.code === 401 || err?.code === 'UNAUTHORIZED';
      if (isUnauthorized) {
        const loginMessage = 'Please log in first to buy a plan, buy extra credits, or pay per image.';
        toast.error(loginMessage, { autoClose: 5000 });
        setErrorMessage(loginMessage);
        setPlanChangePending(null);
        return;
      }

      if (err?.code === 'PLAN_CHANGE_CONFIRMATION_REQUIRED') {
        setPlanChangePending({ productKey, qty });
        const seatImpact = err?.details?.seatImpact as DowngradeSeatImpact | undefined;
        setPendingSeatImpact(seatImpact || null);
        setPendingTargetPlanKey(err?.details?.targetPlanKey || productKey);
        setDowngradeRemovalCandidates(seatImpact?.removalCandidates || []);
        setPaidExtraSeatMembers(seatImpact?.protectedPaidSeats || []);
        setDowngradeSelectedTeamId(teamId || '');
        setShowPlanChangeConfirmDialog(true);
        setShowManageInvitesModal(false);
        const downgradeNote = err?.details?.isDowngrade && seatImpact
          ? `Downgrading to ${err?.details?.targetPlanLabel || 'the selected plan'} may require removing members or cancelling pending invites in one or more teams. Paid extra seats are excluded from removals and keeping them requires an additional $${totalProtectedSeatTopUpUsdMonthly || seatImpact.paidExtraSeatMonthlyTopUpUsd || 0}/mo top-up. If you do nothing for 2 days, access will be cancelled and paid features will stop.`
          : null;
        setErrorMessage(downgradeNote || err?.message || 'Plan change confirmation required.');
        return;
      }
      setErrorMessage(err?.message || 'Checkout failed');
      setPlanChangePending(null);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleCancelInvite = async (inviteId: string, candidateTeamId?: string) => {
    const targetTeamId = candidateTeamId || activeDowngradeTeamId;
    if (!targetTeamId) {
      showInfo('Select a team first.');
      return;
    }

    try {
      setCancelingInviteId(inviteId);
      await cancelInvitation({ id: inviteId });
      setOwnedTeamDetails((previous) => previous.map((team) => {
        if (team.id !== targetTeamId) {
          return team;
        }
        return {
          ...team,
          teamInvites: (team.teamInvites || []).filter((invite) => invite.id !== inviteId),
        };
      }));
      showInfo('Invitation cancelled');
    } catch (e: any) {
      showInfo(e?.message || 'Failed to cancel invite');
    } finally {
      setCancelingInviteId(null);
    }
  };

  const handleConfirmFirstPaymentAgreements = async () => {
    if (!hasAcceptedRequiredFirstPaymentAgreements()) {
      setFirstPaymentAgreementError('You must accept all required payment agreements to continue.');
      return;
    }

    setFirstPaymentAgreementError(null);
    setShowFirstPaymentModal(false);

    if (pendingCheckoutAfterAgreement) {
      const { productKey, qty, confirmPlanChange } = pendingCheckoutAfterAgreement;
      setPendingCheckoutAfterAgreement(null);
      await startCheckout(productKey, qty, confirmPlanChange, true);
    }
  };

  const handleFirstPaymentAgreementToggle = (id: string, value: boolean) => {
    setFirstPaymentAgreements((previous) => ({
      ...previous,
      [id]: value,
    }));
    setFirstPaymentAgreementError(null);
  };

  const handleRemoveDowngradeMember = async (candidate: DowngradeRemovalCandidate) => {
    const targetTeam = ownedTeamDetails.find((team) => team.id === candidate.teamId);
    if (!targetTeam) {
      showInfo('Select a team first.');
      return;
    }

    try {
      setRemovingMemberId(candidate.id);
      await removeTeamMember({
        id: candidate.id,
        team_id: targetTeam.id,
        owner_id: targetTeam.owner_id,
      });
      setOwnedTeamDetails((previous) => previous.map((team) => {
        if (team.id !== targetTeam.id) {
          return team;
        }
        return {
          ...team,
          members: (team.members || []).filter((member) => member.id !== candidate.id),
        };
      }));
      showInfo('Member removed');
    } catch (error: any) {
      showInfo(error?.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleConfirmPlanChange = async () => {
    setShowPlanChangeConfirmDialog(false);

    const hasSeatReview = totalRequiredRemovalsAcrossTeams > 0 || Object.values(teamDowngradeImpacts).some((impact) => impact.pendingInvitesCount > 0);
    if (hasSeatReview) {
      setShowManageInvitesModal(true);
      return;
    }

    if (planChangePending) {
      await startCheckout(planChangePending.productKey, planChangePending.qty, true);
    }
  };

  const handleAutoRemoveAndProceed = async () => {
    if (!planChangePending) {
      return;
    }
    const allRemainingCandidates = Object.values(teamDowngradeImpacts)
      .flatMap((impact) => impact.removalCandidates);

    try {
      if (allRemainingCandidates.length > 0) {
        setLoadingKey(planChangePending.productKey);
        for (const candidate of allRemainingCandidates) {
          if (candidate.kind === 'invite') {
            await cancelInvitation({ id: candidate.id });
          } else {
            const targetTeam = ownedTeamDetails.find((team) => team.id === candidate.teamId);
            if (!targetTeam) {
              continue;
            }
            await removeTeamMember({
              id: candidate.id,
              team_id: targetTeam.id,
              owner_id: targetTeam.owner_id,
            });
          }
        }
        const refreshedTeamsResponse = await getTeams();
        const refreshedTeams = refreshedTeamsResponse.teams || [];
        setOwnedTeamDetails(refreshedTeams);
        setOwnedTeams(refreshedTeams.map((team) => ({ id: team.id, name: team.name })));
      }

      setShowManageInvitesModal(false);
      setErrorMessage(null);
      setPlanChangePending(null);
      setDowngradeRemovalCandidates([]);
      setPaidExtraSeatMembers([]);
      await startCheckout(planChangePending.productKey, planChangePending.qty, true);
    } catch (error: any) {
      showInfo(error?.message || 'Failed to auto-remove seats before continuing');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleOpenContactSales = () => {
    setShowContactSalesModal(true);
  };

  const isTeamCheckoutDisabled = purchaseFor === 'team' && !teamId.trim();
  const isPhysicalStagingAddonEligible = hasActiveSubscription && hasPriorStagingPurchase;
  const physicalStagingEligibilityText = eligibilityLoading
    ? null
    : !hasActiveSubscription
      ? 'Requires an active subscription plan.'
      : !hasPriorStagingPurchase
        ? 'Available only after you have already used Elevate Spaces staging services.'
        : null;
  const extraCreditsProductKey = hasActiveSubscription ? 'subscription_topup' : 'pay_per_image';
  return (
    <div id="pricing" className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-350uto">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-2">
            Pricing Plans
          </h2>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Professional Real Estate Media Solutions
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the right plan for your workflow and your teams.
          </p>
          <div className="mt-8 inline-flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPurchaseFor('individual')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${purchaseFor === 'individual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
              >
                Buy for Individual
              </button>
              <button
                onClick={() => setPurchaseFor('team')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${purchaseFor === 'team' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
              >
                Buy for Team
              </button>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold ${billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
              >
                Annual Billing
              </button>
            </div>
            {purchaseFor === 'team' && (
              <div className="w-64">
                {teamsLoading ? (
                  <div className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 text-left">
                    Loading owned teams...
                  </div>
                ) : ownedTeams.length > 0 ? (
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${teamDowngradeImpacts[teamId]?.requiredRemovalCount > 0 ? 'border-red-300 text-red-700' : 'border-slate-200'}`}
                  >
                    {ownedTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {teamDowngradeImpacts[team.id]?.requiredRemovalCount > 0 ? `[EXCEEDED] ${team.name}` : team.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700 text-left">
                    {teamsError || 'No owned teams found. Create a team first to buy a team plan.'}
                  </div>
                )}
                {Object.values(teamDowngradeImpacts).some((impact) => impact.requiredRemovalCount > 0) ? (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-700">
                    {Object.values(teamDowngradeImpacts)
                      .filter((impact) => impact.requiredRemovalCount > 0)
                      .map((impact) => (
                        <button
                          key={impact.teamId}
                          type="button"
                          onClick={() => setTeamId(impact.teamId)}
                          className="mr-2 mb-1 inline-flex rounded-md border border-red-300 bg-white px-2 py-1 font-semibold text-red-700 hover:bg-red-100"
                        >
                          {impact.teamName}: {impact.requiredRemovalCount} over
                        </button>
                      ))}
                  </div>
                ) : null}
              </div>
            )}
            {errorMessage && (
              <div className="text-sm text-red-600 font-medium flex flex-col gap-2">
                <span>{errorMessage}</span>
                {planChangePending && (
                  <button
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 18px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 15,
                      width: 'fit-content',
                      alignSelf: 'flex-start',
                    }}
                    onClick={() => setShowPlanChangeConfirmDialog(true)}
                  >
                    Review seats before proceeding
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 max-w-3xl mx-auto rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            If you change plans while already on a paid subscription, your current plan will be canceled and any unused credits will be transferred to your wallet. Each individual or team can have only one active subscription at a time.
          </div>
          {isAnnual && (
            <div className="mt-3 max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              Annual plans are billed once per year at your discounted monthly-equivalent rate.
            </div>
          )}
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 xl:gap-6 items-start">

          {/* Card 1: Starter */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 xl:p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Starter</h3>
              <p className="text-sm text-slate-500 mt-2 h-10">For trying the product and light use</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">${starterPrice}</span>
              <span className="text-slate-500 ml-2">{billingLabel}</span>
            </div>
            <button
              onClick={() => startCheckout(starterProductKey)}
              disabled={isTeamCheckoutDisabled || loadingKey === starterProductKey}
              className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingKey === starterProductKey ? 'Processing...' : 'Get Started'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">{starterCredits} {creditsLabel}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Best for first time users and occasional projects</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">1 user only (owner seat)</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Cost per credit: ${starterPerCredit} </span>
              </li>
            </ul>
          </div>

          {/* Card 2: Pro (Most Popular) */}
          <div className="relative bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-4 xl:p-6 flex flex-col h-full transform lg:scale-105 z-10">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wider">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Pro</h3>
              <p className="text-sm text-slate-300 mt-2 h-10">For agents and freelancers</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${proPrice}</span>
              <span className="text-slate-400 ml-2">{billingLabel}</span>
            </div>
            <button
              onClick={() => startCheckout(proProductKey)}
              disabled={isTeamCheckoutDisabled || loadingKey === proProductKey}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-8 shadow-lg shadow-blue-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingKey === proProductKey ? 'Processing...' : 'Get Started'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">{proCredits} {creditsLabel}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Up to 2 users included</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Add 1 extra user for $20/month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Designed for consistent monthly usage</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Stage & customize multiple images in one batch</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Better value per photo than Starter</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Ideal for active agents and solo creators</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-slate-300">Cost per credit: ${proPerCredit} </span>
              </li>
            </ul>
          </div>

          {/* Card 3: Team */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 xl:p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Team</h3>
              <p className="text-sm text-slate-500 mt-2 h-10">For small teams and agencies</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">${teamPrice}</span>
              <span className="text-slate-500 ml-2">{billingLabel}</span>
            </div>
            <button
              onClick={() => startCheckout(teamProductKey)}
              disabled={isTeamCheckoutDisabled || loadingKey === teamProductKey}
              className="w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-900 font-semibold rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingKey === teamProductKey ? 'Processing...' : 'Get Team Plan'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">{teamCredits} {creditsLabel}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Up to 5 users included</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Add 1 extra user for $15/month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Built for higher volume workflows</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Stage & customize multiple images in one batch</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Team access and shared usage</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Easy photo sharing across projects</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Photo storage for up to one month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Best for teams managing multiple listings</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Cost per credit: ${teamPerCredit} </span>
              </li>
            </ul>
          </div>

          {/* Card 4: Enterprise */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 xl:p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
              <p className="text-sm text-slate-500 mt-2 h-10">For high volume teams, brokerages, and custom workflows</p>
            </div>
            <div className="mb-6 flex items-baseline">
              <span className="text-3xl font-bold text-slate-900">Custom monthly pricing</span>
            </div>
            <button
              className="w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-900 font-semibold rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors mb-8"
              onClick={handleOpenContactSales}
            >
              Contact Sales
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Best rates with annual commitment</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Built for teams of 6 or more</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">High volume monthly credits</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Shared usage across teams and projects</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Custom onboarding and setup</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Flexible plans built around your business</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Best for brokerages, agencies, and enterprise level usage</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Custom enterprise pricing based on volume and seats</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Seats: Included based on plan size</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">No limit on the number of teams you can create</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-slate-600">Volume discounts available for larger annual commitments</span>
              </li>
            </ul>
          </div>

        </div>

        {/* <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-4 xl:p-6">
          <h3 className="text-lg font-bold text-slate-900">Enterprise Pricing Ladder</h3>
          <p className="text-sm text-slate-600 mt-1">A smarter enterprise ladder that stays attractive without hurting margins.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="text-left py-2 pr-4 font-semibold">Credits</th>
                  <th className="text-left py-2 pr-4 font-semibold">Monthly Price</th>
                  <th className="text-left py-2 pr-4 font-semibold">Monthly Total</th>
                  <th className="text-left py-2 pr-4 font-semibold">Annual Price</th>
                  <th className="text-left py-2 pr-4 font-semibold">Annual Total</th>
                  <th className="text-left py-2 font-semibold">Included Seats</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4">500</td>
                  <td className="py-2 pr-4">$175</td>
                  <td className="py-2 pr-4">$0.35</td>
                  <td className="py-2 pr-4">$165</td>
                  <td className="py-2 pr-4">$0.33</td>
                  <td className="py-2">Up to 10 seats</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4">1,000</td>
                  <td className="py-2 pr-4">$340</td>
                  <td className="py-2 pr-4">$0.34</td>
                  <td className="py-2 pr-4">$325</td>
                  <td className="py-2 pr-4">$0.325</td>
                  <td className="py-2">Up to 15 seats</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4">2,000</td>
                  <td className="py-2 pr-4">$660</td>
                  <td className="py-2 pr-4">$0.33</td>
                  <td className="py-2 pr-4">$650</td>
                  <td className="py-2 pr-4">$0.325</td>
                  <td className="py-2">Up to 25 seats</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4">4,000</td>
                  <td className="py-2 pr-4">$1,280</td>
                  <td className="py-2 pr-4">$0.32</td>
                  <td className="py-2 pr-4">$1,260</td>
                  <td className="py-2 pr-4">$0.315</td>
                  <td className="py-2">Up to 40 seats</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4">8,000</td>
                  <td className="py-2 pr-4">$2,520</td>
                  <td className="py-2 pr-4">$0.315</td>
                  <td className="py-2 pr-4">$2,480</td>
                  <td className="py-2 pr-4">$0.31</td>
                  <td className="py-2">Up to 75 seats</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">10,000</td>
                  <td className="py-2 pr-4">$3,150</td>
                  <td className="py-2 pr-4">$0.315</td>
                  <td className="py-2 pr-4">$3,100</td>
                  <td className="py-2 pr-4">$0.31</td>
                  <td className="py-2">Up to 100 seats</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div> */}

        {/* <div className="mt-10">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900">Add-ons</h3>
            <p className="text-sm text-slate-600 mt-1">
              Available add-on services for customers with an active plan and prior staging usage.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 xl:p-6 flex flex-col">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Physical Staging Purchase Support</h4>
                  <p className="text-sm text-slate-500 mt-1">For users who want us to purchase physical items based on virtually staged images.</p>
                </div>
                <span className="text-blue-600 font-bold text-sm">Add-on</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 mb-6">
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                  <span>Share requirements by email via the <SupportModalTrigger className="text-blue-600 hover:underline">Support</SupportModalTrigger> page, or add us to your workflow by creating a team and inviting us before adding us to your project.</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                  <span>We can purchase requested furnishings on your behalf using your approved staging direction.</span>
                </li>
                <li className="flex items-start">
                  <X className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                  <span>No guarantee is provided for item availability, quality, fit, delivery outcomes, or exact visual match.</span>
                </li>
                <li className="flex items-start">
                  <X className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                  <span>On-site setup, installation, and arranging of items are not included in this add-on.</span>
                </li>
              </ul>

              <div className="mt-auto">
                <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  Eligibility: This add-on is available only if you currently have an active plan and have already used Elevate Spaces staging before. New users who have not tried staging yet are not eligible.
                </div>
                {eligibilityLoading ? (
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Checking subscription eligibility...
                  </div>
                ) : null}
                {physicalStagingEligibilityText ? (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {physicalStagingEligibilityText}
                  </div>
                ) : null}
                <button
                  onClick={() => startCheckout('furnishing_addon')}
                  disabled={eligibilityLoading || isTeamCheckoutDisabled || loadingKey === 'furnishing_addon' || !isPhysicalStagingAddonEligible}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingKey === 'furnishing_addon' ? 'Processing...' : 'Add Physical Staging Support'}
                </button>
              </div>
            </div>
          </div>
        </div> */}

        {/* Footer Options */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12">

            {/* Extra Credits */}
            <div className="flex items-center space-x-4 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Buy Extra Credits</h4>
                <p className="text-sm text-slate-600">
                  {hasActiveSubscription
                    ? "If you have an active subscription, buy any amount at your current plan's per-credit rate."
                    : "If you do not have an active subscription, extra credits are billed at the same $1.50 / image pay-per-image rate."}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={topUpCredits}
                    onChange={(e) => setTopUpCredits(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg"
                  />
                  <button
                    onClick={() => startCheckout(extraCreditsProductKey, topUpCredits)}
                    disabled={isTeamCheckoutDisabled || loadingKey === extraCreditsProductKey}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingKey === extraCreditsProductKey ? 'Processing...' : (hasActiveSubscription ? 'Buy at Plan Rate' : 'Buy Extra Credits')}
                  </button>
                </div>
              </div>
            </div>

            {/* Pay Per Image - Conditional Display */}
            {!hasActiveSubscription && (
              <div className="flex items-center space-x-4 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm relative">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">Pay Per Image</h4>
                    <button
                      onClick={() => setShowSubscriptionTip(!showSubscriptionTip)}
                      className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition font-semibold"
                    >
                      💡 Save More
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Flexible usage starting from <span className="font-semibold text-blue-600">$1.50</span> / image
                  </p>
                  {showSubscriptionTip && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-900 font-semibold mb-1">💰 Better Value with Subscription!</p>
                      <p className="text-xs text-green-800">
                        Subscribe for one month and get a lower price per image. Cancel anytime - no commitment required.
                      </p>
                      <p className="text-xs text-green-700 mt-2 font-semibold">Example: Starter is ${starterPerCredit}/image and Team is ${teamPerCredit}/image on this billing mode.</p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      onClick={() => startCheckout('pay_per_image', quantity)}
                      disabled={isTeamCheckoutDisabled || loadingKey === 'pay_per_image'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingKey === 'pay_per_image' ? 'Processing...' : 'Pay Per Image'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="text-center mt-8 text-slate-400 text-sm">
            Prices are in USD. Standard taxes apply. Need help? <SupportModalTrigger className="text-blue-500 hover:underline">Contact Support</SupportModalTrigger> or email <a href="mailto:hello@elevatespacesai.com" className="text-blue-500 hover:underline">hello@elevatespacesai.com</a> - typical response time within 24 hours.
          </div>
        </div>
        <Dialog open={showPlanChangeConfirmDialog} onOpenChange={setShowPlanChangeConfirmDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirm plan change</DialogTitle>
              <DialogDescription>
                {errorMessage || 'You already have an active subscription. Changing plans will cancel the current plan and transfer any unused credits to your wallet.'}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {pendingSeatImpact?.requiredRemovalCount || totalRequiredRemovalsAcrossTeams
                  ? 'If seat review is needed, you will be shown the team review dialog after confirming.'
                  : 'No seat review is required for this plan change.'}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanChangeConfirmDialog(false)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPlanChange}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Downgrade resolution modal */}
        <Dialog open={showManageInvitesModal} onOpenChange={setShowManageInvitesModal}>
          <DialogContent className="max-w-3xl h-[90vh] overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Resolve seats before downgrading</DialogTitle>
              <DialogDescription>
                Remove members or cancel invites that exceed the target plan. Paid extra seats are excluded from removals and can stay active with a monthly top-up.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              {pendingSeatImpact ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">{totalRequiredRemovalsAcrossTeams} seat holder(s) must be removed or cancelled across teams.</p>
                  <p className="mt-1">
                    {totalProtectedSeatTopUpUsdMonthly > 0
                      ? `Paid extra seats are protected and staying active requires an additional $${totalProtectedSeatTopUpUsdMonthly}/mo.`
                      : 'No paid extra seats are protected on this downgrade.'}
                  </p>
                  {totalRequiredRemovalsAcrossTeams > 0 ? (
                    <p className="mt-2 text-xs text-amber-800">
                      If you proceed without making changes, the latest {totalRequiredRemovalsAcrossTeams} seat holder(s) will be removed or cancelled to match capacity.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select team</label>
                <select
                  value={activeDowngradeTeamId}
                  onChange={(event) => setDowngradeSelectedTeamId(event.target.value)}
                  className={`mt-2 w-full rounded-md border px-3 py-2 text-sm ${activeDowngradeImpact?.requiredRemovalCount ? 'border-red-300 text-red-700' : 'border-slate-300 text-slate-900'}`}
                >
                  {ownedTeams.map((team) => {
                    const impact = teamDowngradeImpacts[team.id];
                    return (
                      <option key={team.id} value={team.id}>
                        {impact?.requiredRemovalCount ? `[EXCEEDED] ${team.name} (${impact.requiredRemovalCount} over)` : team.name}
                      </option>
                    );
                  })}
                </select>
                {exceededTeamIds.length > 0 ? (
                  <p className="mt-2 text-xs text-red-700">Exceeded teams are highlighted in red and can be selected here.</p>
                ) : null}
              </div>

              {activeDowngradeImpact?.protectedPaidSeats?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Protected paid extra seats</h3>
                  <div className="mt-2 space-y-2">
                    {activeDowngradeImpact.protectedPaidSeats.map((seat) => (
                      <div key={seat.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium text-slate-900">{seat.name || seat.email || 'Unnamed member'}</div>
                          <div className="text-xs text-slate-600">{seat.email || 'No email'}{seat.roleName ? ` · ${seat.roleName}` : ''}</div>
                        </div>
                        <div className="text-xs font-semibold text-emerald-700">Kept active</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Members to remove</h3>
                  <div className="mt-2 space-y-2">
                    {activeDowngradeImpact?.removalCandidates.filter((candidate) => candidate.kind === 'member').length ? (
                      activeDowngradeImpact.removalCandidates
                        .filter((candidate) => candidate.kind === 'member')
                        .map((candidate) => (
                          <div key={candidate.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-slate-900">{candidate.name || candidate.email || 'Unnamed member'}</div>
                                <div className="text-xs text-slate-500">{candidate.email || 'No email'}{candidate.roleName ? ` · ${candidate.roleName}` : ''}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveDowngradeMember(candidate)}
                                disabled={removingMemberId === candidate.id}
                                className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                {removingMemberId === candidate.id ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">No active members need to be removed.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Pending invites to cancel</h3>
                  <div className="mt-2 space-y-2">
                    {activeDowngradeImpact?.removalCandidates.filter((candidate) => candidate.kind === 'invite').length ? (
                      activeDowngradeImpact.removalCandidates
                        .filter((candidate) => candidate.kind === 'invite')
                        .map((candidate) => (
                          <div key={candidate.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-slate-900">{candidate.email || 'Unnamed invite'}</div>
                                <div className="text-xs text-slate-500">{candidate.joinedAt ? new Date(candidate.joinedAt).toLocaleDateString() : 'Pending invite'}{candidate.roleName ? ` · ${candidate.roleName}` : ''}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCancelInvite(candidate.id, candidate.teamId)}
                                disabled={cancelingInviteId === candidate.id}
                                className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                {cancelingInviteId === candidate.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">No pending invitations need to be cancelled.</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">All pending invitations on selected team</h3>
                <div className="mt-2 space-y-2">
                  {activeDowngradeTeamId && teamDowngradeImpacts[activeDowngradeTeamId] ? (
                    (ownedTeamDetails.find((team) => team.id === activeDowngradeTeamId)?.teamInvites || [])
                      .filter((invite) => invite.status === 'PENDING')
                      .map((invite) => (
                        <div key={invite.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-900">{invite.email}</div>
                              <div className="text-xs text-slate-500">{invite.invited_at ? new Date(invite.invited_at).toLocaleDateString() : 'Pending invite'}{invite.role?.name ? ` · ${invite.role.name}` : ''}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCancelInvite(invite.id, activeDowngradeTeamId)}
                              disabled={cancelingInviteId === invite.id}
                              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              {cancelingInviteId === invite.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ))
                  ) : null}
                  {activeDowngradeTeamId && (ownedTeamDetails.find((team) => team.id === activeDowngradeTeamId)?.teamInvites || []).filter((invite) => invite.status === 'PENDING').length === 0 ? (
                    <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">No pending invitations on this team.</div>
                  ) : null}
                </div>
              </div>

              {selectedOwnedTeam ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Team: <span className="font-semibold text-slate-900">{activeDowngradeImpact?.teamName || selectedOwnedTeam.name}</span>
                  {totalRequiredRemovalsAcrossTeams > 0 ? (
                    <span className="block mt-1 text-xs text-slate-500">
                      If you continue, the latest {totalRequiredRemovalsAcrossTeams} seat holder(s) across exceeded teams will be auto-removed/cancelled to match the lower plan.
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManageInvitesModal(false)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleAutoRemoveAndProceed}
                  disabled={!planChangePending || loadingKey === planChangePending?.productKey}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {totalRequiredRemovalsAcrossTeams > 0
                    ? `Proceed and auto-remove ${totalRequiredRemovalsAcrossTeams} remaining item${totalRequiredRemovalsAcrossTeams === 1 ? '' : 's'}`
                    : 'Proceed with downgrade'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      <Dialog open={showFirstPaymentModal} onOpenChange={setShowFirstPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Agreement</DialogTitle>
            <DialogDescription>Please accept the required agreements and choose your subscription preferences.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
            {/* Required Agreements */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Required Agreements</h3>
              <div className="space-y-4">
                {FIRST_PAYMENT_AGREEMENTS.map((agreement) => (
                  <label key={agreement.id} className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(firstPaymentAgreements[agreement.id])}
                      onChange={(event) => handleFirstPaymentAgreementToggle(agreement.id, event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>
                      {agreement.label}
                      {agreement.required ? <span className="ml-1 text-red-600">*</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-Renewal Option */}
            <div className="rounded-lg border border-slate-200 bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Subscription Preferences</h3>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={autoRenewEnabled}
                  onChange={(e) => setAutoRenewEnabled(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-slate-900">Enable auto-renewal</span>
                  <p className="mt-1 text-xs text-slate-600">
                    {autoRenewEnabled
                      ? "Your subscription will automatically renew at the end of each billing cycle. You can manage or cancel anytime from your account settings."
                      : "Your subscription will expire at the end of the current billing cycle. You'll need to manually renew to continue using the service."}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {firstPaymentAgreementError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {firstPaymentAgreementError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowFirstPaymentModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmFirstPaymentAgreements}
              disabled={!hasAcceptedRequiredFirstPaymentAgreements()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactSalesModal} onOpenChange={setShowContactSalesModal}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>Contact Sales</DialogTitle>
            <DialogDescription>
              Send your enterprise request and we'll reply by email.
            </DialogDescription>
          </DialogHeader>

          <ContactSalesForm onClose={() => setShowContactSalesModal(false)} />

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;