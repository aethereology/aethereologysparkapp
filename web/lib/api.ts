import { ReviewerMetrics, DataRoomFolder, ReceiptEmailResponse } from '@/types/api';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const API_BASE_URL = API_URL;

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

// Downloads receipt PDF by triggering a browser download
export async function downloadReceipt(donationId: string): Promise<void> {
  const id = donationId?.trim();
  if (!id) {
    throw new Error('Invalid donation ID');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/donations/${encodeURIComponent(id)}/receipt.pdf`);

    if (!response || !response.ok) {
      let detailMessage: string | null = null;
      try {
        const data = await response?.json();
        if (data && typeof data === 'object' && 'detail' in data && typeof (data as any).detail === 'string') {
          detailMessage = (data as any).detail as string;
        }
      } catch {
        // ignore parsing errors
      }
      if (detailMessage) {
        throw new Error(detailMessage);
      }
      throw new Error(`HTTP error! status: ${response ? response.status : 'unknown'}`);
    }

    const blob = await response.blob();

    if (!globalThis.URL || typeof globalThis.URL.createObjectURL !== 'function') {
      throw new Error('URL.createObjectURL is not available');
    }

    const objectUrl = globalThis.URL.createObjectURL(blob);

    if (!document || typeof document.createElement !== 'function') {
      throw new Error('DOM is not available to create download link');
    }

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `receipt-${id}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    globalThis.URL.revokeObjectURL(objectUrl);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unknown error');
  }
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
  const id = donationId?.trim();
  if (!id) {
    throw new Error('Invalid donation ID');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/donations/${encodeURIComponent(id)}/receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let detailMessage: string | null = null;
      try {
        const data = await response.json();
        if (data && typeof data === 'object' && 'detail' in data && typeof (data as any).detail === 'string') {
          detailMessage = (data as any).detail as string;
        }
      } catch {
        // ignore parsing errors
      }
      if (detailMessage) {
        throw new Error(detailMessage);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // May return { sent: boolean, recipient?: string } or null
    return await response.json();
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unknown error');
  }
}

// Health check endpoint
export async function getHealthStatus(): Promise<{ status: string; timestamp: string }> {
  return await apiCall(`${API_URL}/health`);
}