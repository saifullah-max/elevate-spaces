import axios from "axios";
import type { User, UserRole } from "@/store/slices/authSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

// Type guard to validate role
const isValidUserRole = (role: unknown): role is UserRole => {
  return role === "USER" || role === "PHOTOGRAPHER" || role === "ADMIN";
};

interface SignUpData {
  name: string;
  email: string;
  password: string;
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
  };
}

// Type-safe responses
type SignUpAPIResponse = AuthAPIResponse;
type SignInResponse = { token: string; user: User };

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
      ...apiUser,
      role: apiUser.role, // Now guaranteed to be UserRole type
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
      ...apiUser,
      role: apiUser.role, // Now guaranteed to be UserRole type
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
