import { User } from "@/lib/User";
import { LoginMessage } from "@/lib/apiUtils";

export const DOCUFENID = "docufenId";
export const HEADERSANDFOOTERS = "headersAndFooters";

// This is duplicated in verify-server Make sure to keep both up to date
export enum Stage {
  Draft = 0,
  External = 1,
  Uploaded = 2,
  PreApprove = 3,
  PreExecute = 4,
  Execute = 5,
  PostApprove = 6,
  Closed = 7,
  Finalised = 8,
  Voided = 9
}

export const getFullUser = (msg: LoginMessage) => {
  // setErrorMessage("msg.status: " + msg.status);
  let updatedUser: User = {
      userId: msg.userId,
      email: msg.email,
      // title: msg.title,
      // company: msg.company,
      tenantName: msg.tenantName,
      tenants: msg.tenants,
    };
    if (msg.locale != null) updatedUser.locale = msg.locale;
  return updatedUser;
}


export const updateUser = (user: User, updatedUser: User) => {
  if (user?.email === updatedUser?.email) {
    if (user.tenants != null) {
      console.log("reusing tenantProps: " + JSON.stringify(user.tenants))
      updatedUser.tenants = user.tenants
    } else {
      console.log("new user so not using tenantProps")
    }
  }
}

export interface OptionalReactFunctions {
  setMissingProperty?: (prop: string) => void,
  toggleUserNotConfigured?: () => void
  setDocumentLanguage: (language: string) => void,
  setDocumentLanguages: (languages: string[]) => void
}
