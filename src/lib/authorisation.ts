
export enum UserType {
  COLLABORATOR         = 'COLLABORATOR',
  CREATOR             = 'CREATOR',
  USER_MANAGER  = 'USER_MANAGER',
  SITE_ADMINISTRATOR  = 'SITE_ADMINISTRATOR',
  TRIAL_ADMINISTRATOR = 'TRIAL_ADMINISTRATOR',
}

export type Capability =
  | 'COMPLETE_DOCUMENTS'   // finish reviews / signatures
  | 'CREATE_DOCUMENTS'     // upload or draft docs
  | 'MANAGE_DOCUMENTS'     // view *all* docs, transfer owner, delete
  | 'MANAGE_USERS'         // invite / edit users
  | 'MANAGE_SITE'         // license & tenant-level settings
  | 'MANAGE_ESIGNATURES'  // verify digital signatures
  | 'MANAGE_TOKENS';      // create / manage API tokens

export const RoleCapabilities: Record<UserType, Capability[]> = {
  [UserType.COLLABORATOR]:       ['COMPLETE_DOCUMENTS'],
  [UserType.CREATOR]:            ['CREATE_DOCUMENTS', 'COMPLETE_DOCUMENTS'],
  [UserType.USER_MANAGER]:       ['CREATE_DOCUMENTS', 'COMPLETE_DOCUMENTS', 'MANAGE_USERS','MANAGE_ESIGNATURES'],
  [UserType.SITE_ADMINISTRATOR]: ['MANAGE_USERS', 'MANAGE_SITE', 'MANAGE_DOCUMENTS', 'MANAGE_TOKENS'],
  [UserType.TRIAL_ADMINISTRATOR]:[
    'CREATE_DOCUMENTS',
    'COMPLETE_DOCUMENTS',
    'MANAGE_USERS',
    'MANAGE_SITE',
    'MANAGE_DOCUMENTS',
    'MANAGE_ESIGNATURES',
    'MANAGE_TOKENS'
  ],
};

export const hasCapability = (
  role: UserType,
  capability: Capability
): boolean => {
  if (role == null) return false
  if (RoleCapabilities[role] == null) return false
  return RoleCapabilities[role].includes(capability);
}
