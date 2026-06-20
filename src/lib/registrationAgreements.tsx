import Link from "next/link";
import type { AgreementItem } from "@/components/AgreementChecklistModal";

// Single source of truth for the registration agreement checklist used by both
// the normal sign-up page and the accept-invite flow. Backend validation in
// `signupSchema` / `acceptInvitationService` matches this list.
export const REGISTRATION_AGREEMENTS: AgreementItem[] = [
  {
    id: "acceptTermsAndPrivacy",
    required: true,
    label: (
      <>
        I agree to the <Link href="/terms-of-use" className="text-indigo-600 hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</Link> and acknowledge that they constitute a legally binding agreement.
      </>
    ),
  },
  {
    id: "confirmAgeAndCapacity",
    required: true,
    label: "I confirm that I am at least eighteen (18) years old and legally capable of entering into a binding contract.",
  },
  {
    id: "confirmUploadRights",
    required: true,
    label: "I confirm that I have all necessary legal rights to upload any content submitted to the platform.",
  },
  {
    id: "acknowledgeAiLimitations",
    required: true,
    label: "I understand that AI-generated results may contain inaccuracies and are provided solely for marketing visualization purposes.",
  },
  {
    id: "acknowledgeCreditsPolicy",
    required: true,
    label: "I understand that subscription credits reset monthly, do not roll over, and expire if unused.",
  },
  {
    id: "acceptArbitrationWaiver",
    required: true,
    label: "I agree that any disputes will be resolved exclusively through binding arbitration on an individual basis and waive any right to participate in class actions or jury trials.",
  },
  {
    id: "acknowledgePhotographerDisclaimer",
    required: true,
    label: "I acknowledge that photographers are independent contractors and Elevate Spaces is not responsible for their services.",
  },
  {
    id: "promotionalCommunicationsOptIn",
    required: false,
    label: "I agree to receive promotional communications.",
  },
];

export type RegistrationAgreementValues = {
  acceptTermsAndPrivacy: boolean;
  confirmAgeAndCapacity: boolean;
  confirmUploadRights: boolean;
  acknowledgeAiLimitations: boolean;
  acknowledgeCreditsPolicy: boolean;
  acceptArbitrationWaiver: boolean;
  acknowledgePhotographerDisclaimer: boolean;
  promotionalCommunicationsOptIn: boolean;
};

export const initialRegistrationAgreements: Record<string, boolean> = {
  acceptTermsAndPrivacy: false,
  confirmAgeAndCapacity: false,
  confirmUploadRights: false,
  acknowledgeAiLimitations: false,
  acknowledgeCreditsPolicy: false,
  acceptArbitrationWaiver: false,
  acknowledgePhotographerDisclaimer: false,
  promotionalCommunicationsOptIn: false,
};

export const allRequiredAgreementsAccepted = (
  values: Record<string, boolean>
): boolean =>
  REGISTRATION_AGREEMENTS
    .filter((agreement) => agreement.required)
    .every((agreement) => Boolean(values[agreement.id]));
