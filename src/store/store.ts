import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uploadsReducer from "./slices/uploadsSlice";
import creditsReducer from "./slices/creditsSlice";
import demoReducer from "./slices/demoSlice";
import paymentsReducer from "./slices/paymentsSlice";
import marketplaceReducer from "./slices/marketplaceSlice";
import adminReducer from "./slices/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    uploads: uploadsReducer,
    credits: creditsReducer,
    demo: demoReducer,
    payments: paymentsReducer,
    marketplace: marketplaceReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
