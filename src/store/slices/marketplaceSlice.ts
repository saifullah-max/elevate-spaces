import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Photographer {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  approved: boolean;
  rating?: number;
  totalBookings: number;
  hourlyRate?: number;
}

interface BookingRequest {
  id: string;
  photographerId: string;
  userId: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  scheduledDate: string;
  notes?: string;
  createdAt: string;
}

interface MarketplaceState {
  photographers: Photographer[];
  bookingRequests: BookingRequest[];
  currentPhotographer: Photographer | null;
  currentBooking: BookingRequest | null;
  loading: boolean;
  error: string | null;
  totalPhotographers: number;
}

const initialState: MarketplaceState = {
  photographers: [],
  bookingRequests: [],
  currentPhotographer: null,
  currentBooking: null,
  loading: false,
  error: null,
  totalPhotographers: 0,
};

const marketplaceSlice = createSlice({
  name: "marketplace",
  initialState,
  reducers: {
    setPhotographers: (state, action: PayloadAction<Photographer[]>) => {
      state.photographers = action.payload;
      state.totalPhotographers = action.payload.length;
    },
    addPhotographer: (state, action: PayloadAction<Photographer>) => {
      state.photographers.push(action.payload);
      state.totalPhotographers += 1;
    },
    setCurrentPhotographer: (
      state,
      action: PayloadAction<Photographer | null>
    ) => {
      state.currentPhotographer = action.payload;
    },
    updatePhotographer: (state, action: PayloadAction<Photographer>) => {
      const index = state.photographers.findIndex(
        (p) => p.id === action.payload.id
      );
      if (index !== -1) {
        state.photographers[index] = action.payload;
      }
    },
    setBookingRequests: (state, action: PayloadAction<BookingRequest[]>) => {
      state.bookingRequests = action.payload;
    },
    addBookingRequest: (state, action: PayloadAction<BookingRequest>) => {
      state.bookingRequests.unshift(action.payload);
    },
    setCurrentBooking: (state, action: PayloadAction<BookingRequest | null>) => {
      state.currentBooking = action.payload;
    },
    updateBookingStatus: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const booking = state.bookingRequests.find(
        (b) => b.id === action.payload.id
      );
      if (booking) {
        booking.status = action.payload.status as
          | "pending"
          | "accepted"
          | "rejected"
          | "completed";
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
  setPhotographers,
  addPhotographer,
  setCurrentPhotographer,
  updatePhotographer,
  setBookingRequests,
  addBookingRequest,
  setCurrentBooking,
  updateBookingStatus,
  setLoading,
  setError,
} = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
