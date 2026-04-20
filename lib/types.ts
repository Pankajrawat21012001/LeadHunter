export type UseCase = "job" | "customer" | "connection";

export interface Contact {
  id: string;
  campaignId: string;
  fullName: string;
  jobTitle: string;
  company: string;
  companyDomain?: string;
  linkedinUrl: string;
  email: string;
  emailStatus: "not_searched" | "found" | "not_found" | "pending";
  linkedinMessage: string;
  coldEmail: string; // JSON string of {subject, body}
  status: "pending" | "messaged" | "replied" | "converted" | "skip";
  foundAt: string;
  useCase: UseCase;
  source: string;
}

export interface Campaign {
  id: string;
  name: string;
  useCase: UseCase;
  targetDescription: string;
  booleanQuery: string;
  filtersJson: string;       // JSON-serialized SearchFilters for Find More
  totalFound: number;
  emailsFound: number;
  status: "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  deduplicatedCount: number;
  runTimeSeconds: number;
}

export interface SearchFilters {
  roles: string[];          // job titles
  industries: string[];     // industry sectors
  locations: string[];      // countries / cities
  companyStage: string;     // startup | enterprise | mid-size | any
  companySize: string | null;
  signals: string[];        // intent keywords
  seniority: string;        // C-level | Director | Manager | IC | any
}

export interface SearchRequest {
  targetDescription: string;   // kept for naming the campaign
  filters: SearchFilters;      // structured filters — skips AI extraction
  useCase: UseCase;
  needs: {
    linkedinUrl: boolean;
    email: boolean;
    linkedinMessage: boolean;
    coldEmail: boolean;
  };
  targetCount: number;
  senderContext?: string;
  previousQuery?: string;
}
