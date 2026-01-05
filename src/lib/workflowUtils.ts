import { Stage } from '@/components/editor/lib/lifecycle';
import { Participant, ParticipantGroup } from './apiUtils';

/**
 * Check if a user is in the workflow for a specific stage
 * 
 * @param stage Document stage to check
 * @param participant User to check for
 * @returns True if the user is in the workflow for the given stage
 */
export function checkUserInWorkflow(stage: Stage, participant: Participant | null, groups: ParticipantGroup[]): boolean {
  if (!participant) return false;
  
  // Map stage to group index
  let groupIndex: number;
  switch (stage) {
    case Stage.PreApprove:
      groupIndex = 0; // Pre-Approval
      break;
    case Stage.Execute:
      groupIndex = 1; // Execution
      break;
    case Stage.PostApprove:
      groupIndex = 2; // Post-Approval
      break;
    default:
      return false;
  }
  
  // Get the data directly from JSON to avoid UI rendering issues
  // const data = getWorkflowData();
  // const groups = data.participantGroups;
  
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return false;
  
  const group = groups[groupIndex];
  if (!group || !group.participants || group.participants.length === 0) return false;
  
  // Check if the user is in the group
  return group.participants.some((p: Participant) => 
    // Match by ID (most reliable)
    (participant.id && p.id && p.id === participant.id) ||
    // Match by email
    (participant.email && p.email && p.email === participant.email) ||
    // Match by name (least reliable)
    (participant.name && p.name && p.name === participant.name) ||
    // Match by initials
    (participant.initials && p.initials && p.initials === participant.initials)
  );
}

/**
 * Add a participant to a specific group in the workflow
 * 
 * @param groupIndex Index of the group to add the participant to
 * @param participant Participant to add
 */
export function addParticipantToGroup(groupIndex: number, participant: Participant, groups: ParticipantGroup[]): ParticipantGroup[] | null {
  
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return null;
  
  // Clone the groups
  const newGroups = [...groups];
  
  // Make sure the participants array exists
  if (!newGroups[groupIndex].participants) {
    newGroups[groupIndex].participants = [];
  }
  
  // Check if participant already exists
  const exists = newGroups[groupIndex].participants.some((p: Participant) => 
    (p.id && participant.id && p.id === participant.id) ||
    (p.email && participant.email && p.email === participant.email)
  );
  
  // Add the participant if they don't already exist
  if (!exists) {
    newGroups[groupIndex].participants.push(participant);
    return newGroups
    // Update the data
  } else {
    return null
  }
}

/**
 * Remove a participant from a specific group in the workflow
 * 
 * @param groupIndex Index of the group to remove the participant from
 * @param participantId ID of the participant to remove
 */
export function removeParticipantFromGroup(groupIndex: number, participantId: string, groups: ParticipantGroup[]): ParticipantGroup[] | null {
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return null
  
  // Clone the groups
  const newGroups = [...groups];
  
  // Make sure the participants array exists
  if (!newGroups[groupIndex].participants) return null
  
  // Remove the participant
  newGroups[groupIndex].participants = newGroups[groupIndex].participants.filter((p: Participant) => p.id !== participantId);
  return newGroups
}

/**
 * Mark a participant as having signed in a specific workflow group
 * 
 * @param stage Document stage where the signing occurred
 * @param participant The participant who signed
 * @returns True if the participant was found and marked as signed
 */
export function markParticipantAsSigned(stage: Stage, participant: Participant | null, groups: ParticipantGroup[]): ParticipantGroup[] | null {
  if (!participant) return null;
  
  // Map stage to group index
  let groupIndex: number;
  switch (stage) {
    case Stage.PreApprove:
      groupIndex = 0; // Pre-Approval
      break;
    // case Stage.Execute:
    //   groupIndex = 1; // Execution
    //   break;
    case Stage.PostApprove:
      groupIndex = 2; // Post-Approval
      break;
    default:
      return null;
  }
  
  // Get the data directly from JSON
  
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return null;
  
  const group = groups[groupIndex];
  if (!group || !group.participants || group.participants.length === 0) return null;
  
  // Find the participant in the group
  let found = false;
  const newGroups = [...groups];
  const participants = [...(newGroups[groupIndex].participants)];
  
  // Update the participant's signed status
  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    
    // Check if this is our participant
    if ((participant.id && p.id && p.id === participant.id) ||
        (participant.email && p.email && p.email === participant.email)) {
      
      // Mark as signed
      participants[i] = { ...p, signed: true };
      found = true;
    }
  }
  
  // If we found and updated a participant, save the changes
  if (found) {
    newGroups[groupIndex] = { ...newGroups[groupIndex], participants };
    return newGroups
    // Update the data
  } else 
    return null
}

/**
 * Check if a participant is next in the signing order
 * 
 * @param stage Document stage where the signing is occurring
 * @param participant The participant attempting to sign
 * @returns True if the participant is next in line to sign or if signing order is not enabled
 */
export function isParticipantNextInLine(stage: Stage, participant: Participant | null, groups: ParticipantGroup[]): boolean {
  if (!participant) return false;
  
  // Map stage to group index
  let groupIndex: number;
  switch (stage) {
    case Stage.PreApprove:
      groupIndex = 0; // Pre-Approval
      break;
    case Stage.Execute:
      groupIndex = 1; // Execution
      break;
    case Stage.PostApprove:
      groupIndex = 2; // Post-Approval
      break;
    default:
      return false;
  }
  
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return false;
  
  const group = groups[groupIndex];
  if (!group || !group.participants || group.participants.length === 0) return false;
  
  // If signing order is not enabled, anyone in the group can sign
  if (!group.signingOrder) return true;
  
  // Find the first unsigned participant in the group (respecting the order)
  for (let i = 0; i < group.participants.length; i++) {
    const p = group.participants[i];
    
    // If we find a participant who hasn't signed yet, check if it's our participant
    if (!p.signed) {
      // Check if this unsignedParticipant is our participant
      return Boolean(
        (participant.id && p.id && p.id === participant.id) ||
        (participant.email && p.email && p.email === participant.email) ||
        (participant.name && p.name && p.name === participant.name) ||
        (participant.initials && p.initials && p.initials === participant.initials)
      );
    }
  }
  
  // If all participants have signed, no one is next in line
  return false;
}

/**
 * Get the index of the next participant who needs to sign
 * 
 * @param stage Document stage to check
 * @returns The index of the next participant to sign, or -1 if not found or signing order not enabled
 */
export function getNextSignerIndex(stage: Stage, groups: ParticipantGroup[]): number {
  // Map stage to group index
  let groupIndex: number;
  switch (stage) {
    case Stage.PreApprove:
      groupIndex = 0; // Pre-Approval
      break;
    case Stage.Execute:
      groupIndex = 1; // Execution
      break;
    case Stage.PostApprove:
      groupIndex = 2; // Post-Approval
      break;
    default:
      return -1;
  }
  
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return -1;
  
  const group = groups[groupIndex];
  if (!group || !group.participants || group.participants.length === 0) return -1;
  
  // If signing order is not enabled, return -1
  if (!group.signingOrder) return -1;
  
  // Find the first unsigned participant in the group
  for (let i = 0; i < group.participants.length; i++) {
    if (!group.participants[i].signed) {
      return i;
    }
  }
  
  // If all participants have signed, return -1
  return -1;
}

/**
 * Check if all participants in a specific stage have signed
 * 
 * @param stage Document stage to check
 * @param groups The participant groups
 * @returns True if all participants in the stage have signed or if there are no participants
 */
export function areAllParticipantsSigned(stage: Stage, groups: ParticipantGroup[]): boolean {
  // Map stage to group index
  let groupIndex: number;
  switch (stage) {
    case Stage.PreApprove:
      groupIndex = 0; // Pre-Approval
      break;
    case Stage.Execute:
      groupIndex = 1; // Execution
      break;
    case Stage.PostApprove:
      groupIndex = 2; // Post-Approval
      break;
    default:
      return false;
  }
  
  // Make sure the group exists
  if (!groups || groupIndex >= groups.length) return false;
  
  const group = groups[groupIndex];
  if (!group || !group.participants) return true; // No participants means all are signed
  if (group.participants.length === 0) return true; // Empty group means all are signed
  
  // Check if any participant hasn't signed
  return group.participants.every(participant => participant.signed === true);
} 