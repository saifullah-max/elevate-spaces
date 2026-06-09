import SignInFormClient from "@/app/(auth)/sign-in/SignInFormClient";

type SearchParams = Record<string, string | string[] | undefined>;

const getFirstParam = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const initialOauthError = getFirstParam(params.error);
  const initialOauthProvider = getFirstParam(params.provider);

  return (
    <SignInFormClient
      initialOauthError={initialOauthError}
      initialOauthProvider={initialOauthProvider}
    />
  );
}
