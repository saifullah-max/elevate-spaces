import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DemoState {
  demoUploadsCount: number;
  demoLimitPerSession: number;
  isDemo: boolean;
  sessionId: string | null;
  lastDemoUploadTime: string | null;
  ipAddress: string | null;
  userLocation: {
    latitude: number | null;
    longitude: number | null;
  };
}

const initialState: DemoState = {
  demoUploadsCount: 0,
  demoLimitPerSession: 10,
  isDemo: true,
  sessionId: null,
  lastDemoUploadTime: null,
  ipAddress: null,
  userLocation: {
    latitude: null,
    longitude: null,
  },
};

const demoSlice = createSlice({
  name: "demo",
  initialState,
  reducers: {
    incrementDemoCount: (state) => {
      state.demoUploadsCount += 1;
      state.lastDemoUploadTime = new Date().toISOString();
    },
    setDemoUploadsCount: (state, action: PayloadAction<number>) => {
      state.demoUploadsCount = action.payload;
    },
    setIsDemo: (state, action: PayloadAction<boolean>) => {
      state.isDemo = action.payload;
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    setIPAddress: (state, action: PayloadAction<string>) => {
      state.ipAddress = action.payload;
    },
    setUserLocation: (
      state,
      action: PayloadAction<{ latitude: number; longitude: number }>
    ) => {
      state.userLocation = action.payload;
    },
    resetDemoCount: (state) => {
      state.demoUploadsCount = 0;
      state.lastDemoUploadTime = null;
    },
  },
});

export const {
  incrementDemoCount,
  setDemoUploadsCount,
  setIsDemo,
  setSessionId,
  setIPAddress,
  setUserLocation,
  resetDemoCount,
} = demoSlice.actions;
export default demoSlice.reducer;
