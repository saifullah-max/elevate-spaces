import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PhotographerApproval {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  documentsUrl?: string;
}

interface Analytics {
  totalAIProcessing: number;
  demoVsPaidUsage: {
    demo: number;
    paid: number;
  };
  totalRevenue: number;
  totalBookings: number;
  activeUsers: number;
  topPerformers?: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
}

interface AdminState {
  pendingApprovals: PhotographerApproval[];
  analytics: Analytics | null;
  creditPackages: Array<{
    id: string;
    name: string;
    credits: number;
    price: number;
    active: boolean;
  }>;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  pendingApprovals: [],
  analytics: null,
  creditPackages: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setPendingApprovals: (
      state,
      action: PayloadAction<PhotographerApproval[]>
    ) => {
      state.pendingApprovals = action.payload;
    },
    updateApprovalStatus: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const approval = state.pendingApprovals.find(
        (a) => a.id === action.payload.id
      );
      if (approval) {
        approval.status = action.payload.status as
          | "pending"
          | "approved"
          | "rejected";
      }
    },
    setAnalytics: (state, action: PayloadAction<Analytics>) => {
      state.analytics = action.payload;
    },
    setCreditPackages: (
      state,
      action: PayloadAction<
        Array<{
          id: string;
          name: string;
          credits: number;
          price: number;
          active: boolean;
        }>
      >
    ) => {
      state.creditPackages = action.payload;
    },
    updateCreditPackage: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        credits: number;
        price: number;
        active: boolean;
      }>
    ) => {
      const index = state.creditPackages.findIndex(
        (p) => p.id === action.payload.id
      );
      if (index !== -1) {
        state.creditPackages[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setPendingApprovals,
  updateApprovalStatus,
  setAnalytics,
  setCreditPackages,
  updateCreditPackage,
  setLoading,
  setError,
} = adminSlice.actions;
export default adminSlice.reducer;
