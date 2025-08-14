import { ReviewerMetrics, DataRoomFolder, ReceiptEmailResponse } from '@/types/api';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Custom error class for API errors
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API call helper with error handling
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, `API call failed: ${response.statusText}`);
    }
    
    // Handle non-JSON responses (like PDFs)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    return response as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getReceiptPdf(donationId: string): Promise<ArrayBuffer> {
  if (!donationId?.trim()) {
    throw new ApiError(400, 'Donation ID is required');
  }
  
  const response = await fetch(`${API_URL}/api/v1/donations/${donationId}/receipt.pdf`, { 
    cache: "no-store",
    headers: {
      'Accept': 'application/pdf'
    }
  });
  
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch receipt');
  }
  
  return await response.arrayBuffer();
}

export async function getStatementPdf(donorId: string, year: number): Promise<ArrayBuffer> {
  if (!donorId?.trim()) {
    throw new ApiError(400, 'Donor ID is required');
  }
  
  if (!year || year < 1900 || year > new Date().getFullYear()) {
    throw new ApiError(400, 'Valid year is required');
  }
  
  const response = await fetch(`${API_URL}/api/v1/donors/${donorId}/statement/${year}`, { 
    cache: "no-store",
    headers: {
      'Accept': 'application/pdf'
    }
  });
  
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch statement');
  }
  
  return await response.arrayBuffer();
}

export async function getDataRoomIndex(org: string): Promise<DataRoomFolder[]> {
  if (!org?.trim()) {
    throw new ApiError(400, 'Organization is required');
  }
  
  return await apiCall<DataRoomFolder[]>(`${API_URL}/api/v1/data-room`);
}

export async function getReviewerMetrics(org: string): Promise<ReviewerMetrics> {
  if (!org?.trim()) {
    throw new ApiError(400, 'Organization is required');
  }
  
  return await apiCall<ReviewerMetrics>(`${API_URL}/api/v1/metrics/reviewer`);
}

// Send receipt via email
export async function sendReceiptEmail(donationId: string): Promise<ReceiptEmailResponse> {
  if (!donationId?.trim()) {
    throw new ApiError(400, 'Donation ID is required');
  }
  
  return await apiCall<ReceiptEmailResponse>(`${API_URL}/api/v1/donations/${donationId}/receipt`, {
    method: 'POST'
  });
}

// Health check endpoint
export async function getHealthStatus(): Promise<{ status: string; timestamp: string }> {
  return await apiCall(`${API_URL}/health`);
}