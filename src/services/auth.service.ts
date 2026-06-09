import { getAuthHeaders } from "@/helpers/auth.helpers";
import type { User, UserRole } from "@/store/slices/authSlice";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

// Type guard to validate role
const isValidUserRole = (role: unknown): role is UserRole => {
  return role === "USER" || role === "PHOTOGRAPHER" || role === "ADMIN";
};

interface SignUpData {
  name: string;
  email: string;
  password: string;
  fromDemoBonus?: boolean;
  requestedRole?: "USER" | "PHOTOGRAPHER";
  photographerProfile?: {
    bio?: string;
    availability?: string;
    photographerType?: string;
    yearsExperience?: string;
    serviceArea?: string;
    portfolioUrl?: string;
    instagramUrl?: string;
    websiteUrl?: string;
    gearDescription?: string;
    businessName?: string;
    shortPitch?: string;
  };
  registrationAgreements: {
    acceptTermsAndPrivacy: boolean;
    confirmAgeAndCapacity: boolean;
    confirmUploadRights: boolean;
    acknowledgeAiLimitations: boolean;
    acknowledgeCreditsPolicy: boolean;
    acceptArbitrationWaiver: boolean;
    acknowledgePhotographerDisclaimer: boolean;
    promotionalCommunicationsOptIn?: boolean;
  };
}

interface SignUpResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

interface SignInData {
  email: string;
  password: string;
}

// API response type (from backend - role can be any string)
interface AuthAPIResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string; // Backend returns string
    avatar_url?: string | null; // Backend uses snake_case
  };
}

// Type-safe responses
type SignUpAPIResponse = AuthAPIResponse;
type SignInResponse = { token: string; user: User };
type UpdateProfileImageResponse = { success: boolean; message: string; user: AuthAPIResponse["user"] };
type CurrentUserResponse = { success: boolean; user: AuthAPIResponse["user"] };

export const signUp = async (data: SignUpData): Promise<SignUpResponse> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured");
    }

    const response = await axios.post<SignUpAPIResponse>(
      `${API_BASE_URL}/auth/signup`,
      data
    );

    const { token, user: apiUser } = response.data;

    // Validate and cast role to UserRole type
    if (!isValidUserRole(apiUser.role)) {
      throw new Error(`Invalid user role received: ${apiUser.role}`);
    }

    const user: User = {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      role: apiUser.role, // Now guaranteed to be UserRole type
      avatarUrl: apiUser.avatar_url || null, // Map snake_case to camelCase
    };

    return {
      success: true,
      message: "Sign up successful",
      token,
      user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Sign up failed. Please try again.",
      };
    }
    throw {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
};

export const signIn = async (data: SignInData): Promise<SignInResponse> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured");
    }

    const response = await axios.post<AuthAPIResponse>(
      `${API_BASE_URL}/auth/login`,
      data
    );

    const { token, user: apiUser } = response.data;

    // Validate and cast role to UserRole type
    if (!isValidUserRole(apiUser.role)) {
      throw new Error(`Invalid user role received: ${apiUser.role}`);
    }

    const user: User = {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      role: apiUser.role, // Now guaranteed to be UserRole type
      avatarUrl: apiUser.avatar_url || null, // Map snake_case to camelCase
    };

    return {
      token,
      user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          "Sign in failed. Please try again.",
      };
    }
    throw {
      message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
};

export const getCurrentUserProfile = async (): Promise<User> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured");
    }

    const response = await axios.get<CurrentUserResponse>(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    const apiUser = response.data.user;

    if (!isValidUserRole(apiUser.role)) {
      throw new Error(`Invalid user role received: ${apiUser.role}`);
    }

    return {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      role: apiUser.role,
      avatarUrl: apiUser.avatar_url || null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch current user. Please try again.",
      };
    }

    throw {
      message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
};

export const updateProfileImage = async (file: File): Promise<{ success: boolean; message: string; user: User }> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.patch<UpdateProfileImageResponse>(
      `${API_BASE_URL}/auth/profile-image`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const apiUser = response.data.user;

    if (!isValidUserRole(apiUser.role)) {
      throw new Error(`Invalid user role received: ${apiUser.role}`);
    }

    return {
      success: response.data.success,
      message: response.data.message,
      user: {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        role: apiUser.role,
        avatarUrl: apiUser.avatar_url || null,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update profile image. Please try again.",
      };
    }

    throw {
      message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
};

export const deleteProfileImage = async (): Promise<{ success: boolean; message: string; user: User }> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured");
    }

    const response = await axios.delete<UpdateProfileImageResponse>(
      `${API_BASE_URL}/auth/profile-image`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    const apiUser = response.data.user;

    if (!isValidUserRole(apiUser.role)) {
      throw new Error(`Invalid user role received: ${apiUser.role}`);
    }

    return {
      success: response.data.success,
      message: response.data.message,
      user: {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        role: apiUser.role,
        avatarUrl: apiUser.avatar_url || null,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete profile image. Please try again.",
      };
    }

    throw {
      message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
};
