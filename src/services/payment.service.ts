import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export async function createCheckoutSession(params: {
    productKey: string;
    purchaseFor: "individual" | "team";
    teamId?: string;
    quantity?: number;
    confirmPlanChange?: boolean;
}): Promise<{ url: string }> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/payment/checkout-session`,
            params,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to start checkout";
            const err: any = new Error(message);
            const code = error.response?.data?.code;
            if (code) {
                err.code = code;
            }
            throw err;
        }
        throw error;
    }
}

export async function getUserCredits(): Promise<{
    currentBalance: number;
    recentPurchases: Array<{
        amount: number;
        price: number;
        status: string;
        completedAt: string | null;
        packageName: string | null;
    }>;
}> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/payment/credits`, {
            headers: getAuthHeaders()
        });
        return response.data.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || error.message || "Failed to fetch credits"
            );
        }
        throw error;
    }
}
