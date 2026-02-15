import { getAuthHeaders } from "@/helpers/auth.helpers";
import {
    acceptInviteData,
    acceptInviteResponse,
    allocateCreditsData,
    allocateCreditsResponse,
    createTeamData,
    createTeamResponse,
    Get_Teams_Response,
    inviteTeamData,
    inviteTeamResponse,
    removeTeamMemberData,
    removeTeamMemberResponse,
    TeamMember,
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

export const removeTeamMember = async (
    data: removeTeamMemberData
): Promise<removeTeamMemberResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.delete<removeTeamMemberResponse>(
            `${API_BASE_URL}/teams/remove-member/${data.id}`,
            {
                headers: getAuthHeaders(),
                data: {
                    team_id: data.team_id,
                    owner_id: data.owner_id,
                },
            }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to remove member. Please try again.",
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

export const allocateCreditsToMember = async (
    data: allocateCreditsData
): Promise<allocateCreditsResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.patch<allocateCreditsResponse>(
            `${API_BASE_URL}/teams/credits/allocate-credit/member/${data.id}`,
            {
                team_id: data.team_id,
                credits: data.credits,
            },
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to allocate credits. Please try again.",
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

export const reinviteTeamMember = async (
    data: inviteTeamData
): Promise<inviteTeamResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.post<inviteTeamResponse>(
            `${API_BASE_URL}/teams/reinvite`,
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
                    "Reinvite failed. Please try again.",
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

export const getTeamsByUserId = async (userId: string): Promise<Get_Teams_Response> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.get<Get_Teams_Response>(
            `${API_BASE_URL}/teams/my/${userId}`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch member teams. Please try again.",
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

export const updateTeamMemberRole = async ({
    teamId,
    memberId,
    roleName,
}: {
    teamId: string;
    memberId: string;
    roleName: string;
}): Promise<{ success: boolean; message: string; membership?: TeamMember }> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.patch<{ success: boolean; message: string; membership?: TeamMember }>(
            `${API_BASE_URL}/teams/member-role`,
            { teamId, memberId, roleName },
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to update member role. Please try again.",
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