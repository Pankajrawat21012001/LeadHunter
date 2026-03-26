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
  totalFound: number;
  emailsFound: number;
  status: "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
}

export interface SearchRequest {
  targetDescription: string;
  useCase: UseCase;
  needs: {
    linkedinUrl: boolean;
    email: boolean;
    linkedinMessage: boolean;
    coldEmail: boolean;
  };
  targetCount: number;
  senderContext?: string;
}
