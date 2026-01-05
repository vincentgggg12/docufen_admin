import { Participant, ParticipantGroup } from "../apiUtils";
import { Stage } from "../../components/editor/lib/lifecycle";

// Re-export ParentDocument and ControlledCopyItem for convenience
export type ParentDocument = {
  documentId: string;
  url: string;
};

export type ControlledCopyItem = {
  name: string;
  date: string;
  url: string;
};

// Base document description from the existing system
export interface DocumentDescription {
  id: string;
  participantGroups: ParticipantGroup[];
  owners?: Participant[];
  companyName?: string;
  tenantName?: string;
  timezone: string;
  locale: string;
  filename: string;
  externalReference: string;
  documentCategory: string;
  documentName: string;
  documentFolder?: string;
  stage: Stage | string;
  createdAt?: Date;
  updatedAt?: Date;
  pdfUrl?: string;
  pdfHash?: string;
  parentDocument?: ParentDocument;
  activeChildren?: ControlledCopyItem[];
  emptyCellCount?: string;
  lastModified?: number;
  edited?: boolean;
  // For controlled copies, add metadata directly
  copyName?: string;
  copyDate?: string;
  copyNumber?: number;
}

// (Commented-out Participant interface removed)

// Template extends DocumentDescription with additional properties specific to templates
export interface Template extends Omit<DocumentDescription, "stage" | "externalReference"> {
  documentType: DocumentType;
  documentNumber: string;
  versionNo: string;
  documentFileName: string;
  fileUrl?: string;
  content?: string; // Document content/structure
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// FormRecord for deviations and non-conformances
export interface FormRecord extends Omit<DocumentDescription, "externalReference"> {
  type: DocumentType;
  templateId: string; // Reference to the template used
  relatedDocumentId: string; // Link to the controlled document this relates to
  status: "draft" | "submitted" | "approved" | "rejected";
  content: string; // Document content with user input
  documentNumber?: string;
  versionNo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document hierarchy refined to use DocumentDescription
export interface DocumentBase {
  id: string;
  documentName: string;
  documentType: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ControlledDocument extends DocumentDescription {
  documentType: "controlled";
  formRecords?: FormRecord[]; // Associated deviation and non-conformance records
}

export interface ControlledCopy extends DocumentDescription {
  documentType: "copy";
  parentId: string; // Reference to parent ControlledDocument
  copyNumber: number;
}

// API response types
export interface TemplateResponse {
  success: boolean;
  template?: Template;
  error?: string;
}

export interface TemplatesResponse {
  success: boolean;
  templates: Template[];
  error?: string;
}

export interface FormRecordResponse {
  success: boolean;
  formRecord?: FormRecord;
  error?: string;
}

export interface FormRecordsResponse {
  success: boolean;
  formRecords: FormRecord[];
  error?: string;
} 