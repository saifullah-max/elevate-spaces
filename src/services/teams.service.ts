import { getAuthHeaders } from "@/helpers/auth.helpers";
import {
    acceptInviteData,
    acceptInviteResponse,
    createTeamData,
    createTeamResponse,
    Get_Teams_Response,
    inviteTeamData,
    inviteTeamResponse,
} from "@/types/teams.types";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export const createTeam = async (
    data: createTeamData
): Promise<createTeamResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.post<createTeamResponse>(
            `${API_BASE_URL}/teams/create`,
            data,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Team creation failed. Please try again.",
            };
        }

        throw {
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Please try again.",
        };
    }
};

export const inviteTeamMember = async (
    data: inviteTeamData
): Promise<inviteTeamResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.post<inviteTeamResponse>(
            `${API_BASE_URL}/teams/invite`,
            data,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Invitation failed. Please try again.",
            };
        }

        throw {
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Please try again.",
        };
    }
};

export const getTeams = async (): Promise<Get_Teams_Response> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.get<Get_Teams_Response>(
            `${API_BASE_URL}/teams/my-teams`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch teams. Please try again.",
            };
        }

        throw {
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Please try again.",
        };
    }
};

export const acceptInvite = async (
    data: acceptInviteData
): Promise<acceptInviteResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.post<acceptInviteResponse>(
            `${API_BASE_URL}/teams/accept-invite`,
            data
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to accept invitation. Please try again.",
            };
        }

        throw {
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Please try again.",
        };
    }
};