import { useMemo } from 'react';
import { GroupTitles, Participant, ParticipantGroup } from '@/lib/apiUtils';
import { useTranslation } from 'react-i18next';

export function useParticipants(participantGroups: ParticipantGroup[]) {
  // Get all unique participants
  const { t } = useTranslation();
  const allUniqueParticipants = useMemo(() => {
    const uniqueParticipants: Participant[] = [];
    const uniqueIds: string[] = [];
    participantGroups.forEach(group => {
      if (group.participants && group.participants.length > 0) {
        group.participants.forEach(participant => {
          if (participant.id && !uniqueIds.includes(participant.id)) {
            uniqueIds.push(participant.id);
            uniqueParticipants.push(participant);
          }
        });
      }
    });
    
    return uniqueParticipants;
  }, [participantGroups]);
  
  // Filter participants based on search text
  const filterParticipants = (searchText: string) => {
    if (!searchText) return allUniqueParticipants;
    
    return allUniqueParticipants.filter(participant => 
      participant.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };
  
  // Get all roles for a participant
  const getParticipantRoles = (participant: Participant): string => {
    const roles: string[] = [];
    
    participantGroups.forEach(group => {
      const isInGroup = group.participants.some(p => p.id === participant.id && p.id !== undefined);
      if (isInGroup) {
        if (group.title === GroupTitles.PRE_APPROVAL) roles.push(t('participant.preApprover'));
        else if (group.title === GroupTitles.POST_APPROVAL) roles.push(t('participant.postApprover'));
        else if (group.title === GroupTitles.EXECUTION) roles.push(t('participant.executor'));
        else if (group.title === GroupTitles.OWNERS) roles.push(t('participant.owner'));
        else roles.push(group.title);
      }
    });
    
    return roles.length > 0 ? roles.join(", ") : t('participant.participant');
  };
  
  return {
    allUniqueParticipants,
    filterParticipants,
    getParticipantRoles
  };
}