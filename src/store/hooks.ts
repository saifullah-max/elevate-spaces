import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// Export pre-typed hooks for usage in components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth selectors
export const useAuth = () => useAppSelector((state) => state.auth);
export const useIsAuthenticated = () =>
  useAppSelector((state) => state.auth.isAuthenticated);
export const useAuthUser = () => useAppSelector((state) => state.auth.user);
export const useAuthToken = () => useAppSelector((state) => state.auth.token);

// Uploads selectors
export const useUploads = () => useAppSelector((state) => state.uploads);
export const useCurrentUpload = () =>
  useAppSelector((state) => state.uploads.currentUpload);
export const useUploadHistory = () =>
  useAppSelector((state) => state.uploads.uploads);

// Credits selectors
export const useCredits = () => useAppSelector((state) => state.credits);
export const useCreditBalance = () =>
  useAppSelector((state) => state.credits.balance);
export const useCreditPackages = () =>
  useAppSelector((state) => state.credits.packages);

// Demo selectors
export const useDemo = () => useAppSelector((state) => state.demo);
export const useDemoCount = () =>
  useAppSelector((state) => state.demo.demoUploadsCount);
export const useDemoLimit = () =>
  useAppSelector((state) => state.demo.demoLimitPerSession);
export const useIsDemoUser = () =>
  useAppSelector((state) => state.demo.isDemo);

// Payments selectors
export const usePayments = () => useAppSelector((state) => state.payments);
export const usePaymentTransactions = () =>
  useAppSelector((state) => state.payments.transactions);
export const useTotalSpent = () =>
  useAppSelector((state) => state.payments.totalSpent);

// Marketplace selectors
export const useMarketplace = () => useAppSelector((state) => state.marketplace);
export const usePhotographers = () =>
  useAppSelector((state) => state.marketplace.photographers);
export const useBookingRequests = () =>
  useAppSelector((state) => state.marketplace.bookingRequests);

// Admin selectors
export const useAdmin = () => useAppSelector((state) => state.admin);
export const usePendingApprovals = () =>
  useAppSelector((state) => state.admin.pendingApprovals);
export const useAnalytics = () =>
  useAppSelector((state) => state.admin.analytics);
