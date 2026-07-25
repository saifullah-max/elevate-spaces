import { getAuthHeaders } from "@/helpers/auth.helpers";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export interface PhotographerDirectoryItem {
  id: string;
  bio: string | null;
  availability: string | null;
  documents_url: string | null;
  driving_license_url?: string | null;
  utility_bill_url?: string | null;
  application_status: string;
  admin_feedback: string | null;
  feedback_provided_at: string | null;
  photographer_responses: Array<{
    contentHtml: string;
    attachments?: Array<{
      name: string;
      type: string;
      dataUrl: string;
    }>;
    submittedAt: string;
  }> | null;
  has_new_photographer_response: boolean;
  submission_count: number;
  photographer_type: string | null;
  years_experience: string | null;
  service_area: string | null;
  service_areas?: string[] | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  website_url: string | null;
  phone_number?: string | null;
  portfolio_items?: Array<{ imageUrl: string; serviceType: string }> | null;
  service_keywords?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  refund_policy?: Array<{ hoursBefore: number; refundPercent: number }> | null;
  gear_description: string | null;
  business_name: string | null;
  short_pitch: string | null;
  approved: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface PhotographerApplication {
  id: string;
  user_id: string;
  bio: string | null;
  availability: string | null;
  documents_url: string | null;
  driving_license_url?: string | null;
  utility_bill_url?: string | null;
  application_status: string;
  admin_feedback: string | null;
  feedback_provided_at: string | null;
  photographer_responses: Array<{
    contentHtml: string;
    attachments?: Array<{
      name: string;
      type: string;
      dataUrl: string;
    }>;
    submittedAt: string;
  }> | null;
  has_new_photographer_response: boolean;
  submission_count: number;
  photographer_type: string | null;
  years_experience: string | null;
  service_area: string | null;
  service_areas?: string[] | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  website_url: string | null;
  phone_number?: string | null;
  portfolio_items?: Array<{ imageUrl: string; serviceType: string }> | null;
  service_keywords?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  refund_policy?: Array<{ hoursBefore: number; refundPercent: number }> | null;
  gear_description: string | null;
  business_name: string | null;
  short_pitch: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    created_at: string;
  };
}

export interface BookingItem {
  id: string;
  user_id: string;
  photographer_id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  client_note_html?: string | null;
  client_note_attachments?: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }> | null;
  photographer_note_html?: string | null;
  photographer_note_attachments?: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }> | null;
  cancelled_by?: "CLIENT" | "PHOTOGRAPHER" | "SYSTEM" | null;
  status_updated_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  photographer?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

function requireApiBase(): string {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured");
  }
  return API_BASE_URL;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function getPhotographerDirectory(): Promise<PhotographerDirectoryItem[]> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: { photographers: PhotographerDirectoryItem[] } }>(
      `${base}/photographers/directory`
    );
    return response.data.data.photographers || [];
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to fetch photographer directory"));
  }
}

export async function getPhotographerDirectoryItemById(profileId: string): Promise<PhotographerDirectoryItem | null> {
  const rows = await getPhotographerDirectory();
  return rows.find((item) => item.id === profileId) || null;
}

export async function submitPhotographerApplication(data: {
  bio: string;
  availability?: string;
  photographerType?: string;
  yearsExperience?: string;
  serviceArea?: string;
  serviceAreas?: string[];
  portfolioUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  serviceKeywords?: string[];
  priceMin?: number;
  priceMax?: number;
  refundPolicy?: Array<{ hoursBefore: number; refundPercent: number }>;
  portfolioServiceTypes?: string[];
  gearDescription?: string;
  businessName?: string;
  shortPitch?: string;
  drivingLicense?: File | null;
  utilityBill?: File | null;
  portfolioImages?: File[];
  document?: File | null;
}): Promise<{ profileId: string; approved: boolean; status: string }> {
  try {
    const base = requireApiBase();
    const formData = new FormData();
    formData.append("bio", data.bio);
    if (data.availability) formData.append("availability", data.availability);
    if (data.photographerType) formData.append("photographerType", data.photographerType);
    if (data.yearsExperience) formData.append("yearsExperience", data.yearsExperience);
    if (data.serviceArea) formData.append("serviceArea", data.serviceArea);
    if (data.serviceAreas?.length) formData.append("serviceAreas", JSON.stringify(data.serviceAreas));
    if (data.portfolioUrl) formData.append("portfolioUrl", data.portfolioUrl);
    if (data.instagramUrl) formData.append("instagramUrl", data.instagramUrl);
    if (data.facebookUrl) formData.append("facebookUrl", data.facebookUrl);
    if (data.linkedinUrl) formData.append("linkedinUrl", data.linkedinUrl);
    if (data.xUrl) formData.append("xUrl", data.xUrl);
    if (data.websiteUrl) formData.append("websiteUrl", data.websiteUrl);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
    if (data.serviceKeywords?.length) formData.append("serviceKeywords", JSON.stringify(data.serviceKeywords));
    if (typeof data.priceMin === "number") formData.append("priceMin", String(data.priceMin));
    if (typeof data.priceMax === "number") formData.append("priceMax", String(data.priceMax));
    if (data.refundPolicy?.length) formData.append("refundPolicy", JSON.stringify(data.refundPolicy));
    if (data.portfolioServiceTypes?.length) formData.append("portfolioServiceTypes", JSON.stringify(data.portfolioServiceTypes));
    if (data.gearDescription) formData.append("gearDescription", data.gearDescription);
    if (data.businessName) formData.append("businessName", data.businessName);
    if (data.shortPitch) formData.append("shortPitch", data.shortPitch);
    if (data.drivingLicense) formData.append("drivingLicense", data.drivingLicense);
    if (data.utilityBill) formData.append("utilityBill", data.utilityBill);
    if (data.document) formData.append("document", data.document);
    if (data.portfolioImages?.length) {
      data.portfolioImages.forEach((file) => formData.append("portfolioImages", file));
    }

    const response = await axios.post<{ success: boolean; data: { profileId: string; approved: boolean; status: string } }>(
      `${base}/photographers/onboarding/apply`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to submit photographer application"));
  }
}

export async function uploadPhotographerDocument(file: File): Promise<{ profileId: string; documentsUrl: string | null }> {
  try {
    const base = requireApiBase();
    const formData = new FormData();
    formData.append("document", file);

    const response = await axios.post<{ success: boolean; data: { profileId: string; documentsUrl: string | null } }>(
      `${base}/photographers/onboarding/document`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to upload photographer document"));
  }
}

export async function getMyPhotographerProfile(): Promise<PhotographerDirectoryItem | null> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: PhotographerDirectoryItem }>(
      `${base}/photographers/me`,
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw new Error(toErrorMessage(error, "Failed to fetch photographer profile"));
  }
}

export async function updateMyPhotographerProfile(data: {
  bio?: string;
  availability?: string;
}): Promise<PhotographerDirectoryItem> {
  try {
    const base = requireApiBase();
    const response = await axios.patch<{ success: boolean; data: PhotographerDirectoryItem }>(
      `${base}/photographers/me`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to update photographer profile"));
  }
}

export async function setMyAvailability(availability: string): Promise<void> {
  try {
    const base = requireApiBase();
    await axios.patch(
      `${base}/photographers/me/availability`,
      { availability },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to update availability"));
  }
}

export async function getPendingPhotographerApplications(): Promise<PhotographerApplication[]> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: { applications: PhotographerApplication[] } }>(
      `${base}/photographers/admin/applications`,
      { headers: getAuthHeaders() }
    );
    return response.data.data.applications || [];
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to fetch pending applications"));
  }
}

export async function getPhotographerApplicationById(profileId: string): Promise<PhotographerApplication> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: PhotographerApplication }>(
      `${base}/photographers/admin/applications/${profileId}`,
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to fetch application details"));
  }
}

export async function reviewPhotographerApplication(
  profileId: string,
  status: string,
  adminFeedback?: string
): Promise<void> {
  try {
    const base = requireApiBase();
    await axios.patch(
      `${base}/photographers/admin/applications/${profileId}/review`,
      { status, adminFeedback },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to review application"));
  }
}

export async function submitPhotographerResponse(data: {
  responseContent: string;
  attachments?: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }>;
}): Promise<{ profileId: string; status: string; responseCount: number }> {
  try {
    const base = requireApiBase();
    const response = await axios.post<{
      success: boolean;
      data: { profileId: string; status: string; responseCount: number };
    }>(
      `${base}/photographers/me/response`,
      {
        responseContent: data.responseContent,
        attachments: data.attachments || [],
      },
      { headers: getAuthHeaders() }
    );

    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to submit photographer response"));
  }
}

export async function createBookingRequest(data: {
  photographerId: string;
  date: string;
  paymentConfirmed: boolean;
  transactionId: string;
  clientNoteHtml?: string;
  clientNoteAttachments?: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }>;
}): Promise<void> {
  try {
    const base = requireApiBase();
    await axios.post(`${base}/photographers/bookings/request`, data, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to create booking request"));
  }
}

export async function getMyBookings(): Promise<BookingItem[]> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: BookingItem[] }>(
      `${base}/photographers/bookings/mine`,
      { headers: getAuthHeaders() }
    );
    return response.data.data || [];
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to fetch your bookings"));
  }
}

export async function getReceivedBookings(): Promise<BookingItem[]> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: BookingItem[] }>(
      `${base}/photographers/bookings/received`,
      { headers: getAuthHeaders() }
    );
    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw new Error(toErrorMessage(error, "Failed to fetch received bookings"));
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: "CONFIRMED" | "CANCELLED",
  photographerNoteHtml?: string,
  photographerNoteAttachments?: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }>
): Promise<void> {
  try {
    const base = requireApiBase();
    await axios.patch(
      `${base}/photographers/bookings/${bookingId}/status`,
      {
        status,
        photographerNoteHtml: photographerNoteHtml || "",
        photographerNoteAttachments: photographerNoteAttachments || [],
      },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to update booking status"));
  }
}

export async function withdrawBookingRequest(bookingId: string): Promise<void> {
  try {
    const base = requireApiBase();
    await axios.patch(
      `${base}/photographers/bookings/${bookingId}/withdraw`,
      {},
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to withdraw booking request"));
  }
}
