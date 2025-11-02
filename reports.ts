export interface Report {
  id: string;
  reporterEmail: string;
  reporterName: string;
  type: "bug" | "rule-violation";
  title: string;
  description: string;
  evidence?: string;
  status: "pending" | "accepted" | "dismissed";
  adminMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReportRequest {
  type: "bug" | "rule-violation";
  title: string;
  description: string;
  evidence?: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  report?: Report;
}

export interface ReportsListResponse {
  success: boolean;
  reports: Report[];
}

export interface UpdateReportRequest {
  reportId: string;
  status: "accepted" | "dismissed";
  adminMessage?: string;
}

export interface UserReportsResponse {
  success: boolean;
  reports: Report[];
}
