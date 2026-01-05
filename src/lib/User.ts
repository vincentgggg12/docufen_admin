import { IDigitalSignatureVerification } from "./apiUtils"
import { UserType } from "./authorisation"

export type UserTenantProps = {
  legalName: string
  initials: string
  userType: UserType | null
  ersdSigned: number
  logo?: string | null
  companyName?: string
  tenantDisplayName?: string
  canAccessAllDocuments?: boolean
  showEveryonesDocuments?: boolean
  connectorsEnabled?: boolean
  digitalSignatureVerification?: IDigitalSignatureVerification
  digitalSignatureUrl?: string
  digitalSignatureNotation?: string
  digitalSignatureVerifiedBy?: string
  digitalSignatureVerifiedAt?: number
  invitationStatus?: string
  error?: string
  isExternal?: boolean
}

export type RUser = {
  userId: string
  email: string
  title: string
  company: string
  locale?: string
  tenantName: string
  tenants: { [key: string]: UserTenantProps }
  userSignatureImage?: string
}

export type User = {
  userId: string
  email: string
  avatar?: string
  // title: string
  // company: string
  tenantName: string
  locale?: string
  homeTenantName?: string
  tenants: { [key: string]: UserTenantProps }
  userSignatureImage?: string
}
