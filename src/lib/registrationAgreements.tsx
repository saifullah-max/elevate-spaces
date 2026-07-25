import Link from "next/link";
import type { AgreementItem } from "@/components/AgreementChecklistModal";

export const REGISTRATION_AGREEMENTS: AgreementItem[] = [
  {
    id: "acceptTermsAndPrivacy",
    required: true,
    label: (
      <>
        By continuing, I confirm I am 18+, have the right to upload content, and agree to the{" "}
        <Link href="https://www.elevatespacesai.com/terms-of-use" className="text-teal-500 hover:underline" target="_blank">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="https://www.elevatespacesai.com/privacy-policy" className="text-teal-500 hover:underline" target="_blank">
          Privacy Policy
        </Link>
        . AI-generated results are for visualization purposes only.
      </>
    ),
  },
  {
    id: "promotionalCommunicationsOptIn",
    required: false,
    label: "Send me staging tips, product updates, and inspiration.",
  },
];

export type RegistrationAgreementValues = {
  acceptTermsAndPrivacy: boolean;
  promotionalCommunicationsOptIn: boolean;
};

export const initialRegistrationAgreements: Record<string, boolean> = {
  acceptTermsAndPrivacy: false,
  promotionalCommunicationsOptIn: false,
};

export const allRequiredAgreementsAccepted = (
  values: Record<string, boolean>
): boolean =>
  REGISTRATION_AGREEMENTS
    .filter((agreement) => agreement.required)
    .every((agreement) => Boolean(values[agreement.id]));
