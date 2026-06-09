import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export interface AdminUserSummary {
  ownedTeams: number;
  createdProjects: number;
  teamMemberships: number;
  creditPurchases: number;
}

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  aiConsentAccepted: boolean;
  aiConsentFirstAcceptedAt: string | null;
  aiConsentRecentAcceptedAt: string | null;
  summary: AdminUserSummary;
}

export interface AdminOwnedTeam {
  id: string;
  name: string;
  description: string | null;
  wallet: number;
  created_at: string;
}

export interface AdminTeamOwner {
  id: string;
  name: string | null;
  email: string;
}

export interface AdminTeamOwnerCandidate {
  id: string;
  name: string | null;
  email: string;
  teamsCount: number;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured");
  }

  const response = await axios.get<{ success: boolean; data: { users: AdminUserRow[] } }>(
    `${API_BASE_URL}/admin/users`,
    { headers: getAuthHeaders() }
  );

  return response.data.data.users || [];
}

export async function getOwnedTeamsByEmail(email: string): Promise<{
  query: string;
  owner: AdminTeamOwner | null;
  teams: AdminOwnedTeam[];
  ownerCandidates: AdminTeamOwnerCandidate[];
}> {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured");
  }

  const response = await axios.get<{
    success: boolean;
    data: {
      query: string;
      owner: AdminTeamOwner | null;
      teams: AdminOwnedTeam[];
      ownerCandidates: AdminTeamOwnerCandidate[];
    };
  }>(`${API_BASE_URL}/admin/users/owned-teams`, {
    headers: getAuthHeaders(),
    params: { email },
  });

  return response.data.data;
}

export async function createEnterprisePaymentLink(params: {
  ownerEmail: string;
  teamId: string;
  normalSeats: number;
  photographerSeats: number;
  credits: number;
  amountUsd: number;
  billingCycle: "monthly" | "annual";
  autoRenew?: boolean;
}): Promise<{ url: string; sessionId: string }> {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured");
  }

  const response = await axios.post<{
    success: boolean;
    data: { url: string; sessionId: string };
  }>(`${API_BASE_URL}/admin/users/enterprise-payment-link`, params, {
    headers: getAuthHeaders(),
  });

  return response.data.data;
}