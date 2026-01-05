import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Search, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DocufenUser, InvitationStatuses, Participant, ParticipantGroup } from "@/lib/apiUtils";
import { TFunction } from "i18next";
import { useShallow } from "zustand/shallow";
import { useDocumentStore } from "@/lib/stateManagement";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { hasCapability } from "@/lib/authorisation";

// Function to convert DocufenUser to Participant
function convertToParticipant(user: DocufenUser): Participant {
  return {
    name: user.legalName,
    id: user.oid,
    email: user.email ? user.email : "",
    // Include user initials
    initials: user.initials,
    // Preserve external flag
    isExternal: user.isExternal
  };
}

interface AddUsersDialogProps {
  showUsersDialog: boolean;
  setShowUsersDialog: React.Dispatch<React.SetStateAction<boolean>>;
  participantGroups: ParticipantGroup[];
  groupIndex: number;
  // handleRemoveParticipant: (groupIndex: number, participantIndex: number) => void;
  users: DocufenUser[];
  titleKey: string
  descriptionKey: string
  t: TFunction;
}

export function AddUsersDialog({
  showUsersDialog,
  setShowUsersDialog,
  participantGroups,
  groupIndex, // Default to owners group
  users,
  titleKey,
  descriptionKey,
  t
}: AddUsersDialogProps) {
  const [ownersPopoverOpen, setOwnersPopoverOpen] = useState(false);
  const [ownersSearchQuery, setOwnersSearchQuery] = useState("");
  const { saveParticipantGroups, documentId, documentName } = useDocumentStore(useShallow((state) => ({
    saveParticipantGroups: state.saveParticipantGroups,
    documentId: state.documentId,
    documentName: state.documentName
  })));
  const [tmpParticipantGroups, setTmpParticipantGroups] = useState<ParticipantGroup[]>(participantGroups);
  const [initialParticipants, setInitialParticipants] = useState<number>(0);

  // Track initial participant count when dialog opens
  React.useEffect(() => {
    if (showUsersDialog && participantGroups[groupIndex]) {
      setInitialParticipants(participantGroups[groupIndex].participants.length);
    }
  }, [showUsersDialog, participantGroups, groupIndex]);

  React.useEffect(() => {
    setTmpParticipantGroups([...participantGroups]);
  }, [participantGroups]);

  const handleLocalRemoveParticipant = (groupIndex: number, participantIndex: number) => {
    const updatedGroups = [...tmpParticipantGroups];
    if (groupIndex === 3 && updatedGroups[groupIndex].participants.length <= 1) return;
    
    
    // Track participant removal
    const removedParticipant = updatedGroups[groupIndex].participants[participantIndex];
    const groupTitle = updatedGroups[groupIndex].title || 'unknown';
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_PARTICIPANT_REMOVED, {
      document_id: documentId,
      participant_id: removedParticipant.id || removedParticipant.email,
      participant_role: groupTitle,
      stage: 'pre_approval' as const
    });
    
    updatedGroups[groupIndex].participants.splice(participantIndex, 1);
    setTmpParticipantGroups(updatedGroups);
  };
  const handleLocalUpdateParticipants = (updatedGroups: ParticipantGroup[]) => {
    setTmpParticipantGroups(updatedGroups);
  }
  return (
    <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
      <DialogContent className="sm:max-w-[500px]" data-testid="docExecutionPage.rsb.fillout.ownersDialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="docExecutionPage.rsb.fillout.ownersDialogTitle">
            <User className="h-4 w-4 text-gray-500" />
            {t(titleKey, "Add Owner")}
          </DialogTitle>
          <DialogDescription data-testid="docExecutionPage.rsb.fillout.ownersDialogDescription">
            {t(descriptionKey, "Add users who can manage this document")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            {/* Display selected owners as chips */}
            {participantGroups[groupIndex]?.participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {participantGroups[groupIndex].participants.map((participant, index) => (
                  <div key={participant.id || index} className="inline-flex items-center gap-1 bg-[#FAF9F5] px-2 py-1 rounded-md text-sm">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {participant.initials || participant.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                      <span>{participant.name}</span>
                      {participant.isExternal && (
                        <span className="inline-flex text-[10px] font-medium py-0.5 px-1.5 bg-blue-100 text-blue-800 rounded-sm">
                          {t('user.external')}
                        </span>
                      )}
                    </div>
                    {/* Only show remove button if not the last owner */}
                    {(groupIndex != 3 || participantGroups[groupIndex].participants.length > 1) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive"
                        onClick={() => handleLocalRemoveParticipant(groupIndex, index)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">{t('actions.remove')}</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Popover open={ownersPopoverOpen} onOpenChange={setOwnersPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('search-users')}
                    className="pl-8"
                    readOnly
                    data-testid="addUsersDialog.searchTriggerInput"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start" sideOffset={-40}>
                <div className="p-2">
                  <Input
                    placeholder={t('search-users')}
                    value={ownersSearchQuery}
                    onChange={(e) => setOwnersSearchQuery(e.target.value)}
                    autoFocus
                    data-testid="addUsersDialog.searchInput"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {(() => {
                    // Filter users for owners group
                    const existingOwnerIds = participantGroups[groupIndex]?.participants.map(p => p.id) || [];
                    const filteredOwnersUsers = users.filter(user => (
                      (user.legalName.toLowerCase().includes(ownersSearchQuery.toLowerCase()) ||
                      (user.email && user.email.toLowerCase().includes(ownersSearchQuery.toLowerCase()))) &&
                      !existingOwnerIds.includes(user.oid) && 
                      (groupIndex === 4 || hasCapability(user.userType, "COMPLETE_DOCUMENTS")) &&
                      user.invitationStatus === InvitationStatuses.ACTIVE // Only show active users
                    ));
                    
                    return filteredOwnersUsers.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">{t('participants.noUsersFound')}</p>
                    ) : (
                      filteredOwnersUsers.map((user: DocufenUser) => (
                        <div
                          key={user.oid}
                          className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            const updatedGroups = [...participantGroups];
                            const participant: Participant = convertToParticipant(user);
                            if (!updatedGroups[groupIndex].participants.some(p => p.id === participant.id)) {
                              const groupName = updatedGroups[groupIndex].title;
                              
                              // Track participant addition to document
                              trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_PARTICIPANT_ADDED, {
                                document_id: documentId,
                                participant_id: user.email,
                                participant_role: groupName,
                                stage: 'pre_approval' as const
                              });
                              
                              updatedGroups[groupIndex].participants.push(participant);
                              handleLocalUpdateParticipants(updatedGroups);
                            }
                            setOwnersSearchQuery("");
                            setOwnersPopoverOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {user.initials || user.legalName.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{user.legalName}</div>
                              {user.isExternal && (
                                <span className="inline-flex text-[10px] font-medium py-0.5 px-1.5 bg-blue-100 text-blue-800 rounded-sm">
                                  {t('user.external')}
                                </span>
                              )}
                            </div>
                          </div>
                          <PlusCircle className="h-4 w-4 text-gray-500" />
                        </div>
                      ))
                    );
                  })()}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              // Track cancel
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                button_name: 'add_users_cancel',
                button_location: 'add_users_dialog_footer',
                page_name: 'Document Editor'
              });
              
              setOwnersSearchQuery("");
              setOwnersPopoverOpen(false);
              setShowUsersDialog(false);
            }} 
            data-testid="docExecutionPage.rsb.fillout.ownersDialogCloseButton"
          >
            {t('actions.cancel')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              const groupName = tmpParticipantGroups[groupIndex].title;
              const finalCount = tmpParticipantGroups[groupIndex].participants.length;
              const addedCount = finalCount - initialParticipants;
              
              // Track save action
              trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_PARTICIPANTS_UPDATED, {
                document_id: documentId,
                document_name: documentName || 'Unknown',
                participant_group: groupName,
                participants_added: Math.max(0, addedCount),
                participants_removed: Math.max(0, -addedCount),
                total_participants: finalCount
              });
              
              saveParticipantGroups(tmpParticipantGroups, groupIndex);
              setOwnersSearchQuery("");
              setOwnersPopoverOpen(false);
              setShowUsersDialog(false);
            }} 
            data-testid="docExecutionPage.rsb.fillout.ownersDialogCloseButton"
          >
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}