// API types for SparkCreatives donation platform
export interface ReviewerMetrics {
  shippedYTD: number;
  onTimePct: number;
  beneficiaries: number;
  fundsByDesignation: FundDesignation[];
  impactStories: ImpactStory[];
}

export interface FundDesignation {
  name: string;
  value: number;
}

export interface ImpactStory {
  title: string;
  blurb: string;
  photo?: string;
}

export interface DataRoomFolder {
  folder: string;
  items: string[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface ReceiptEmailResponse {
  sent: boolean;
  recipient?: string;
}