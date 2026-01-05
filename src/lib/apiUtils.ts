import { User, UserTenantProps } from "./User";
import { ActionType, AuditLogItem, ControlledCopyItem, IAuditLogItem, nullAuditLog, ParentDocument } from "../components/editor/lib/AuditLogItem";
import { BusyException, DocumentLockedException, NotLoggedInError, NoWritePermissions, UserNotConfigured } from "../components/editor/lib/errors";
import { Stage } from "../components/editor/lib/lifecycle";
import { APIURL, SERVERURL, UPLOADURL } from "./server";
import { BasicResult, hashFromString } from "../components/editor/lib/addinUtils";
import { PRODUCTION_MODE } from "./server";
import { UserType } from "./authorisation";
import i18n from "i18next";

const NETWORK_TIMEOUT = 16000; // 16 seconds

interface ErrorBody {
  message: string
}

let sus = "docufen"
const BEARER = "Bearer "
export const TIME_SYNC_MISMATCH = "timesyncmismatch_"
export const FAILEDBODY = "failedAuditItem"

let userStr = ""

const channel = new BroadcastChannel("docufen")
// channel.addEventListener("message", (event: MessageEvent<ChannelMessage>) => {
//   sus = event.data.sus
//   console.log("updated sus: " + sus)
// })

channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
  if (userStr != "" && event.data[userStr] != null) {
    sus = event.data[userStr]
    if (!PRODUCTION_MODE) console.log("updated sus from message: " + sus + " for user: " + userStr)
  }
}

interface ChannelMessage {
  [key: string]: string
}

export interface UserX extends User {
  sus: string
  maintenanceMode?: boolean
}

// Define chat message interface
export interface ChatMessage {
  id: number;
  sender: string;
  avatar: string;
  message: string;
  timestamp: number;
  bookmarkId?: string // Optional bookmark ID for linking to specific messages
  mentions: string[]; // List of mentioned users
}

export interface DocumentDescription {
  id: string
  participantGroups: ParticipantGroup[]
  owners?: Participant[] // For deleted documents
  companyName: string
  tenantName: string
  timezone: string
  locale: string
  filename: string
  externalReference: string
  documentName: string
  documentFolder: string
  stage: Stage | string
  created_at: number
  pdfUrl?: string
  pdfHash?: string
  documentCategory?: string
  // auditLogUrl?: string
  parentDocument?: ParentDocument
  activeChildren?: ControlledCopyItem[]
  nChildren?: number
  controlledCopyItem?: ControlledCopyItem
  emptyCellCount?: string
  lastModified?: number
  edited?: boolean
  hasContent?: boolean
  comments?: ChatMessage[]
  deleted?: boolean
  deletionMetadata?: {
    deletedAt: number
    deletedBy: string
    deletedByName: string
    deletedByEmail: string
    finalizedBy: string | null
    finalizedAt: number | null
  }
}
export type LicenseStatus = 'trial' | 'active' | 'expired' | 'deactivated'
export const LicenseStatuses: {
  TRIAL: LicenseStatus,
  ACTIVE: LicenseStatus,
  EXPIRED: LicenseStatus,
  DEACTIVATED: LicenseStatus
} = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  DEACTIVATED: 'deactivated'
  
}

const conversionUrl = import.meta.env.VITE_DOCUMENT_UTILS_URL || "docufusiones-server.azurewebsites.net";
const protocol = import.meta.env.VITE_DOCUMENT_UTILS_PROTOCOL || "https";

const docServerUrl = `${protocol}://${conversionUrl}/health`;

export const checkLoggedIn = async (locale?: string): Promise<{data: UserX | null, ok:boolean, maintenanceMode?: boolean}> => {
  // Fire and forget the doc server wake up call
  fetch(docServerUrl).catch((err) => {
    if (err instanceof Error)
      console.log("Document utils server ping failed: " + err.message);
    else
      console.log("Document utils server ping failed: Unknown error");
  })
  if (locale == null) locale = 'en';
  const res = await fetch(APIURL + 'loggedin/?lng=' + locale, { credentials: 'include' });
  if (res.ok) {
    const data = await res.json() as unknown as UserX;
    userStr = data.userId ? data.userId : "anonymous"
    updateSus(data.sus)
    return { data, ok: true, maintenanceMode: data.maintenanceMode };
  } else {
    return { data: null, ok: false, maintenanceMode: undefined };
  }
}

export const userPing = async (): Promise<BasicResult> => {
  // Fire and forget the doc server wake up call
  fetch(docServerUrl).catch((err) => {
    if (err instanceof Error)
      console.log("Document utils server ping failed: " + err.message);
    else
      console.log("Document utils server ping failed: Unknown error");
  })
  const res = await fetch(APIURL + 'userping/', { credentials: 'include' });
  if (res.ok) {
    return { statusOK: true }
  } else {
    console.log("User ping failed: " + res.status);
    return { statusOK: false, error: "User ping failed with status: " + res.status }
  }
}

export const updateSus = (newVal: string) => {
  if (newVal != null) {
    sus = newVal
    if (!PRODUCTION_MODE) console.log("updated sus: " + sus + " for user: " + userStr)
    const obj = { [userStr]: newVal }
    channel.postMessage(obj)
  }
}

export const AUTH_TIMEOUT = 180
const grts = () => {
  return Math.round(new Date().getTime() / 1000 / AUTH_TIMEOUT) * AUTH_TIMEOUT
}

export const getAuthorization = async () => {
  const roundTime = sus + (grts()).toString();
  return await hashFromString(roundTime);
};

export const getDocumentPdfUrls = async (documentId: string) => {
  if (sus === "docufen") return { pdfUrl: "", auditLogUrl: "" }
  try {
    const authorization = await getAuthorization();
    const res = await fetch(`${APIURL}getdocumentpdfurls/${documentId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      credentials: "include",
    });
    interface ExpectedResponse {
      pdfUrl: string,
      auditLogUrl: string
    }
    if (res instanceof Response) {
      if (res.status == 200) {
        const data = (await res.json()) as unknown as ExpectedResponse
        return data
      } else {
        return { pdfUrl: "", auditLogUrl: "" }
      }
    } else {
      return { pdfUrl: "", auditLogUrl: "" }
    }
  } catch (err: unknown) {
    if (err instanceof Error)
      console.error("Unable to fetch Document urls: " + err.message)
    return { pdfUrl: "", auditLogUrl: "" };
  }
}
export type VerifyAttachmentResult = {
  status: string,
  attachmentId?: string,
  attachmentNumber?: number,
  error?: string
}

export const getAttachments = async (documentId: string) => {
  const url = `${APIURL}getattachments/${documentId}/`
  const authorization = await getAuthorization();
  if (sus === "docufen") return []
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: BEARER + authorization,
    },
    credentials: "include",
  });
  if (res instanceof Response) {
    if (res.status == 200) {
      const data = (await res.json()) as unknown as IAuditLogItem[]
      return data
    } else {
      return []
    }
  } else {
    return []
  }
}

export const verifyAttachment = async (documentId: string, attachmentNumber: number): Promise<VerifyAttachmentResult> => {
  const url = APIURL + "verifyAttachment/"
  const authorization = await getAuthorization();
  if (sus === "docufen") return { status: "failed", error: "Not ready" }
  console.log("documentId: " + documentId + " attachmentNumber: " + attachmentNumber)
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: BEARER + authorization,
    },
    body: JSON.stringify({ documentId, attachmentNumber }),
    credentials: "include",
  });
  if (res instanceof Response) {
    if (res.status == 201) {
      const data = (await res.json()) as unknown as VerifyAttachmentResult
      console.log("attachment verified: " + JSON.stringify(data))
      return data
    } else if (res.status == 404) {
      return { status: "fail", error: "Unknown attachment" }
    } else {
      console.log("no url in api call: " + res.status.toString())
      return { status: "fail", error: "Status returned: " + res.status.toString() }
    }
  } else {
    console.log("No response found")
    return { status: "fail", error: "No response found" }
  }
}

export interface UserCreateRequest {
  email: string
  legalName: string
  initials: string
  userType: UserType
  companyName?: string
  digitalSignatureVerification?: IDigitalSignatureVerification
  canAccessAllDocuments?: boolean
  qualityApprover?: boolean
  qualifiedPerson?: boolean
}

export const NOT_VERIFIED = "Not Verified"
export const VERIFIED_IMAGE = "Verified Image"
export const VERIFIED_REGISTER_NOTATION = "Verified Register Notation"
export const VERIFIED_MS_USER_ID = "Verified MS User ID"
export const VerificationTypes = {
  NOT_VERIFIED,
  VERIFIED_IMAGE,
  VERIFIED_REGISTER_NOTATION,
  VERIFIED_MS_USER_ID
}
export type IDigitalSignatureVerification = typeof VerificationTypes[keyof typeof VerificationTypes]
// export type IDigitalSignatureVerification = "Not Verified" | "Verified Image" | "Verified Register Notation" | "Verified MS User ID"

export const INVITED = "invited"
export const UNINVITED = "uninvited"
export const PENDING = "pending"
export const ACTIVE = "active"
export const INACTIVE = "inactive"
export const InvitationStatuses = {
  INVITED,
  UNINVITED,
  PENDING,
  ACTIVE,
  INACTIVE
}
export type InvitationStatus = typeof InvitationStatuses[keyof typeof InvitationStatuses]

// User interface
export interface UsersDataJson {
  users: Array<DocufenUser>;
}
// export interface UIUser extends Omit<DocufenUser, 'role'> {
//   role: Role;
// }
export interface DocufenUser {
  oid: string;
  id?: string; // Deactivated users have ids 
  legalName: string;
  initials: string;
  userType: UserType;
  ersdSigned: number;
  digitalSignatureVerification: IDigitalSignatureVerification;
  digitalSignatureUrl?: string;
  digitalSignatureNotation?: string;
  digitalSignatureVerifiedBy?: string;
  digitalSignatureVerifiedAt?: number;
  invitationStatus?: InvitationStatus;
  // activated?: boolean;
  isExternal?: boolean;
  email: string;
  companyName?: string;
  tenantDisplayName?: string;
  logo?: string;
  createdBy?: string;
  createdAt?: number;
  homeTenantName?: string;
  canAccessAllDocuments?: boolean;
  qualityApprover?: boolean;
  qualifiedPerson?: boolean;
  deactivatedAt?: number;
  deactivatedBy?: string;
}

export interface DeactivatedUser extends UserTenantProps {
  id: string
  email: string
  deactivatedAt: number
  deactivatedBy: string
}

export interface UpdateUserResponse {
  code: number
  message: string
  user: DocufenUser
}

export const callUpdateUserInfo = async (tenant: string, user: Partial<DocufenUser>): Promise<DocufenUser | null> => {
  console.log("Updating user: " + JSON.stringify(user))
  const url = SERVERURL + `users/${tenant}/user/`
  const authorization = await getAuthorization();
  if (sus === "docufen") return null

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: BEARER + authorization,
    },
    body: JSON.stringify(user),
    credentials: "include",
  })
  console.log("Status: " + res.status)
  if (res instanceof Response) {
    if (res.status === 200) {
      const data = (await res.json()) as unknown as UpdateUserResponse
      return data.user
    } else {
      return null
    }
  } else {
    return null
  }
}

// };


export const createUser = async (tenant: string, user: UserCreateRequest) => {
  const url = SERVERURL + `users/${tenant}/user/`
  const authorization = await getAuthorization();
  if (sus === "docufen") return 401

  // Map frontend canAccessAllDocuments to backend canAccessAllDocuments
  const backendUser: any = { ...user };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: BEARER + authorization,
    },
    body: JSON.stringify(backendUser),
    credentials: "include",
  })
  if (res instanceof Response) {
    if (res.status === 200 || res.status === 201) {
      return 0
    } else {
      return res.status.valueOf()
    }
  } else {
    return 1
  }
}

/**
 * Response from createPdfFiles endpoint
 * - status: 'completed' means PDF is ready, pdfUrl is available
 * - status: 'processing' means PDF creation is still in progress, client should poll
 * - status: 'failed' means PDF creation failed
 */
export interface CreatePdfResponse {
  status: 'completed' | 'processing' | 'failed'
  jobId?: string
  pdfUrl?: string
  time?: number
  progress?: number
  message?: string
  error?: string
}

export const createPdfFiles = async (documentId: string, lng: string): Promise<CreatePdfResponse> => {
  const url: string = SERVERURL + "document/createpdffiles/" + documentId + "/?lng=" + lng;
  let res: Response;
  if (sus === "docufen") return { status: 'completed', pdfUrl: "", time: 0 }
  try {
    const authorization = await getAuthorization();
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: BEARER + authorization,
      },
      credentials: "include",
    });
  } catch (err: unknown) {
    if (err instanceof Error)
      console.error("Fetch call failed: " + err.message);
    return { status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' }
  }
  console.log("createPdfFiles response status: " + res.status.toString());

  if (res instanceof Response) {
    if (res.status === 200 || res.status === 202) {
      try {
        const resData = await res.json() as CreatePdfResponse;
        console.log("createPdfFiles response:", resData)
        return resData;
      } catch {
        console.error("Failed to parse success response as JSON")
        return { status: 'failed', error: 'Invalid response format' }
      }
    } else if (res.status === 500) {
      // Server returned error with status field
      try {
        const resData = await res.json() as CreatePdfResponse;
        console.error("PDF creation failed:", resData)
        return resData;
      } catch {
        console.error("Failed to parse 500 response as JSON")
        return { status: 'failed', error: 'Server error' }
      }
    } else if (res.status === 401) {
      throw new NotLoggedInError("User not logged in or token expired")
    } else if (res.status === 403) {
      console.log("Throwing NoWritePermissions")
      throw new NoWritePermissions("User needs permission to upload file")
    } else if (res.status === 412) {
      throw new DocumentLockedException("Document in use")
    } else if (res.status === 400) {
      try {
        const responsBody = await res.json() as unknown as { message: string }
        const message = responsBody.message
        console.log("No url returned file upload failed: status: " + JSON.stringify(responsBody));
        console.log("message: " + message)
        throw new UserNotConfigured(message)
      } catch (err) {
        if (err instanceof UserNotConfigured) throw err
        console.error("Failed to parse 400 response as JSON")
        throw new UserNotConfigured("Bad request")
      }
    } else {
      console.log("Unable to create pdf for unknown reason: ")
      return { status: 'failed', error: 'Unknown error' }
    }
  } else {
    console.error("res not instance of Response");
    return { status: 'failed', error: 'Invalid response' }
  }
}

interface DocumentUpdate {
  documentId: string
  newStage: Stage
  emptyCellCount?: number
  reason: string
  time: number
  nPages?: number
}

export const setServerDocumentStage = async (documentId: string, newStage: Stage, lng: string, reason: string, time: number, nPages_?: number) => {
  const nPages = nPages_ != null ? nPages_ : 0
  console.log("Setting document stage with nPages: " + nPages)
  try {
    const authorization = await getAuthorization();
    if (sus === "docufen") return 222
    const update: DocumentUpdate = {
      documentId,
      newStage,
      reason,
      time,
      nPages
    }
    if (newStage === Stage.Uploaded) update.emptyCellCount = 0
    const res = await fetch(APIURL + "updatestage/?lng=" + lng, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      body: JSON.stringify(update),
      credentials: "include",
    });
    console.log("Status return: " + res.status.toString());
    if (res.status === 201) {
      return 0;
    } else if (res.status === 503) {
      // Probably unable to create document folder. Should unlock if this is the first lock
      console.log("Unable to create document folders on sharepoint (I think) unlock if at the start");
      return 1;
    } else if (res.status === 412) {
      console.log("recognised status of lock")
      const data: ErrorBody = await res.json() as unknown as ErrorBody;
      if (data.message && data.message === "Document Locked") {
        console.log("Returning 111");
        return 111
      } else if (data.message === "Hash not valid")
        return 222
      else return 999;
    } else if (res.status === 401) {
      console.log("User not logged in")
      return 401
    } else {
      console.log("Unable to set value setServerDocumentStage: status: " + res.status.toString());
      return 1;
    }
  } catch (err: unknown) {
    return 2;
  }
};

export const setServerEmptyCellCount = async (documentId: string, emptyCellCountChange: number, cellIndex: number[]) => {
  try {
    const authorization = await getAuthorization();
    if (sus === "docufen") return 1
    const res = await fetch(APIURL + "updateemptycells/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      body: JSON.stringify({
        documentId: documentId,
        emptyCellCountChange,
        cellIndex
      }),
      credentials: "include",
    });
    console.log("Status return: " + res.status.toString());
    if (res.status === 201) {
      return 0;
    } else if (res.status === 503) {
      // Probably unable to create document folder. Should unlock if this is the first lock
      console.log("Unable to create document folders on sharepoint (I think) unlock if at the start");
      return 1;
    } else if (res.status === 412) {
      console.log("recognised status of lock")
      const data: ErrorBody = await res.json() as unknown as ErrorBody;
      if (data.message && data.message === "Document Locked") {
        console.log("Returning 111");
        return 111
      } else return 999;
    } else {
      console.log("Unable to set value in setServerEmptyCellCount: status: " + res.status.toString());
      return 1;
    }
  } catch (err: unknown) {
    return 2;
  }
};



export const resendFailedAuditItemLog = async (body: string) => {
  try {
    console.log("Resending failed audit item: " + JSON.stringify(JSON.parse(body), null, 2))
    const authorization = await getAuthorization();
    const res = await fetch(APIURL + "item/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      body,
      credentials: "include",
    });
    if (res.status === 201) {
      return 0;
    } else if (res.status === 503) {
      // Probably unable to create document folder. Should unlock if this is the first lock
      console.log("Unable to create document folders on sharepoint (I think) unlock if at the start");
      return 1;
    } else if (res.status === 412) {
      // Document probably locked
      return 412;
    } else if (res.status === 401) {
      // User has been logged out
      return 401;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const reply = await res.json()
      console.log("error: " + JSON.stringify(reply))
      console.log("Unable to set value in sendAuditLogItem: status: " + res.status.toString());
      return 1;
    }
  } catch (err: unknown) {
    if (err instanceof Error)
      console.log("Post key value error" + err.message);
    return 2
  }
}

// eslint-disable-next-line no-unused-vars
export const callCreateControlledCopy: (documentId: string, lng: string) =>
  Promise<{ controlledCopyItem: ControlledCopyItem | null, errorCode: number }> = async (documentId: string, lng: string) => {
    try {
      const authorization = await getAuthorization();
      if (sus === "docufen") return { controlledCopyItem: null, errorCode: 401 }
      const res = await fetch(APIURL + "createcontrolledcopy/?lng=" + lng, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: BEARER + authorization,
        },
        body: JSON.stringify({
          documentId,
        }),
        credentials: "include",
      });
      if (res.status === 201) {
        const controlledCopyItem: ControlledCopyItem = await res.json() as unknown as ControlledCopyItem;
        return { controlledCopyItem, errorCode: 0 };
      } else if (res.status === 503) {
        console.log("Unable to create controlled copy");
        return { controlledCopyItem: null, errorCode: 1 };
      } else if (res.status === 412) {
        // Document probably locked
        return { controlledCopyItem: null, errorCode: 412 }
      } else if (res.status === 401) {
        // User not logged in
        return { controlledCopyItem: null, errorCode: 401 }
      } else if (res.status === 403) {
        // Header stale
        return { controlledCopyItem: null, errorCode: 403 }
      } else {
        console.log("Unable to create controlled copy: status: " + res.status.toString());
        return { controlledCopyItem: null, errorCode: 1 };
      }
    } catch (err: unknown) {
      if (err instanceof Error)
        console.log("Creating controlled copy failed" + err.message);
      return { controlledCopyItem: null, errorCode: 2 };
    }
  }


/**
 * Internal function that performs the actual audit log submission
 * This is wrapped by sendAuditLogItem to ensure sequential execution
 */
const sendAuditLogItemInternal = async (key: string, auditItem: AuditLogItem, content: string, lng: string, leaveLock?: boolean): Promise<number> => {
  let body: string
  leaveLock = leaveLock != null ? leaveLock : false

  // Add AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT); // 16 second timeout
  
  try {
    console.log("auditItem: " + JSON.stringify(auditItem));
    console.log("lng: " + lng);
    const authorization = await getAuthorization();
    body = JSON.stringify({
      key: key,
      value: auditItem,
      content,
      force: true,
      leaveLock
    })
    if (auditItem.actionType !== ActionType.InitialLock)
      localStorage.setItem(FAILEDBODY, body)
    
    try {
      const res = await fetch(APIURL + "item" + "/?lng=" + lng, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: BEARER + authorization,
        },
        body,
        credentials: "include",
        signal: controller.signal,
      });
      
      // Clear timeout on successful response
      clearTimeout(timeoutId);
      
      if (res.status === 201) {
        localStorage.removeItem(FAILEDBODY)
        return 0;
      } else if (res.status === 503) {
        // Probably unable to create document folder. Should unlock if this is the first lock
        console.log("Unable to create document folders on sharepoint (I think) unlock if at the start");
        return 1;
      } else if (res.status === 412) {
        // Document probably locked
        return 412;
      } else if (res.status === 401) {
        // User has been logged out
        return 401;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const reply = await res.json()
        console.log("error: " + JSON.stringify(reply))
        console.log("Unable to set value in sendAuditLogItem: status: " + res.status.toString());
        return 1;
      }
    } finally {
      // Ensure timeout is always cleared
      clearTimeout(timeoutId);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log("Post key value error: " + err.message);
      
      // Specifically handle timeout/abort
      if (err.name === 'AbortError') {
        console.error("Request timeout in sendAuditLogItem - network error detected");
        return 2; // Return 2 for network error
      }
    }
    return 2; // Generic network/fetch error
  }
}

/**
 * Public function to send audit log items
 * NOTE: Audit log requests are currently serialized by UI blocking (setWorking) in calling components.
 * The auditLogQueue.ts implementation is not currently used, but may be integrated in the future for async serialization.
 */
export const sendAuditLogItem = async (
  key: string,
  auditItem: AuditLogItem,
  content: string,
  lng: string,
  leaveLock?: boolean
): Promise<number> => {
  return sendAuditLogItemInternal(key, auditItem, content, lng, leaveLock);
};

export interface DocumentFullState {
  code: number
  documentContent: string
  documentName: string
  lastAuditItem: IAuditLogItem | null
  documentDescription: DocumentDescription | null
};

const noState: DocumentFullState = {
  code: 500,
  documentContent: "",
  documentName: "",
  lastAuditItem: null,
  documentDescription: null
}

export const getDocumentState = async (documentId: string) => {
  // const authorization = await getAuthorization()
  // if (sus === "docufen") return { code: 401, documentContent: "" }
  console.log("Getting document content: " + documentId)
  
  // Get current language from i18next
  const currentLanguage = i18n.language || 'en';
  const res = await fetch(APIURL + `getdocumentcontent/${documentId}/?lng=${currentLanguage}`, {
    method: "GET",
    headers: {
      'Accept-Language': currentLanguage,
    },
    credentials: "include"
  });
  if (res.status === 200) {
    console.log("Got document content")
    return await res.json() as unknown as DocumentFullState
  } else if (res.status === 503) {
    const state = noState
    state.code = 503
    return state
  } else if (res.status === 412) {
    // Document probably locked
    const state = noState
    state.code = 412
    return state
  } else if (res.status === 401) {
    const state = noState
    state.code = 401
    return state
  } else if (res.status === 403) {
    const state = noState
    state.code = 403
    return state
  } else if (res.status === 404) {
    const state = noState
    state.code = 404
    return state
  } else if (res.status === 410) {
    // Document has been deleted
    const state = noState
    state.code = 410
    return state
  } else {
    console.log("Unable to set value getDocument State: status: " + res.status.toString());
    return noState
  }
}

// Define participant structure
export interface Participant {
  name: string;
  email: string;
  // avatar?: string;
  id: string;
  initials?: string;
  signed?: boolean;
  isExternal?: boolean;
}

export const GroupTitles = {
  OWNERS: "Owners",
  PRE_APPROVAL: "Pre-Approval", 
  POST_APPROVAL: "Post-Approval",
  EXECUTION: "Executors",
  VIEWERS: "Viewers",
} as const;

export type GroupTitle = typeof GroupTitles[keyof typeof GroupTitles];

export interface ParticipantGroup {
  title: GroupTitle;
  participants: Participant[];
  icon: React.ReactNode;
  signingOrder?: boolean;
}

const createGroupsUpdateBody = (documentId: string, groups: ParticipantGroup[], groupTitle: GroupTitle, timestamp: number) => {
  // console.warn("documentId: " + documentId + " groupTitle: " + groupTitle + " groups: " + JSON.stringify(groups) + " timestamp: " + timestamp)
  const body =  JSON.stringify({
    documentId,
    groupTitle,
    groups: groups.map((group: ParticipantGroup) => ({
      title: group.title,
      participants: group.participants ? group.participants : [],
      signingOrder: group.signingOrder ? group.signingOrder : false,
    })),
    timestamp
  })
  return body
}

export interface DocumentDetailUpdate {
  documentName: string
  externalReference: string
  documentCategory: string
}
export const updateDocument = async (documentId: string, details: DocumentDetailUpdate) => {
  const url = SERVERURL + "document/update/"
  const authorization = await getAuthorization();
  if (sus === "docufen") return 401
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: BEARER + authorization,
    },
    body: JSON.stringify({
      documentId,
      ...details
    }),
    credentials: "include",
  })
  if (res instanceof Response) {
    if (res.status === 200) {
      return 0
    } else {
      return 1
    }
  } else {
    return 1
  }
}

export const updateParticipantGroups = async (documentId: string, groups: ParticipantGroup[], groupTitle: GroupTitle, timestamp: number): Promise<number> => {
  const url = SERVERURL + "document/updategroups/"
  const authorization = await getAuthorization();
  if (sus === "docufen") return 401

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: BEARER + authorization,
    },
    body: createGroupsUpdateBody(documentId, groups, groupTitle, timestamp),
    credentials: "include",
  })
  if (res instanceof Response) {
    if (res.status === 200) {
      return 0
    } else {
      return 1
    }
  } else {
    return 1
  }
}

export interface NewDocument {
  filename: string;
  documentName: string;
  externalReference: string;
  documentCategory: string
  stage: Stage
  tenantName: string;
  timezone: string;
  locale: string;
  docObject: string;
}

export const claimDocument = async (selectedDocumentId: string, documentData: NewDocument) => {
  const claimUrl = SERVERURL + "connector/claim-uploaded/" + selectedDocumentId;
  try {
    return createDocument(claimUrl, selectedDocumentId, documentData);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.error("Error claiming document:", error);
    throw error;
  }
}

export const registerDocument = async (documentId: string, documentData: NewDocument) => {
  try {
    // const authorization = await getAuthorization();
    // if (sus === "docufen") return 401
    const registerUrl = APIURL + "registerdocument/";
    return createDocument(registerUrl, documentId, documentData);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.error("Error registering document:", error);
    throw error;
  }
}

const createDocument = async (url: string, documentId: string, documentData: NewDocument): Promise<number> => {
  try {
    const body = JSON.stringify({
      documentId,
      ...documentData
    });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body,
      credentials: "include",
    });
    console.log("Called register: " + res.status.toString());
    if (res.status === 201) {
      return 0;
    } else if (res.status === 503) {
      console.log("Unable to create document folders on sharepoint (I think) unlock if at the start");
      return 1;
    } else if (res.status === 412) {
      // Document probably locked
      return 412;
    } else if (res.status === 401) {
      // User not logged in
      console.log("User not logged in" + JSON.stringify(await res.json()));
      return 401;
    } else if (res.status === 403) {
      // Header stale
      return 403;
    } else {
      console.log("Unable to set value registerDocument: status: " + res.status.toString());
      return 1;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log("Registering document failed: " + err.message);
      // Check for DNS resolution failure
      if (err.message.includes('ERR_NAME_NOT_RESOLVED') || 
          err.message.includes('Failed to fetch')) {
        console.error("DNS resolution failed - check network connection and domain");
        return 3; // New error code for DNS issues
      }
    }
    return 2;
  }
}

export interface ActivationData {
  companyInfo: CompanyInfo
  userManagers: UserDetails[]
}

export interface CompanyInfo {
  companyName: string
  companyAddress: string
  companyCity: string
  companyState: string
  companyPostCode: string
  companyCountry: string
  businessRegistrationNumber: string
  locale: string[]
  logo?: string | null
  // adminContacts?: ContactUser[]
  // complianceContacts?: ContactUser[]
  expires?: number
  status?: LicenseStatus
  ersdText?: string
  enforceDigitalSignatures?: boolean
  insertAtCursorMode?: boolean
  // companyName: string;
  // companyAddress: string;
  // businessNumber: string;
  // language: ('en' | 'es')[]; // Add more languages as needed
}

export interface UserDetails extends BaseUser {
  initials: string
  userType: UserType
  // companyName: string
  // logo: string
}

export interface UserDetailsError extends BaseUser {
  initials: string
}

export interface BaseUser {
  legalName: string
  email: string
  userType?: UserType
}

export interface ActivationData {
  companyInfo: CompanyInfo;
  userManagers: UserDetails[];
}

export const activateTrialAccount = async (activationData: ActivationData) => {
  const url = SERVERURL + `account/create/`
  const authorization = await getAuthorization();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: BEARER + authorization,
    },
    body: JSON.stringify(activationData),
    credentials: "include",
  });
  if (res instanceof Response) {
    console.log("Response status: " + res.status.toString());
    if (res.status === 201) {
      return 0
    } else if (res.status === 403) {
      const data = (await res.json()) as unknown as { message: string }
      if (data.message === "Account already exists") {
        return 999
      }
      return 1
    }
  } else {
    return 1
  }
}


export interface AccountResponse {
  code: number
  data?: CompanyInfo
}

export const fetchAccountData = async (tenantName: string) => {
  const url = SERVERURL + `account/${tenantName}/accountdetails/`
  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  })
  if (res instanceof Response) {
    if (res.status === 200) {
      return await res.json() as unknown as AccountResponse
    } else {
      return { code: res.status }
    }
  } else {
    return { code: 500 }
  }
}

export interface ContactUser {
  email: string
  legalName?: string
  documentName?: string
  documentNumber?: string
  versionNo?: string
  documentFileName?: string
  fileName?: string
}

export interface ContactUsers {
  adminContacts: ContactUser[],
  complianceContacts: ContactUser[]
}


export const updateAccountData = async (tenantName: string, updates: Partial<CompanyInfo>): Promise<number> => {
  const url = SERVERURL + `account/${tenantName}/accountdetails/`
  if (Object.keys(updates).length === 0) return 200
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updates),
    credentials: "include"
  })
  if (res instanceof Response) {
    if (res.status === 200 || res.status === 201) {
      return 200
    } else {
      return res.status
    }
  } else {
    return 500
  }
}

export const deleteContacts = async (tenantName: string, deletionTargets: ContactUsers): Promise<number> => {
  const url = SERVERURL + `account/${tenantName}/accountdetails/`
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(deletionTargets),
    credentials: "include"
  })
  if (res instanceof Response) {
    if (res.status === 200 || res.status === 201) {
      return 200
    } else {
      return res.status
    }
  }
  else return 500
}

export interface DocumentsListResult {
  documents: DocumentDescription[]
  numberOfDocuments: number
}

export type ActiveTab = "all" | "pre-approval" | "execution" | "post-approval" | "completed" | "final-pdf"

export const fetchDocumentsList = async (
  tenantName: string,
  activeTab: ActiveTab,
  page: number = 1,
  pageSize: number = 20,
  cacheBuster?: boolean
): Promise<DocumentsListResult> => {
  let url = SERVERURL + `users/${tenantName}/documents/${page}/${pageSize}/${activeTab}/`

  // Add cache busting parameter if requested
  if (cacheBuster) {
    const timestamp = Date.now();
    url = url + `?_=${timestamp}`;
  }

  const authorization = await getAuthorization();
  if (sus === "docufen") return { documents: [], numberOfDocuments: 0 }
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: BEARER + authorization,
    },
    credentials: "include",
  });
  if (res instanceof Response) {
    if (res.status == 200) {
      const data = (await res.json()) as unknown as DocumentsListResult
      return data
    } else {
      console.log("Unable to fetch documents list: " + res.status.toString())
      return { documents: [], numberOfDocuments: 0 }
    }
  } else {
    console.log("Unable to fetch documents list: " + JSON.stringify(res))
    return { documents: [], numberOfDocuments: 0 }
  }
}

export interface IBaseResult {
  statusOK: boolean
  timestamp?: number
  sus?: string
  error?: string
}


export const getUserTenantProps = async (documentId: string): Promise<UserTenantProps> => {
  console.log("getting user initials");
  let res: Response;
  const url = `${APIURL}getusertenantprops/${documentId}/`;
  try {
    res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn("Unable to get initials: " + err.message)
      return { legalName: "", initials: "", userType: null, error: err.message, ersdSigned: 0 }
    } else {
      return { legalName: "", initials: "", userType: null, ersdSigned: 0, error: "Unknown Error" }
    }
  }
  let data: UserTenantProps = { legalName: "", initials: "", userType: null, ersdSigned: 0 };
  console.log("BResponse status: " + res.status.toString());
  if (res.status === 200) {
    data = (await res.json()) as unknown as UserTenantProps;
    console.log("TenantProps set: " + JSON.stringify(data))
  } else {
    if (res.status === 403) {
      data.error = "Wrong tenant"
    }
  }
  return data
}

export const setInitialDocumentContent = async (
  // documentId: string, auditItem: IAuditLogItem, content: string
): Promise<IBaseResult> => {
  return { statusOK: true }
}

export interface LoginMessage {
  status: string
  legalName: string
  email: string
  userId: string
  title: string
  company: string
  tenantName: string
  tenants: Record<string, UserTenantProps>
  locale?: string
  sus?: string
  oid?: string;
  sid?: string;
  error?: string
}

// interface LoginError {
//   message: string
// }
export interface ValidationFailure {
  time: string,
  initialContent: string,
  finalContent: string,
  cellIndex: number[],
  message: string
}

export const callVerifyDocumentContents = async (documentId: string, content: string, setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>) => {
  const url: string = `${APIURL}verify/`;
  let res: Response;
  if (sus === "docufen") {
    return { statusOK: false, error: "Not ready" }
  }
  const body = {
    documentId,
    content
  }
  try {
    const authorization = await getAuthorization();
    res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization
      },
      body: JSON.stringify(body),
      credentials: "include"
    });
  } catch (err: unknown) {
    if (err instanceof Error)
      console.error("Server not responding: " + err.message)
    return { statusOK: false, error: "Server not responding" }
  }
  interface ExpectedResponse {
    statusOK: boolean,
    time: string,
    sus?: string,
    error?: string,
    message?: string,
  }

  let data: ExpectedResponse = {
    statusOK: false,
    time: ""
  };
  try {
    if (res instanceof Response) {
      if (res.status === 200) {
        data = (await res.json()) as unknown as ExpectedResponse;
        console.log("Verified document: " + JSON.stringify(data))
      } else if (res.status === 401) {
        setLoggedIn(false)
        data.error = "401: User not logged in"
        console.log("Login Check: Not logged in.");
      } else if (res.status === 403) {
        setLoggedIn(false)
        data.error = "403: User not logged in"
        console.log("Login Check: Not logged in.");
      } else if (res.status === 412) {
        data = (await res.json()) as unknown as ExpectedResponse;
        console.log("Failed to verified document: " + JSON.stringify(data))
      } else {
        console.log("Unknown error verify " + res.status.toString() + " " + JSON.stringify(await res.json()));
        data.error = "500: Unknown error"
      }
    } else {
      console.log("res is not instance of Response");
      data.error = "500: Unknown error"
    }
  } catch (err: unknown) {
    if (err instanceof Error)
      console.log("Unknown error in login check " + err.message);
    if (err instanceof Error) {
      console.log("message: " + err.message)
      data.error = "500: " + err.message
    }
  }
  if (data?.sus != null) {
    console.log("updating sus from inside callVerifyDocumentContents: ")
    updateSus(data.sus)
  }
  return data;
}

// eslint-disable-next-line no-unused-vars
export const logoutUser = async () => {
  const url = SERVERURL + "logout/";
  let res: Response;
  try {
    // const authorization = await getAuthorization();
    res = await fetch(url, {
      method: "GET",
      // headers: {
      //   authorization: BEARER + authorization,
      // },
      credentials: "include",
    });
  } catch (err: unknown) {
    console.log("Logout failed: " + (err instanceof Error ? err.message : "Unknown error"));
    return
  }
  try {
    if (res.status === 200) {
      console.log("Completed session logout");
    }
  } catch (err: unknown) {
    if (err instanceof Error)
      console.log("caught error: " + err.message);
  }
};


export const sendPageCount = async (documentId: string, pageCount: number) => {
  const url = APIURL + "pagecount/";
  let res: Response;
  try {
    const authorization = await getAuthorization();
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      credentials: "include",
      body: JSON.stringify({
        documentId,
        pageCount
      }),
    });
  } catch (err: unknown) {
    if (err instanceof Error)
      console.error("Sending pagecount failed: " + err.message);
    return
  }
  try {
    if (res.status === 201) {
      console.log("Page count sent")
      return
    } else {
      console.warn("Non 201 response from pagecount url")
    }
  } catch (err) {
    if (err instanceof Error)
      console.error("Error reading response from pagecount url: " + err.message);
    return
  }
}

export interface AuditLogItemResponse {
  auditLogItem: IAuditLogItem | null,
  timestamp: number,
  locale?: string,
  error?: string
}

export const getDocumentLock = async (
  // documentId: string
): Promise<IBaseResult> => {
  return new Promise<IBaseResult>(async (resolve) => {
    resolve({ statusOK: true, timestamp: (new Date()).getTime() })
  })
}

let localLock = false
export const getLastAuditLogItem = async (key: string, withLock: boolean): Promise<AuditLogItemResponse> => {
  console.log("getting last audit log item in getLastAuditLogItem");
  let res: Response;
  const varUrl = withLock ? "itemslock/" : "items/";
  
  // Get current language from i18next
  const currentLanguage = i18n.language || 'en';
  const url = APIURL + varUrl + key + "/?lng=" + currentLanguage;
  
  if (localLock) {
    console.warn("getLastAuditLogItem: local lock is true")
    throw new BusyException("getLastAuditLogItem: local lock is true");
  }
  localLock = true
  try {
    if (sus === "docufen") {
      console.log("Client not ready")
      localLock = false
      return { auditLogItem: null, timestamp: 0 }
    }
    const authorization = await getAuthorization();
    
    // Add AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT); // 8 second timeout
    
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: BEARER + authorization,
          'Accept-Language': currentLanguage,
        },
        credentials: "include",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Unable to get audit items: " + err.message)
      localLock = false
      // Specifically handle timeout/abort
      if (err.name === 'AbortError') {
        return { auditLogItem: null, timestamp: 0, error: "Request timeout - check network connection" }
      }
      return { auditLogItem: null, timestamp: 0, error: err.message }
    } else {
      console.error("Unable to get audit items: " + "Unknown Error")
      localLock = false
      return { auditLogItem: null, timestamp: 0, error: "Unknown Error" }
    }
  }
  await new Promise(resolve => setTimeout(resolve, 10)); // Ensure the editor is ready
  let data: { value: IAuditLogItem, timestamp: number, sus: string } = { value: nullAuditLog, timestamp: 0, sus: "" };
  console.log("DResponse status: " + res.status.toString());
  if (res.status == 200) {
    data = (await res.json()) as unknown as { value: AuditLogItem, timestamp: number, sus: string };
  } else if (res.status === 401) {
    const errorData = res.json() as unknown as ErrorBody
    const message = errorData.message ? errorData.message : "Unauthorized: "
    console.log("Catching user logged out: " + message);
    localLock = false
    if (message === "Header unauthorized")
      return { auditLogItem: null, timestamp: 0, error: "Unauthorised: Header unauthorized" }
    return { auditLogItem: null, timestamp: 0, error: "Unauthorised: Possible stale session" }
  } else if (res.status == 404) {
    console.log("Getting audit log item return 404");
    const errorData = res.json() as unknown as { message: string, locale?: string }
    const locale: string | undefined = errorData.locale
    localLock = false
    return { auditLogItem: null, timestamp: 0, locale, error: "Document not found" }
  } else if (res.status === 412) {
    console.log("Document locked in get last audit log item")
    localLock = false
    return { auditLogItem: null, timestamp: 0, error: "Document is locked" }
  } else if (res.status === 403) {
    console.log("Authorization Failure")
    localLock = false
    return { auditLogItem: null, timestamp: 0, error: "Document is locked" }
  } else {
    console.log("Strange key value returned with status: " + res.status.toString() + " " + res.toString());
    localLock = false
    return { auditLogItem: null, timestamp: 0, error: "Strange key value returned with status: " + res.status.toString() }
  }
  if (data == null) {
    console.log("returning null");
    localLock = false
    return { auditLogItem: null, timestamp: 0 };
  }
  if (data.sus != null) {
    console.log("updating sus from inside getLastAuditLogItem:")
    updateSus(data.sus)
  }
  localLock = false
  return { auditLogItem: data.value, timestamp: data.timestamp };
};

export interface UploadResult {
  url: string
  pageCount: number
  error?: string
}

export const uploadFile = async (
  documentId: string, name: string, file: Blob, filename: string
): Promise<UploadResult> => {
  const formData = new FormData();
  // const safeName = encodeURI(name)
  // const safeFilename = encodeURI(filename)
  formData.append(name, file, filename)
  const url: string = `${UPLOADURL}${documentId}/`
  if (sus === "docufen") return { url: "", pageCount: -1, error: "User not logged in... upload failed" }
  const authorization = await getAuthorization();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: BEARER + authorization,
    },
    body: formData,
    credentials: "include",
  });
  console.log("Fetched ? : " + res.status.toString());
  // try {
  if (res instanceof Response) {
    if (res.status === 201 || res.status === 202) {
      const resData = (await res.json()) as unknown as UploadResult;
      console.log("Url recieved: " + resData.url);
      const url = resData.url ? resData.url : ""
      const pageCount = resData.pageCount ? resData.pageCount : -1
      return { url: url, pageCount: pageCount };
    } else if (res.status === 401) {
      await res.json()
      return { url: "", pageCount: -1, error: "User not logged in or token expired... upload failed" }
      // throw new NotLoggedInError("User not logged in or token expired")
    } else if (res.status === 400) {
      const responseBody = await res.json() as unknown as { message: string }
      const message = responseBody.message
      console.log("No url returned file upload failed: status: " + JSON.stringify(responseBody));
      console.log("message: " + message)
      return { url: "", pageCount: -1, error: "User not configured__" + message }
      // throw new UserNotConfigured(message)
    } else if (res.status === 413) {
      await res.json()
      console.warn("Attachment is too large")
      return { url: "", pageCount: -1, error: "Attachment too large" }
      // throw new AttachmentTooLarge(responseBody.message)
    } else {
      console.log("Unable to upload file for unknown reason: ")
      return { url: "", pageCount: -1, error: "Unknown error" }
    }
  } else {
    console.log("res not instance of Response");
    return { url: "", pageCount: -1, error: "Unknown error" }
  }
};

export const getUsersData = async (): Promise<UsersDataJson> => {
  const url = `${SERVERURL}users/all/`
  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  })
  if (res instanceof Response) {
    console.log("getUsersData: Response status: " + res.status.toString());
    if (res.status === 200) {
      const data = await res.json() as unknown as UsersDataJson;

      // Map backend canAccessAllDocuments to frontend canAccessAllDocuments
      if (data.users && data.users.length > 0) {
        data.users = data.users.map(user => {
          // Create a typed user record that can handle both properties
          const backendUser = user as any;
          const mappedUser = { ...user };

          if (backendUser.canAccessAllDocuments !== undefined) {
            (mappedUser as any).canAccessAllDocuments = !!backendUser.canAccessAllDocuments;
            delete backendUser.canAccessAllDocuments;
          }

          return mappedUser;
        });
      }

      return data;
    } else {
      return { users: [] }
    }
  } else {
      return { users: [] }
  }
}

export type UserFilter = "all" | "created" | "updated" | "deleted"
// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  name: string;
  action: string;
  details: string;
  performedBy: string;
}

export interface AccountAuditLogItem {
  id: string
  actorId: string
  actor: string
  action: string
  target?: string
  actionType: "user" | "system"
  detailsKey: string
  detailsData: { newData: string }
  timestamp: number
  year: string
}

export interface UserLogsResponse {
  systemLog: AccountAuditLogItem[], numberOfItems: number
}

export const fetchUserAuditLogs = async (tenantName: string, page: number, pageSize: number, filter: UserFilter): Promise<UserLogsResponse> => {
  const url = SERVERURL + `account/${tenantName}/userlogs/${page}/${pageSize}/${filter}/`
  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  })
  if (res.status === 200) {
    const result = await res.json() as unknown as UserLogsResponse
    return result
  } else {
    return { systemLog: [], numberOfItems: 0 }
  }
}

/**
 * Void a document
 * @param documentId - ID of the document to void
 * @param from - Previous document stage
 * @param reason - Reason for voiding the document
 * @param language - Current language for localization
 * @returns Response with status information
 */
export const voidDocument = async (documentId: string, from: string, reason: string, language: string) => {
  console.log(`Voiding document: ${documentId} with reason: ${reason}`);

  try {
    const authorization = await getAuthorization();
    const res = await fetch(`${APIURL}voiddocument/${documentId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
        Authorization: BEARER + authorization
      },
      credentials: 'include',
      body: JSON.stringify({ from, reason })
    });

    if (res.status === 200) {
      return { success: true, error: null };
    } else {
      const errorData = await res.json();
      console.error("Error voiding document:", errorData);
      return { success: false, error: errorData.message || "Failed to void document" };
    }
  } catch (error) {
    console.error("Error voiding document:", error);
    return { success: false, error: "Failed to void document" };
  }
};

export const shredDocument = async (documentId: string) => {
  console.log(`Shredding document: ${documentId}`);  try {
    const authorization = await getAuthorization();
    const url = `${SERVERURL}document/${documentId}/shred/`
    console.log("Delete URL: " + url)
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: BEARER + authorization
      },
      credentials: 'include'
    });

    if (res.status === 200) {
      return { success: true, error: null };
    } else {
      const errorData = await res.json();
      console.error("Error deleting document:", errorData);
      return {
        success: false,
        error: errorData.message || "Failed to delete document",
        code: res.status
      };
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}
/**
 * Delete a document with content
 * @param documentId - ID of the document to delete
 * @param language - Current language for localization
 * @returns Response with status information
 */
export const deleteDocument = async (documentId: string, language: string) => {
  console.log(`Deleting document: ${documentId}`);

  try {
    const authorization = await getAuthorization();
    const url = `${SERVERURL}document/delete/${documentId}/`
    console.log("Delete URL: " + url)
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept-Language': language,
        Authorization: BEARER + authorization
      },
      credentials: 'include'
    });

    if (res.status === 200) {
      return { success: true, error: null };
    } else {
      const errorData = await res.json();
      console.error("Error deleting document:", errorData);
      return {
        success: false,
        error: errorData.message || "Failed to delete document",
        code: res.status
      };
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
};

/**
 * Clean up any document-related data in localStorage
 * @param documentId - ID of the document to clean up
 */
export const cleanupDocumentStorage = (documentId: string) => {
  // nothing to do
  console.debug("cleanupDocumentStorage: " + documentId)
}


export interface SignatureImageVerificationResponse {
  code: number; // HTTP status code
  url?: string; // URL of the signature image if verification is successful
}

/**
 * Verify a user's digital signature
 * @param userId The ID of the user to verify
 * @param verificationType The type of verification: "image", "notation", or "microsoft"
 * @param notationText Optional notation text (for "notation" type)
 * @param file Optional file (for "image" type)
 * @returns 0 for success, status code for failure
 */
export const verifyUserSignature = async (
  userId: string,
  verificationType: IDigitalSignatureVerification,
  notationText?: string,
  file?: File
): Promise<SignatureImageVerificationResponse | number> => {
  const url = SERVERURL + `users/user/${userId}/signature-verification/`;
  const authorization = await getAuthorization();

  if (sus === "docufen") return 401;

  try {
    // For image uploads, use FormData
    if (verificationType === "Verified Image" && file) {
      const formData = new FormData();
      formData.append("verificationType", verificationType);
      formData.append("file", file);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: BEARER + authorization,
        },
        body: formData,
        credentials: "include",
      });
      if (res.status === 200) {
        const responseData = await res.json();
        return { code: res.status, url: responseData.url };
      } else {
        console.error("Error verifying user signature:", res.statusText);
        return { code: res.status }
      }
    }
    // For notation or microsoft verification, use JSON
    else {
      const requestBody: Record<string, string> = {
        verificationType
      };

      if (verificationType === "Verified Register Notation" && notationText) {
        requestBody.notation = notationText;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: BEARER + authorization,
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      return res.status;
    }
  } catch (error) {
    console.error("Error verifying user signature:", error);
    return 500;
  }
};

export const callRevokeSignatureVerification = async (userId: string) => {
  const url = SERVERURL + `users/user/${userId}/revoke-signature-verification/`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return res.status;
  } catch (error) {
    console.error("Error revoking signature verification:", error);
    return 500;
  }
}

export const saveMessage = async (documentId: string, chatMessage: ChatMessage, content: string): Promise<BasicResult> => {
  const url = `${SERVERURL}document/addcomment/${documentId}/`;
  const authorization = await getAuthorization();
  try {
    const r: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      body: JSON.stringify({
        chatMessage,
        content
      }),
      credentials: "include",
    })
    if (r.status != 201) {
      return { statusOK: false, error: "Unable to set value in saveMessage: status: " + r.status.toString() }
    }
    return { statusOK: true }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error saving message" + err.message);
      return { statusOK: false, error: "Error saving message" + err.message }
    }
    return { statusOK: false, error: "Error saving message" + JSON.stringify(err) }
  }
}

export const callDeleteMessage = async (documentId: string, msgTimestamp: number): Promise<BasicResult> => {
  const url = SERVERURL + `document/comment/${documentId}/${msgTimestamp}/`;
  const authorization = await getAuthorization();
  try {
    const r: Response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      credentials: "include",
    })
    if (r.status != 204) {
      return { statusOK: false, error: "Unable to set value in deleteMessage: status: " + r.status.toString() }
    }
    return { statusOK: true }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error deleting message" + err.message);
      return { statusOK: false, error: "Error deleting message" + err.message }
    }
    return { statusOK: false, error: "Error deleting message" + JSON.stringify(err) }
  }
}

export const releaseLock = async (documentId: string): Promise<BasicResult> => {
  const url = SERVERURL + "api/releaselock/";
  const authorization = await getAuthorization();
  try {
    const r: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: BEARER + authorization,
      },
      body: JSON.stringify({
        documentId
      }),
      credentials: "include",
    })
    if (r.status != 200) {
      return { statusOK: false, error: "Unable to set value in releaseLock: status: " + r.status.toString() }
    }
    return { statusOK: true }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error releasing lock" + err.message);
      return { statusOK: false, error: "Error releasing lock" + err.message }
    }
    return { statusOK: false, error: "Error releasing lock" + JSON.stringify(err) }
  }
}

export const getUserData = async (userId: string): Promise<DocufenUser | null> => {
  const url = SERVERURL + `users/user/${userId}/`
  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  })
  if (res instanceof Response) {
    if (res.status === 200) {
      const userData = await res.json() as unknown as DocufenUser;
      
      // Map backend canAccessAllDocuments to frontend canAccessAllDocuments if needed
      const backendUser = userData as any;
      if (backendUser.canAccessAllDocuments !== undefined) {
        (userData as any).canAccessAllDocuments = !!backendUser.canAccessAllDocuments;
        delete backendUser.canAccessAllDocuments;
      }

      return userData;
    } else {
      console.error(`Failed to fetch user data for ${userId}, status: ${res.status}`);
      return null;
    }
  } else {
    console.error(`Invalid response when fetching user data for ${userId}`);
    return null;
  }
}

export const apiRequest = async (input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response> => {
  const authorization = await getAuthorization();
  if (sus === "docufen") {
    console.warn("Docufen not ready")
    throw new NotLoggedInError("Docufen not ready")
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: BEARER + authorization,
  };
  
  // Merge custom headers if provided
  if (init?.headers) {
    Object.assign(headers, init.headers);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  return response;
}
