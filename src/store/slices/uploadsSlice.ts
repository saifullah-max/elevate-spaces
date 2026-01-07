import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UploadedImage {
  id: string;
  originalUrl: string;
  stagedUrl: string;
  createdAt: string;
  isDemoImage: boolean;
  isPaid: boolean;
  processingStatus: "pending" | "completed" | "failed";
  prompt?: string;
}

interface UploadsState {
  uploads: UploadedImage[];
  currentUpload: UploadedImage | null;
  loading: boolean;
  error: string | null;
  totalUploads: number;
}

const initialState: UploadsState = {
  uploads: [],
  currentUpload: null,
  loading: false,
  error: null,
  totalUploads: 0,
};

const uploadsSlice = createSlice({
  name: "uploads",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUploads: (state, action: PayloadAction<UploadedImage[]>) => {
      state.uploads = action.payload;
      state.totalUploads = action.payload.length;
    },
    addUpload: (state, action: PayloadAction<UploadedImage>) => {
      state.uploads.unshift(action.payload);
      state.totalUploads += 1;
    },
    setCurrentUpload: (state, action: PayloadAction<UploadedImage | null>) => {
      state.currentUpload = action.payload;
    },
    updateUploadStatus: (
      state,
      action: PayloadAction<{
        id: string;
        status: "pending" | "completed" | "failed";
      }>
    ) => {
      const upload = state.uploads.find((u) => u.id === action.payload.id);
      if (upload) {
        upload.processingStatus = action.payload.status;
      }
      if (state.currentUpload?.id === action.payload.id) {
        state.currentUpload.processingStatus = action.payload.status;
      }
    },
    clearCurrentUpload: (state) => {
      state.currentUpload = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setUploads,
  addUpload,
  setCurrentUpload,
  updateUploadStatus,
  clearCurrentUpload,
} = uploadsSlice.actions;
export default uploadsSlice.reducer;
