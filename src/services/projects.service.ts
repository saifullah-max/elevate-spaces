import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";
import { CreateProjectData, ProjectResponse, ProjectsResponse } from "@/types/projects.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

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
            `${API_BASE_URL}/projects/my`,
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
