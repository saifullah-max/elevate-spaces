import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  type: "credit_purchase" | "booking_payment";
  createdAt: string;
  stripeSessionId?: string;
  description: string;
}

interface PaymentsState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  loading: boolean;
  error: string | null;
  totalSpent: number;
}

const initialState: PaymentsState = {
  transactions: [],
  currentTransaction: null,
  loading: false,
  error: null,
  totalSpent: 0,
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (action.payload.status === "succeeded") {
        state.totalSpent += action.payload.amount;
      }
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      state.totalSpent = action.payload
        .filter((t) => t.status === "succeeded")
        .reduce((sum, t) => sum + t.amount, 0);
    },
    setCurrentTransaction: (
      state,
      action: PayloadAction<Transaction | null>
    ) => {
      state.currentTransaction = action.payload;
    },
    updateTransactionStatus: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const transaction = state.transactions.find(
        (t) => t.id === action.payload.id
      );
      if (transaction) {
        transaction.status = action.payload.status as
          | "pending"
          | "succeeded"
          | "failed";
      }
    },
  },
});

export const {
  setLoading,
  setError,
  addTransaction,
  setTransactions,
  setCurrentTransaction,
  updateTransactionStatus,
} = paymentsSlice.actions;
export default paymentsSlice.reducer;
