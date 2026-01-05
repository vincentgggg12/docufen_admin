// Billing types matching the server-side types

export enum PageCountType {
  PRE_APPROVAL = "PreApproval",
  EXECUTION = "Execution",
  POST_APPROVAL = "PostApproval",
  CLOSED = "Closed",
  FINAL_PDF = "FinalPDF",
  AUDIT_TRAIL = "AuditTrail",
  ATTACHMENT_IMAGE = "AttachmentImage",
  ATTACHMENT_PDF = "AttachmentPDF",
  ATTACHMENT_VIDEO = "AttachmentVideo",
  CONTROLLED_COPY = "ControlledCopy"
}

export interface BillingTransaction {
  id: string;
  partitionKey: string;
  tenantName: string;
  companyName: string;
  documentId: string;
  documentName: string;
  documentNumber: string;
  documentCategory?: string;
  pageCountType: PageCountType;
  incrementalPageCount: number;
  timestamp: number;
  year: number;
  month: number;
  userId?: string;
  userEmail?: string;
  userInitials?: string;
  attachmentFilename?: string;
  attachmentMimeType?: string;
  stage?: number;
  // Client-side addition
  runningTotal?: number;
}

export interface BillingSummary {
  tenantName: string;
  companyName: string;
  period: {
    startDate: number;
    endDate: number;
  };
  pageCountsByType: Record<PageCountType, number>;
  totalPages: number;
  transactionCount: number;
}