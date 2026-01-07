import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
}

interface CreditsState {
  balance: number;
  packages: CreditPackage[];
  transactions: Array<{
    id: string;
    type: "purchase" | "usage";
    amount: number;
    createdAt: string;
    description: string;
  }>;
  loading: boolean;
  error: string | null;
}

const initialState: CreditsState = {
  balance: 0,
  packages: [],
  transactions: [],
  loading: false,
  error: null,
};

const creditsSlice = createSlice({
  name: "credits",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    decrementCredits: (state, action: PayloadAction<number>) => {
      state.balance = Math.max(0, state.balance - action.payload);
    },
    incrementCredits: (state, action: PayloadAction<number>) => {
      state.balance += action.payload;
    },
    setPackages: (state, action: PayloadAction<CreditPackage[]>) => {
      state.packages = action.payload;
    },
    addTransaction: (
      state,
      action: PayloadAction<{
        id: string;
        type: "purchase" | "usage";
        amount: number;
        createdAt: string;
        description: string;
      }>
    ) => {
      state.transactions.unshift(action.payload);
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
  setBalance,
  decrementCredits,
  incrementCredits,
  setPackages,
  addTransaction,
  setLoading,
  setError,
} = creditsSlice.actions;
export default creditsSlice.reducer;
