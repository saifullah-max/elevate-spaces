// app/callback/page.tsx
import { Suspense } from "react";
import OAuthCallbackPage from "../(auth)/callback/page";

export default function CallbackWrapper() {
    return (
        <Suspense fallback={<div>Processing authentication...</div>}>
            <OAuthCallbackPage />
        </Suspense>
    );
}
