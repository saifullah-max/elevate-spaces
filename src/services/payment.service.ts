import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export async function createCheckoutSession(params: {
    productKey: string;
    uiUnitAmountUsd?: number;
    purchaseFor: "individual" | "team";
    teamId?: string;
    quantity?: number;
    confirmPlanChange?: boolean;
    seatAutoRenew?: boolean;
    autoRenewEnabled?: boolean;
    downgradeSeatTopUpUsdMonthly?: number;
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
            err.status = error.response?.status;
            const code = error.response?.data?.code;
            if (code) {
                err.code = code;
            }
            if (error.response?.data?.details) {
                err.details = error.response.data.details;
            }
            throw err;
        }
        throw error;
    }
}

export async function submitContactSalesRequest(params: {
    email: string;
    fullName?: string;
    message?: string;
    companyName?: string;
    teamSize?: string;
    billingPreference?: string;
    phone?: string;
    preferredContactMethod?: string;
    estimatedMonthlyCreditVolume?: string;
    primaryUseCase?: string;
    preferredStartDate?: string;
}): Promise<{ success: boolean; message: string }> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/payment/contact-sales`,
            params,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to send contact sales request";
            throw new Error(message);
        }
        throw error;
    }
}

export async function submitSupportRequest(params: {
    fullName?: string;
    companyName?: string;
    email: string;
    briefDescription: string;
    orderNumber?: string;
    additionalContext?: string;
    screenshots?: Array<{ filename: string; content: string; type?: string }>;
}): Promise<{ success: boolean; caseNumber?: string; message?: string }> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/payment/support-request`,
            params,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message || "Failed to send support request";
            throw new Error(message);
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

    const fallbackCredits = {
        currentBalance: 0,
        recentPurchases: [],
    };

    const headers = getAuthHeaders();
    if (!headers.Authorization) {
        return fallbackCredits;
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/payment/credits`, {
            headers,
        });
        return response.data.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                return fallbackCredits;
            }
            const message = error.response?.data?.message || error.message || "Failed to fetch credits";
            const err: any = new Error(message);
            err.status = error.response?.status;
            err.code = error.response?.data?.code;
            throw err;
        }
        throw error;
    }
}

export interface PaymentTransaction {
    id: string;
    type: string;
    scope?: "personal" | "team";
    packageName: string;
    credits: number;
    amount: number;
    billingCycle?: "monthly" | "annual" | "one_time";
    isExtraSeatPurchase?: boolean;
    seatUnits?: number;
    seatCapacityLabel?: string;
    teamId?: string | null;
    teamName?: string | null;
    status: string;
    autoRenewal: boolean;
    renewalCount: number;
    createdAt: string;
    completedAt: string | null;
    nextRenewalDate: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    stripeInvoiceId: string | null;
}

export interface PaymentInvoice {
    id: string;
    subscriptionId: string;
    invoiceNumber: string;
    packageName: string;
    credits: number;
    amount: number;
    scope?: "personal" | "team";
    planFor?: "personal" | "team";
    billingCycle?: "monthly" | "annual" | "one_time";
    teamName?: string | null;
    isExtraSeatPurchase?: boolean;
    seatUnits?: number;
    seatCapacityLabel?: string;
    autoRenewal?: boolean;
    dateSubscribed?: string | null;
    validTill?: string | null;
    stripeInvoicePdfUrl?: string | null;
    stripeInvoiceHostedUrl?: string | null;
    previewAvailable?: boolean;
    issueDate: string | null;
    dueDate: string | null;
    status: string;
    renewalNumber: number;
    nextBillingDate: string | null;
}

export interface PaymentSummary {
    summary: {
        totalPurchases: number;
        totalSpent: number;
        totalCredits: number;
        totalRenewals: number;
        averageTransactionValue: number;
    };
    breakdown: {
        completed: number;
        pending: number;
        failed: number;
        active: number;
        cancelled: number;
    };
    activeSubscriptions: Array<{
        id: string;
        package: string;
        credits: number;
        monthlyAmount: number;
        nextRenewal: string | null;
        renewals: number;
    }>;
    recentTransactions: Array<{
        id: string;
        package: string;
        amount: number;
        date: string | null;
    }>;
}

export async function getPaymentHistory(): Promise<{
    userId: string;
    totalTransactions: number;
    totalSpent: number;
    transactions: PaymentTransaction[];
}> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    const response = await axios.get(`${API_BASE_URL}/payments/history`, {
        headers: getAuthHeaders(),
    });

    return response.data.data;
}


export async function getInvoices(params?: {
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
}): Promise<{
    userId: string;
    totalInvoices: number;
    invoices: PaymentInvoice[];
}> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    const queryParams = {
        limit: params?.limit || 50,
        ...(params?.search && { search: params.search }),
        ...(params?.dateFrom && { dateFrom: params.dateFrom }),
        ...(params?.dateTo && { dateTo: params.dateTo }),
        ...(params?.minAmount !== undefined && { minAmount: params.minAmount }),
        ...(params?.maxAmount !== undefined && { maxAmount: params.maxAmount }),
    };

    const response = await axios.get(`${API_BASE_URL}/payments/invoices`, {
        headers: getAuthHeaders(),
        params: queryParams,
    });

    return response.data.data;
}

export async function getInvoicePreview(subscriptionId: string): Promise<{
    subscriptionId: string;
    invoiceId: string;
    html: string;
}> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    const response = await axios.get(
        `${API_BASE_URL}/payments/invoices/${subscriptionId}/preview`,
        {
            headers: getAuthHeaders(),
        }
    );

    return response.data.data;
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    const response = await axios.get(`${API_BASE_URL}/payments/summary`, {
        headers: getAuthHeaders(),
    });

    return response.data.data;
}

export async function cancelSubscription(subscriptionId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    subscriptionId: string;
    creditExpiresAt?: string;
    packageName?: string;
}> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`,
            { reason },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.error ||
                error.message ||
                "Failed to cancel subscription";
            throw new Error(message);
        }
        throw error;
    }
}
