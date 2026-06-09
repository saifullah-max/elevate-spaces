import { clearAuthFromStorage } from "@/lib/auth.storage";

/**
 * Handle user logout
 * Clears Redux store and localStorage
 */
export const handleLogout = (dispatch: Function, router: any): void => {
  try {
    // Clear localStorage
    clearAuthFromStorage();

    // Clear Redux store (dispatch logout action)
    // dispatch(logout()); - This is done in the component

    // Optional: Call backend logout endpoint if needed
    // await fetch('/api/auth/logout', { method: 'POST' });

    // Redirect to sign-in
    router.push("/sign-in");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
