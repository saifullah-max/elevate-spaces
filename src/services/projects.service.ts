import axios from "axios";

import { getAuthHeaders } from "@/helpers/auth.helpers";
import { CreateProjectData, ProjectResponse, ProjectsResponse } from "@/types/projects.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export interface AddProjectPhotographerResponse {
    success: boolean;
    message: string;
}

export interface AddProjectPhotographerData {
    projectId: string;
    photographerId?: string;
    photographerEmail?: string;
}

export interface UpdateProjectNameData {
    projectId: string;
    name: string;
}

export const createProject = async (data: CreateProjectData): Promise<ProjectResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.post<ProjectResponse>(
            `${API_BASE_URL}/projects`,
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
                    "Failed to create project. Please try again.",
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

export const getMyProjects = async (): Promise<ProjectsResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.get<ProjectsResponse>(
            `${API_BASE_URL}/projects`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch projects. Please try again.",
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

export const updateProjectName = async (data: UpdateProjectNameData): Promise<ProjectResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.patch<ProjectResponse>(
            `${API_BASE_URL}/projects/${data.projectId}`,
            { name: data.name },
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to rename project. Please try again.",
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

export const deleteProject = async (projectId: string): Promise<{ success: boolean; message: string }> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.delete<{ success: boolean; message: string }>(
            `${API_BASE_URL}/projects/${projectId}`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to delete project. Please try again.",
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

export const getProjectImages = async (projectId: string): Promise<any> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.get<unknown>(
            `${API_BASE_URL}/projects/${projectId}/images`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch project images. Please try again.",
                status: error.response?.status,
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

/**
 * Fetch photographers assigned to a project.
 * `/projects` returns `members: []` even when a photographer is assigned, so this
 * dedicated endpoint is the source of truth for the current photographer.
 */
export const getProjectPhotographers = async (projectId: string): Promise<any> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.get<unknown>(
            `${API_BASE_URL}/projects/${projectId}/photographers`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw {
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch project photographers.",
                status: error.response?.status,
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

export const addProjectPhotographer = async (
    data: AddProjectPhotographerData
): Promise<AddProjectPhotographerResponse> => {
    try {
        if (!API_BASE_URL) {
            throw new Error("Backend API URL is not configured");
        }

        const response = await axios.post<AddProjectPhotographerResponse>(
            `${API_BASE_URL}/projects/${data.projectId}/photographers`,
            {
                photographerId: data.photographerId,
                photographerEmail: data.photographerEmail,
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
                    "Failed to add photographer to project. Please try again.",
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

export const removeProjectPhotographer = async (
    projectId: string,
    photographerId: string
): Promise<AddProjectPhotographerResponse> => {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured");
    }

    // Try known endpoint pattern first
    try {
        const response = await axios.delete<AddProjectPhotographerResponse>(
            `${API_BASE_URL}/projects/${projectId}/photographers/${photographerId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (err: unknown) {
        // If 404, attempt alternative endpoint formats used by some backends
        if (axios.isAxiosError(err) && err.response?.status === 404) {
            try {
                // Pattern: DELETE /projects/:projectId/photographers with body { photographerId }
                const response2 = await axios.delete<AddProjectPhotographerResponse>(
                    `${API_BASE_URL}/projects/${projectId}/photographers`,
                    { headers: getAuthHeaders(), data: { photographerId } }
                );
                return response2.data;
            } catch {
                // Try POST remove endpoint
                try {
                    const response3 = await axios.post<AddProjectPhotographerResponse>(
                        `${API_BASE_URL}/projects/${projectId}/photographers/remove`,
                        { photographerId },
                        { headers: getAuthHeaders() }
                    );
                    return response3.data;
                } catch (err3: unknown) {
                    if (axios.isAxiosError(err3)) {
                        throw {
                            message:
                                err3.response?.data?.message ||
                                err3.message ||
                                'Failed to remove photographer from project. Please try again.',
                        };
                    }
                    throw { message: err3 instanceof Error ? err3.message : 'Failed to remove photographer from project' };
                }
            }
        }

        if (axios.isAxiosError(err)) {
            throw {
                message:
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to remove photographer from project. Please try again.",
            };
        }

        throw {
            message: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
        };
    }
};
