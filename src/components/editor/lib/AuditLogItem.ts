import { Stage } from "./lifecycle";

// import { title } from "process";

// const TABLEHASHLENGTH = 15;

export enum ActionType {
  // eslint-disable-next-line no-unused-vars
  Undefined = 0, 
  // eslint-disable-next-line no-unused-vars
  PreApproveSign = 1,
  // eslint-disable-next-line no-unused-vars
  EnterText = 2,
  // eslint-disable-next-line no-unused-vars
  EnterBodyText = 3,
  // eslint-disable-next-line no-unused-vars
  AddAttachment = 4,
  // eslint-disable-next-line no-unused-vars
  PerformedBySign = 5,
  // eslint-disable-next-line no-unused-vars
  ReviewedBySign = 6,
  // eslint-disable-next-line no-unused-vars
  PostApproveSign = 7,
  // eslint-disable-next-line no-unused-vars
  // PostQualityApproveSign = 8,
  // eslint-disable-next-line no-unused-vars
  AddedLogTables = 9,
  // eslint-disable-next-line no-unused-vars
  ChangedStage = 10,
  // eslint-disable-next-line no-unused-vars
  CheckedBox = 11,
  // eslint-disable-next-line no-unused-vars
  MadeCorrection = 12,
  // eslint-disable-next-line no-unused-vars
  BulkNa = 13,
  // eslint-disable-next-line no-unused-vars
  ToggleCell = 14,
  // eslint-disable-next-line no-unused-vars
  InitialLock = 15,
  // eslint-disable-next-line no-unused-vars
  EnterInitials = 16,
  // eslint-disable-next-line no-unused-vars
  AddTableRow = 17,
  // eslint-disable-next-line no-unused-vars
  VerifyAttachment = 18,
  // eslint-disable-next-line no-unused-vars
  // AuthoriseReleaseSign = 19,
  // eslint-disable-next-line no-unused-vars
  FillInBlank = 20,
  // eslint-disable-next-line no-unused-vars
  Upload = 21,
  // eslint-disable-next-line no-unused-vars
  FinalisePdf = 22,
  // eslint-disable-next-line no-unused-vars
  VerifiedBySign = 23,
  // eslint-disable-next-line no-unused-vars
  ApprovedBySign = 24,
  // eslint-disable-next-line no-unused-vars
  CreatedThisByCopy = 25,
  // eslint-disable-next-line no-unused-vars
  ChangedStageBack = 26,
  // eslint-disable-next-line no-unused-vars
  // PreQualityApproveSign = 27,
  // eslint-disable-next-line no-unused-vars
  Register = 28,
  // eslint-disable-next-line no-unused-vars
  Closed = 29,
  // eslint-disable-next-line no-unused-vars
  Deleted = 30,
  // eslint-disable-next-line no-unused-vars
  Comment = 31,
  // eslint-disable-next-line no-unused-vars
  AddDocufenLink = 32,
  // eslint-disable-next-line no-unused-vars
  AddComment = 33,
  // eslint-disable-next-line no-unused-vars
  DeleteComment = 34, 
  // eslint-disable-next-line no-unused-vars
  CustomSign = 35,
  // eslint-disable-next-line no-unused-vars
  CustomPreApproveSign = 36,
  // eslint-disable-next-line no-unused-vars
  CustomPostApproveSign = 37,
  // eslint-disable-next-line no-unused-vars
  UpdateDocumentParticipants = 38,
  // eslint-disable-next-line no-unused-vars
  TextAtCursor = 39,
  // eslint-disable-next-line no-unused-vars
  CursorPreApproveSign = 40,
  // eslint-disable-next-line no-unused-vars
  CursorPostApproveSign = 41,
  // eslint-disable-next-line no-unused-vars
  CursorCustomSign = 42,
  // eslint-disable-next-line no-unused-vars
  CursorCustomPreApproveSign = 43,
  // eslint-disable-next-line no-unused-vars
  CursorCustomPostApproveSign = 44,
  // eslint-disable-next-line no-unused-vars
  CursorAddAttachment = 45,
  // eslint-disable-next-line no-unused-vars
  CursorPerformedBySign = 46,
  // eslint-disable-next-line no-unused-vars
  CursorReviewedBySign = 47,
  // eslint-disable-next-line no-unused-vars
  // CursorAuthoriseReleaseSign = 48,
  // eslint-disable-next-line no-unused-vars
  CursorVerifiedBySign = 49,
  // eslint-disable-next-line no-unused-vars
  CursorApprovedBySign = 50,
  // eslint-disable-next-line no-unused-vars
  // CursorPreQualityApproveSign = 51,
  // eslint-disable-next-line no-unused-vars
  CursorAddDocufenLink = 52,
  // eslint-disable-next-line no-unused-vars
  // CursorPostQualityApproveSign = 53,
  // eslint-disable-next-line no-unused-vars
  CursorEnterInitials = 54,
  // eslint-disable-next-line no-unused-vars
  CreatedCopyOfThis = 55,
  // eslint-disable-next-line no-unused-vars
  ApiUpload = 56,
  // eslint-disable-next-line no-unused-vars
  ClaimUploadedDocument = 57,
}

// This is the form of the verification in the server attachment object
// key is the string of the attachment number and the string[] is a list of user initials
export type Verifications = {
  [key: string]: string[]
}

export type ControlledCopyItem = {
  name: string
  date: string
  url: string
  timestamp?: number
}

export type ParentDocument = {
  documentId: string
  url: string
}

// export interface HashObject {
//   hash: string,
//   content: string,
// }
export interface IAuditLogItem {
  version?: string
  legalName: string
  initials: string
  email?: string
  userId: string
  // initialHash: HashObject
  // finalHash: HashObject
  newText: string
  removedText: string
  reason: string
  attachmentHash: string
  attachmentUrl: string
  attachmentFilename: string
  attachmentItemId: string
  attachmentName: string
  attachmentNumber: number
  emptyCellCount?: number
  emptyCellCountChange?: number
  actionType?: ActionType
  stage?: Stage
  cellIndices?: string
  markerCounter?: number
  time: number
  timeStr?: string
  timezone: string
  locale: string
  pageCount?: number
  nPostApprovals?: number
  verifications: Verifications
  attachmentVerified?: number
  lateActionDate?: string
  lateActionTime?: string
  lateReason?: string
  tokenName?: string
  parentDocument?: ParentDocument
  activeChildren?: ControlledCopyItem[]
  force?: boolean
}

export const nullAuditLog: IAuditLogItem = {
  legalName: "",
  initials: "",
  userId: "",
  newText: "",
  removedText: "",
  reason: "",
  attachmentHash: "",
  attachmentUrl: "",
  attachmentFilename: "",
  attachmentItemId: "",
  attachmentName: "",
  attachmentNumber: -1,
  time: -1,
  timezone: "",
  locale: "",
  verifications: {}
}

export class AuditLogItem implements IAuditLogItem {
  legalName = ""
  initials = ""
  email = ""
  userId = ""
  newText = ""
  removedText = ""
  reason = ""
  attachmentHash = ""
  attachmentUrl = ""
  attachmentFilename = ""
  attachmentItemId: string = ""
  attachmentName = ""
  userTitle = ""
  attachmentNumber = -1
  pageCount?: number
  markerCounter?: number
  timeStr?: string
  emptyCellCount?: number
  emptyCellCountChange?: number
  nPostApprovals?: number
  stage?: Stage
  actionType?: ActionType
  cellIndices?: string
  lateActionDate?: string
  lateActionTime?: string
  lateReason?: string
  tokenName?: string
  // userDepartment = "";
  userCompany = ""
  time = 0
  timezone = ""
  locale  = ""
  verifications: Verifications = {}
  constructor(obj: Partial<AuditLogItem>) {
    Object.assign(this, obj);
    if (this.email.length === 0 || this.userId.length === 0) throw new Error('Audit Log Error: Required fields are missing');
  }

  toJSON() {
    const jsonObj: Partial<IAuditLogItem> = {
      legalName: this.legalName,
      email: this.email,
      userId: this.userId,
      newText: this.newText,
      removedText: this.removedText,
      reason: this.reason,
      attachmentHash: this.attachmentHash,
      attachmentUrl: this.attachmentUrl,
      attachmentFilename: this.attachmentFilename,
      attachmentItemId: this.attachmentItemId,
      attachmentName: this.attachmentName,
      time: this.time,
      verifications: this.verifications,
    };
    if (this.pageCount != null) jsonObj.pageCount = this.pageCount
    if (this.markerCounter != null) jsonObj.markerCounter = this.markerCounter
    if (this.timeStr != null) jsonObj.timeStr = this.timeStr
    if (this.emptyCellCount != null) jsonObj.emptyCellCount = this.emptyCellCount
    if (this.emptyCellCountChange != null) jsonObj.emptyCellCountChange = this.emptyCellCountChange
    if (this.nPostApprovals != null) jsonObj.nPostApprovals = this.nPostApprovals
    if (this.attachmentNumber != null) jsonObj.attachmentNumber = this.attachmentNumber
    if (this.stage != null) jsonObj.stage = this.stage
    if (this.actionType != null) jsonObj.actionType = this.actionType
    if (this.cellIndices != null) jsonObj.cellIndices = this.cellIndices
    if (this.lateActionDate != null) jsonObj.lateActionDate = this.lateActionDate
    if (this.lateActionTime != null) jsonObj.lateActionTime = this.lateActionTime
    if (this.lateReason != null) jsonObj.lateReason = this.lateReason
    if (this.tokenName != null) jsonObj.tokenName = this.tokenName
    if (this.timezone != null) jsonObj.timezone = this.timezone
    return jsonObj
  }
}

export interface AccountAuditLogItem {
  id: string
  actorId: string
  actor: string
  action: string
  target?: string
  details: string,
  key?: string
  timestamp: number
  year: string
  oldData?: unknown
  newData?: unknown
}