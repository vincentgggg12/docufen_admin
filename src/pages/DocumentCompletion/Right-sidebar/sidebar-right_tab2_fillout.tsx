import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ClipboardPen, Trash2, PlusCircle, Search, BanIcon, MoreVertical, ChevronUp, ChevronDown, Info, ChevronRight, User, Eye } from "lucide-react";
import { IconSignature } from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";

// Import useUsersStore for real user data
import { useUsersStore, useDocumentStore, useAppStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { DocufenUser, GroupTitles, InvitationStatuses, Participant, ParticipantGroup } from "@/lib/apiUtils";
import { Stage } from "@/components/editor/lib/lifecycle";
import { useUserStore } from "@/lib/stateManagement";
import { AddUsersDialog } from "@/pages/DocumentCompletion/Right-sidebar/AddUsersDialog";
import { UserType, hasCapability } from "@/lib/authorisation";

// Convert DocufenUser to Participant
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


// Sortable Participant Item Component
function SortableParticipantItem({
  participant,
  participantIndex,
  groupIndex,
  currentStage,
  onRemove,
  isActiveSigner = false,
  editMode = false,
  onMoveUp,
  onMoveDown,
  totalParticipants,
  ...props
}: {
  participant: Participant;
  participantIndex: number;
  groupIndex: number;
  currentStage: number;
  onRemove: () => void;
  isActiveSigner?: boolean;
  editMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  totalParticipants?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const id = participant.id || `participant-${groupIndex}-${participantIndex}`;
  const [showNotification, setShowNotification] = useState(false);
  
  // Check if this is the last owner - hide delete button if it is
  const isLastOwner = groupIndex === 3 && participantIndex === 0;
  
  const {
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  const { t } = useTranslation();
  // Check if first or last item to disable move up/down appropriately
  const isFirstItem = participantIndex === 0;
  const isLastItem = totalParticipants ? participantIndex === (totalParticipants - 1) : false;

  // Determine if we should show the "Up Next" chip
  const shouldShowUpNext = () => {
    // If participant has already signed, don't show "Up Next"
    if (participant.signed) return false;
    
    // If this is the active signer in a stage with signing order
    if (isActiveSigner) return true;
    
    // If this is the Execution stage (which has no signing order) and it's the current stage
    if (groupIndex === 1 && groupIndex === currentStage) return true;
    
    return false;
  };

  return (
    <>
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`flex items-center gap-3 p-2 bg-[#FAF9F5] rounded-md hover:bg-gray-100 cursor-pointer transition-colors ${
          isDragging ? 'border border-dashed border-primary ring-1 ring-primary' : ''
        }`}
        {...props}
      >
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {participant.initials || participant.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow min-w-0 flex items-center gap-2">
          <span className="text-sm truncate">{participant.name}</span>
          {participant.signed && (
            <span className="inline-flex items-center flex-shrink-0">
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Next to sign indicator - show for active signers or all in Execution stage */}
        {shouldShowUpNext() && (
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
            groupIndex === 0 ? "bg-amber-100 text-amber-800" :
            groupIndex === 1 ? "bg-indigo-100 text-indigo-800" :
            groupIndex === 2 ? "bg-purple-100 text-purple-800" :
            "bg-green-100 text-green-800"
          }`}>
            {t('your-turn')}
          </span>
        )}
        
        {editMode && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                title={t('more-options')}
                disabled={isLastOwner}
                style={{visibility: isLastOwner ? 'hidden' : 'visible'}}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{t('more')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0">
              <div className="flex flex-col py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-3 rounded-none"
                  onClick={onMoveUp}
                  disabled={isFirstItem}
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  <span>{t('move-up')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-3 rounded-none"
                  onClick={onMoveDown}
                  disabled={isLastItem}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  <span>{t('move-down')}</span>
                </Button>
                <div className="h-px bg-gray-200 my-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-3 rounded-none text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={onRemove}
                  disabled={isLastOwner}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>{t('actions.remove')}</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Notification Dialog */}
      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('notification-sent')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{t('has-been-notified-via-email', { name: participant.name })}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotification(false)} data-testid="docCompletion.rsb.notificationDialog.closeButton">
              {t('buttonTitle.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Create a custom styled switch for Pre-Approval
const PreApprovalSwitch = React.forwardRef<
  React.ComponentRef<typeof Switch>,
  React.ComponentPropsWithoutRef<typeof Switch>
>((props, ref) => (
  <Switch
    ref={ref}
    className="data-[state=checked]:bg-amber-500"
    {...props}
  />
));
PreApprovalSwitch.displayName = "PreApprovalSwitch";

// Create a custom styled switch for Post-Approval
const PostApprovalSwitch = React.forwardRef<
  React.ComponentRef<typeof Switch>,
  React.ComponentPropsWithoutRef<typeof Switch>
>((props, ref) => (
  <Switch
    ref={ref}
    className="data-[state=checked]:bg-purple-600"
    {...props}
  />
));
PostApprovalSwitch.displayName = "PostApprovalSwitch";

export function FillOutTab({
  oldGroups,
  ...props
}: {
  oldGroups?: ParticipantGroup[];
} & React.HTMLAttributes<HTMLDivElement>) {
  const { t } = useTranslation();
  
  // Get real users from the store
  const { users } = useUsersStore(useShallow((state) => ({
    users: state.users
  })));
  // Get document stage and user info from the document store
  const { documentStage, participantGroups, saveParticipantGroups, setParticipantGroups, resetParticipantGroups } = useDocumentStore(useShallow((state) => ({
    documentStage: state.documentStage,
    participantGroups: state.participantGroups,
    saveParticipantGroups: state.saveParticipantGroups,
    setParticipantGroups: state.setParticipantGroups,
    resetParticipantGroups: state.resetParticipantGroups
  })));
  const { hideInsertIntoCellDialog } = useAppStore(useShallow((state) => ({
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog
  })));
  const [editedGroup, setEditedGroup] = React.useState<number | null>(null);

  // Get current user information to check if owner
  const { participant, userType } = useUserStore(useShallow((state) => ({
    participant: state.participant,
    userType: state.userType
  })));
  
  // Check if current user is an owner of the document
  const isDocumentOwner = React.useMemo(() => {
    // Find the Owners group
    const ownersGroup = participantGroups.find(group => group.title === GroupTitles.OWNERS);
    if (!ownersGroup || !participant) return false;
    return ownersGroup.participants.some(owner =>
      (owner.id && participant.id && owner.id === participant.id) ||
      (owner.email && participant.email && owner.email === participant.email)
    );
  }, [participantGroups, participant]);
  
  // Check if current user is an administrator (Site Administrator or Trial Administrator)
  const isAdministrator = React.useMemo(() => {
    return userType === UserType.SITE_ADMINISTRATOR || userType === UserType.TRIAL_ADMINISTRATOR;
  }, [userType]);
  
  // Track which sections are visible (will be set based on current stage)
  const [visibleSections, setVisibleSections] = React.useState([false, false, false]);
  const [documentAccessExpanded, setDocumentAccessExpanded] = React.useState(false);
  const [viewersExpanded, setViewersExpanded] = React.useState(true);
  const [ownersExpanded, setOwnersExpanded] = React.useState(true);
  
  // Toggle section visibility
  const toggleSectionVisibility = (index: number) => {
    const newVisibleSections = [...visibleSections];
    newVisibleSections[index] = !newVisibleSections[index];
    setVisibleSections(newVisibleSections);
  };



  // Autosave changes for document owners
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const allowAutoChangeDetection = React.useRef(false);
  const isInitialLoadRef = React.useRef(true);
  
  // Reset flags when document/participants change from external source
  React.useEffect(() => {
    // Reset flags when switching documents or initial load
    allowAutoChangeDetection.current = false;
    isInitialLoadRef.current = true;
    
    // Set a timeout to mark initial load as complete
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1000); // Give 1 second for initial data to settle
    
    return () => clearTimeout(timer);
  }, []); // Only run on component mount/unmount
  
  // Autosave changes when participantGroups change while in edit mode
  React.useEffect(() => {
    // Only autosave if:
    // 1. User is document owner
    // 2. User has actually made changes (not just loading data)
    // 3. Not during initial load/document switching
    if (isDocumentOwner && allowAutoChangeDetection.current && !isInitialLoadRef.current) {
      // Clear previous timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (editedGroup == null) return
      
      // Set a new timeout to save changes after a delay
      autoSaveTimeoutRef.current = setTimeout(() => {
      // console.error("fillout_2 Calling SaveParticipantGroups")
        console.log("Autosaveing participant groups...")
        allowAutoChangeDetection.current = false; // Reset flag after saving
        saveParticipantGroups(participantGroups, editedGroup).catch((error) => {
          if (error instanceof Error) {
            console.error("Error saving participant groups:", error.message);
          }
        });
      }, 2000); // 2-second debounce
    }
    
    return () => {
      // Clear timeout on cleanup
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [participantGroups, isDocumentOwner, saveParticipantGroups, editedGroup, setEditedGroup]);

  // Map document stage to corresponding group index
  const currentStageIndex = React.useMemo(() => {
    switch (documentStage) {
      case Stage.PreApprove:
        return 0; // Pre-Approval
      case Stage.Execute:
        return 1; // Execution
      case Stage.PostApprove:
        return 2; // Post-Approval
      case Stage.Closed:
        return -1; // No active stage when completed
      case Stage.Finalised:
        return -1; // No active stage when final PDF
      case Stage.Voided:
        return -1; // No active stage when voided
      default:
        return 0; // Default to Pre-Approval
    }
  }, [documentStage]);
  
  // Update visible sections when stage changes
  React.useEffect(() => {
    setVisibleSections([
      currentStageIndex === 0, // Pre-Approval
      currentStageIndex === 1, // Execution
      currentStageIndex === 2  // Post-Approval
    ]);
  }, [currentStageIndex]);
    
  const fillOutTabRef = useRef<HTMLDivElement>(null);
  
  // Set up sensors for DND Kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleUpdateParticipants = (updatedGroups: ParticipantGroup[], groupIndex: number) => {
    console.log("updatedParticipants", updatedGroups);
    // Mark that user has made changes (this is a user-initiated action)
    setEditedGroup(groupIndex)
    allowAutoChangeDetection.current = true;
    setParticipantGroups(updatedGroups)
    // if (onSaveGroups) {
    //   onSaveGroups(updatedGroups);
    // } else {
    //   setInternalGroups(updatedGroups);
    // }
  };
  
  // Handler for removing a participant
  const handleRemoveParticipant = (groupIndex: number, participantIndex: number) => {
    // Prevent deletion of the last owner (owners group is at index 3)
    if (groupIndex === 3 && participantGroups[groupIndex].participants.length <= 1) {
      return; // Don't allow removal of the last owner
    }
    const updatedGroups = [...participantGroups];
    updatedGroups[groupIndex].participants.splice(participantIndex, 1);
    handleUpdateParticipants(updatedGroups, groupIndex)
  };
  
  // Move a participant up in the list
  const handleMoveParticipantUp = (groupIndex: number, participantIndex: number) => {
    if (participantIndex === 0) return; // Can't move up if already at the top
    
    const updatedGroups = [...participantGroups];
    const participants = updatedGroups[groupIndex].participants;
    
    // Swap with the previous participant
    [participants[participantIndex], participants[participantIndex - 1]] = 
    [participants[participantIndex - 1], participants[participantIndex]];
    
    handleUpdateParticipants(updatedGroups, groupIndex);
  };

  // Move a participant down in the list
  const handleMoveParticipantDown = (groupIndex: number, participantIndex: number) => {
    const updatedGroups = [...participantGroups];
    const participants = updatedGroups[groupIndex].participants;
    
    if (participantIndex >= participants.length - 1) return; // Can't move down if already at the bottom
    // Swap with the next participant
    [participants[participantIndex], participants[participantIndex + 1]] = 
    [participants[participantIndex + 1], participants[participantIndex]];
    
    handleUpdateParticipants(updatedGroups, groupIndex);
  };
  
  
  // Handler for opening the user search dialog
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(null);
  // State for multitab add participant dialog
  const [showMultiStageDialog, setShowMultiStageDialog] = useState(false);
  const [activeStageTab, setActiveStageTab] = useState<string>("pre-approval"); //"pre-approval" | "execution" | "post-approval"
  const [specificStageIndex, setSpecificStageIndex] = useState<number | null>(null); // Track if opened from specific stage button
  
  // State for viewers dialog
  const [showViewersDialog, setShowViewersDialog] = useState(false);
  // State for owners dialog
  const [showOwnersDialog, setShowOwnersDialog] = useState(false);
  
  // State for temporary participant groups in the modal - moved here to follow hooks rules
  const [tempParticipantGroups, setTempParticipantGroups] = useState<ParticipantGroup[]>([]);
  
  React.useEffect(() => {
    setCurrentGroupIndex(currentStageIndex); // Set to pre-approval by default
    switch (currentStageIndex) {
      case 0:
        setActiveStageTab("pre-approval");
        break
      case 1:
        setActiveStageTab("execution");
        break;
      case 2:
        setActiveStageTab("post-approval");
        break;
      default:
        setActiveStageTab("pre-approval");
    }
  },[currentStageIndex])
  
  // Initialize temporary groups when the modal opens
  React.useEffect(() => {
    if (showMultiStageDialog) {
      setTempParticipantGroups(JSON.parse(JSON.stringify(participantGroups)));
    }
  }, [showMultiStageDialog, participantGroups]);
  
  // // Handler for adding a selected participant
  // const handleAddSelectedUser = (user: DocufenUser) => {
  //   if (currentGroupIndex !== null) {
  //     const updatedGroups = [...participantGroups];
  //     const participant = convertToParticipant(user);
      
  //     // Check if user already exists in the group to prevent duplicates
  //     const userExists = updatedGroups[currentGroupIndex].participants.some(
  //       p => p.id === participant.id
  //     );
      
  //     if (!userExists) {
  //       updatedGroups[currentGroupIndex].participants.push(participant);
  //       handleUpdateParticipants(updatedGroups, currentGroupIndex);
  //     }
  //   }
  //   // Keep dialog open, don't close it
  //   // setIsSearchDialogOpen(false);
  // };
  
  // Handle dnd reordering
  const handleDragEnd = (event: DragEndEvent, groupIndex: number) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const updatedGroups = [...participantGroups];
      const participants = updatedGroups[groupIndex].participants;
      
      // Find the indices based on ids
      const oldIndex = participants.findIndex(p => (p.id || `participant-${groupIndex}-${participants.indexOf(p)}`) === active.id);
      const newIndex = participants.findIndex(p => (p.id || `participant-${groupIndex}-${participants.indexOf(p)}`) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder the array
        updatedGroups[groupIndex].participants = arrayMove(
          participants,
          oldIndex,
          newIndex
        );
        
        handleUpdateParticipants(updatedGroups, groupIndex);
      }
    }
  };
  
  // Find the active signer (first unsigned participant in each group)
  const findActiveSigner = (group: ParticipantGroup, _groupIndex: number): number => {
    // If signing order is enabled, find the next signer based on order
    if (group.signingOrder) {
      // Just find the first unsigned participant - no need for stage mapping
      return group.participants.findIndex(p => !p.signed);
    }
    
    // If no signing order, return -1 to indicate no active signer
    return -1;
  };


  // Add component cleanup when unmounting
  useEffect(() => {
    return () => {
      // Clean up when component unmounts - reset participant groups if needed
      // only reset if this component is not being used for editing an existing document
      if (!oldGroups) {
        resetParticipantGroups();
      }
    };
  }, [oldGroups, resetParticipantGroups]);
  
  // Add state for Popover controls in multi-stage dialog
  const [preApprovalPopoverOpen, setPreApprovalPopoverOpen] = useState(false);
  const [executionPopoverOpen, setExecutionPopoverOpen] = useState(false);
  const [postApprovalPopoverOpen, setPostApprovalPopoverOpen] = useState(false);


  // Function to close all popovers
  const closeAllPopovers = () => {
    setPreApprovalPopoverOpen(false);
    setExecutionPopoverOpen(false);
    setPostApprovalPopoverOpen(false);
  };


  // Enhanced function to handle multi-stage dialog closing
  const handleCloseMultiStageDialog = () => {
    closeAllPopovers(); // Close all popovers before closing dialog
    setShowMultiStageDialog(false);
    setSearchQuery(""); // Clear search query
    setSpecificStageIndex(null); // Reset specific stage index
  };

  // Filter users based on search query and active tab
  const filteredUsersMultiStage = React.useMemo(() => {
    // For the multi-stage dialog, use the activeStageTab to determine the group index
    let effectiveGroupIndex = currentGroupIndex;
    
    if (showMultiStageDialog) {
      if (activeStageTab === "pre-approval") {
        effectiveGroupIndex = 0;
      } else if (activeStageTab === "execution") {
        effectiveGroupIndex = 1;
      } else if (activeStageTab === "post-approval") {
        effectiveGroupIndex = 2;
      }
    }
    
    if (effectiveGroupIndex == null) return [];
    
    // Get IDs of participants already in the current group
    if (participantGroups == null || participantGroups.length < effectiveGroupIndex + 1) return [];
    if (participantGroups[effectiveGroupIndex] == null || participantGroups[effectiveGroupIndex].participants == null) return [];
    const existingParticipantIds = participantGroups[effectiveGroupIndex].participants.map(p => p.id);
    
    return users.filter(user => 
      // Filter by search query
      (user.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      // Filter out users already added to this group
      !existingParticipantIds.includes(user.oid) &&
      user.invitationStatus === InvitationStatuses.ACTIVE && // Only show active users
      hasCapability(user.userType, "COMPLETE_DOCUMENTS") // Exclude Admins
    );
  }, [users, searchQuery, currentGroupIndex, participantGroups, showMultiStageDialog, activeStageTab]);

  // Check if document is voided
  const isDocumentVoided = documentStage === Stage.Voided;

  // If document is voided, show voided message instead of the workflow UI
  if (isDocumentVoided) {
    return (
      <div className="flex flex-col h-full items-center justify-center" ref={fillOutTabRef} {...props}>
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <BanIcon className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('document-voided')}</h3>
          <p className="text-sm text-gray-500">
            {t('this-document-has-been-voided-and-is-no-longer-valid-for-processing')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" {...props} data-testid="docExecutionPage.rsb.fillout.container">
      {/* Header with title, info and add button */}
      <div className="mb-4">
        {/* Header section with title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium" data-testid="docExecutionPage.rsb.fillout.title">{t('selector.workflow')}</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 info-icon cursor-help" data-testid="docExecutionPage.rsb.fillout.infoIcon" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3 text-xs" side="right">
                  <p>{t('add-participants-to-each-stage-if-a-document-is-already-approved')}</p>
                  <p className="mt-2">{t('participants-will-be-notified-by-email')}</p>
                  <p className="mt-2">{t('if-signing-order-is-enabled-each-user-is-notified-automatically')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    
      <div className="flex flex-col flex-grow relative" data-testid="docExecutionPage.rsb.fillout.participantGroups">
        {/* Main participant roles - Pre-Approval, Execution, Post-Approval */}
        <div className="space-y-4">
          {participantGroups.slice(0, 3).map((group, groupIndex) => {
            const groupTestId = groupIndex === 0 ? 'preApproval' : 
                               groupIndex === 1 ? 'execution' : 
                               groupIndex === 2 ? 'postApproval' : 'unknown';
            
            return (
              <div key={groupIndex} className="mb-4" data-testid={`docExecutionPage.rsb.fillout.${groupTestId}Group`}>
                {/* Group header with toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors flex-1" 
                    data-testid={`docExecutionPage.rsb.fillout.${groupTestId}Header`}
                    onClick={() => toggleSectionVisibility(groupIndex)}
                  >
                    <ChevronRight 
                      className={`h-4 w-4 text-muted-foreground transition-transform ${visibleSections[groupIndex] ? 'rotate-90' : ''}`} 
                    />
                    {/* Add stage icon for all sections */}
                    {groupIndex === 0 ? (
                      <IconSignature 
                        size={16} 
                        className={currentStageIndex === groupIndex ? "text-amber-500" : "text-gray-400"} 
                      />
                    ) : groupIndex === 1 ? (
                      <ClipboardPen 
                        className={currentStageIndex === groupIndex ? "h-4 w-4 text-indigo-500" : "h-4 w-4 text-gray-400"} 
                      />
                    ) : groupIndex === 2 ? (
                      <IconSignature 
                        size={16} 
                        className={currentStageIndex === groupIndex ? "text-purple-600" : "text-gray-400"} 
                      />
                    ) : null}
                    
                    {currentStageIndex === groupIndex ? (
                      <TextShimmer className="text-sm font-medium" duration={3} data-testid={`docExecutionPage.rsb.fillout.${groupTestId}Title`}>
                        {t(`groupTitles.${group.title}`)}
                      </TextShimmer>
                    ) : (
                      <h3 className="text-sm font-medium text-gray-500" data-testid={`docExecutionPage.rsb.fillout.${groupTestId}Title`}>{t(`groupTitles.${group.title}`)}</h3>
                    )}
                  </div>
                  
                  {/* Add button for each section */}
                  {isDocumentOwner && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 flex items-center gap-1 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open the multi-stage dialog and set to the appropriate tab
                        hideInsertIntoCellDialog();
                        setSpecificStageIndex(groupIndex);
                        setActiveStageTab(groupIndex === 0 ? "pre-approval" : 
                                         groupIndex === 1 ? "execution" : 
                                         groupIndex === 2 ? "post-approval" : "pre-approval");
                        setShowMultiStageDialog(true);
                      }}
                      data-testid={`docExecutionPage.rsb.fillout.${groupTestId}AddButton`}
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>{t('actions.add')}</span>
                    </Button>
                  )}
                </div>
                
                {/* Participants list - removed tree structure */}
                {visibleSections[groupIndex] && (
                  <div className="ml-6 space-y-2" data-testid={`docExecutionPage.rsb.fillout.${groupTestId}ParticipantsList`}>
                    {group.participants.length === 0 ? (
                      <div data-testid={`docExecutionPage.rsb.fillout.${groupTestId}EmptyState`}>
                        {/* Empty state - no message */}
                      </div>
                    ) : (
                      group.signingOrder && isDocumentOwner ? (
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, groupIndex)}
                        >
                          <SortableContext
                            items={group.participants.map((p, i) => p.id || `participant-${groupIndex}-${i}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {group.participants.map((participant, index) => {
                              const activeSignerIndex = findActiveSigner(group, groupIndex);
                              const _isNextToSign = index === activeSignerIndex && 
                                                   activeSignerIndex !== -1 && 
                                                   groupIndex === currentStageIndex && 
                                                   !participant.signed;
                              
                              return (
                                <SortableParticipantItem
                                  key={participant.id || index}
                                  participant={participant}
                                  participantIndex={index}
                                  groupIndex={groupIndex}
                                  currentStage={currentStageIndex}
                                  isActiveSigner={_isNextToSign}
                                  onRemove={() => handleRemoveParticipant(groupIndex, index)}
                                  editMode={isDocumentOwner}
                                  onMoveUp={() => handleMoveParticipantUp(groupIndex, index)}
                                  onMoveDown={() => handleMoveParticipantDown(groupIndex, index)}
                                  totalParticipants={group.participants.length}
                                />
                              );
                            })}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        group.participants.map((participant, index) => {
                          const _isNextToSign = index === findActiveSigner(group, groupIndex) && 
                                                  findActiveSigner(group, groupIndex) !== -1 && 
                                                  groupIndex === currentStageIndex && 
                                                  !participant.signed;
                          
                          return (
                            <SortableParticipantItem
                              key={participant.id || index}
                              participant={participant}
                              participantIndex={index}
                              groupIndex={groupIndex}
                              currentStage={currentStageIndex}
                              isActiveSigner={_isNextToSign}
                              onRemove={() => handleRemoveParticipant(groupIndex, index)}
                              editMode={isDocumentOwner}
                              onMoveUp={() => handleMoveParticipantUp(groupIndex, index)}
                              onMoveDown={() => handleMoveParticipantDown(groupIndex, index)}
                              totalParticipants={group.participants.length}
                            />
                          );
                        })
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Document Access Section */}
        <div className="mt-6 border-t pt-4">
          {/* Document Access Header */}
          <div 
            className="flex items-center justify-between mb-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
            onClick={() => setDocumentAccessExpanded(!documentAccessExpanded)}
            data-testid="docExecutionPage.rsb.fillout.documentAccessHeader"
          >
            <div className="flex items-center gap-2">
              <ChevronRight 
                className={`h-4 w-4 text-muted-foreground transition-transform ${documentAccessExpanded ? 'rotate-90' : ''}`} 
              />
              <h2 className="text-base font-medium" data-testid="docExecutionPage.rsb.fillout.documentAccessTitle">{t("sbr.documentAccess")}</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 info-icon cursor-help" data-testid="docExecutionPage.rsb.fillout.documentAccessInfoIcon" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] p-3 text-xs" side="right">
                    <p>{t('participants.accessDescription')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Document Access Content */}
          {documentAccessExpanded && (
            <div className="space-y-4" data-testid="docExecutionPage.rsb.fillout.documentAccessContent">
              {/* Viewers Section */}
              <div className="ml-4">
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors flex-1"
                    onClick={() => setViewersExpanded(!viewersExpanded)}
                    data-testid="docExecutionPage.rsb.fillout.viewersHeader"
                  >
                    <ChevronRight 
                      className={`h-4 w-4 text-muted-foreground transition-transform ${viewersExpanded ? 'rotate-90' : ''}`} 
                    />
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium" data-testid="docExecutionPage.rsb.fillout.viewersTitle">{t('groupTitles.Viewers')}</h3>
                  </div>
                  {(isDocumentOwner || isAdministrator) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 flex items-center gap-1 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        hideInsertIntoCellDialog();
                        setShowViewersDialog(true);
                      }}
                      data-testid="docExecutionPage.rsb.fillout.viewersAddButton"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>{t('actions.add')}</span>
                    </Button>
                  )}
                </div>
                
                {viewersExpanded && (
                  <div className="ml-6 space-y-2" data-testid="docExecutionPage.rsb.fillout.viewersList">
                    {/* Display owners from participantGroups[4] */}
                    {participantGroups[4] && participantGroups[4].participants.length > 0 ? (
                      participantGroups[4].participants.map((viewer, index) => (
                        <div 
                          key={viewer.id || index}
                          className="flex items-center gap-3 p-2 bg-[#FAF9F5] rounded-md"
                          data-testid={`docExecutionPage.rsb.fillout.viewerItem${viewer.id || index}`}
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {viewer.initials || viewer.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{viewer.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {/* Empty state for viewers */}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Owners Section */}
              <div className="ml-4">
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors flex-1"
                    onClick={() => setOwnersExpanded(!ownersExpanded)}
                    data-testid="docExecutionPage.rsb.fillout.ownersHeader"
                  >
                    <ChevronRight 
                      className={`h-4 w-4 text-muted-foreground transition-transform ${ownersExpanded ? 'rotate-90' : ''}`} 
                    />
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium" data-testid="docExecutionPage.rsb.fillout.ownersTitle">{t('groupTitles.Owners')}</h3>
                  </div>
                  {(isDocumentOwner || isAdministrator) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 flex items-center gap-1 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        hideInsertIntoCellDialog();
                        setShowOwnersDialog(true);
                      }}
                      data-testid="docExecutionPage.rsb.fillout.ownersAddButton"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>{t('actions.add')}</span>
                    </Button>
                  )}
                </div>
                
                {ownersExpanded && (
                  <div className="ml-6 space-y-2" data-testid="docExecutionPage.rsb.fillout.ownersList">
                    {/* Display owners from participantGroups[3] */}
                    {participantGroups[3] && participantGroups[3].participants.length > 0 ? (
                      participantGroups[3].participants.map((owner, index) => (
                        <div 
                          key={owner.id || index}
                          className="flex items-center gap-3 p-2 bg-[#FAF9F5] rounded-md"
                          data-testid={`docExecutionPage.rsb.fillout.ownerItem${owner.id || index}`}
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {owner.initials || owner.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{owner.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {/* Empty state for owners */}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Multi-Stage Add Participant Dialog */}
      <Dialog open={showMultiStageDialog} onOpenChange={(open) => {
        if (!open) {
          handleCloseMultiStageDialog();
        } else {
          setShowMultiStageDialog(true);
        }
      }}>
        <DialogContent className="sm:max-w-[550px]" data-testid="docExecutionPage.rsb.fillout.multiStageDialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="docExecutionPage.rsb.fillout.multiStageDialogTitle">
              {specificStageIndex !== null ? (
                <>
                  <span>{t('participants.addParticipantsTo')}</span>
                  {specificStageIndex === 0 ? <IconSignature size={20} className="text-amber-500" /> :
                   specificStageIndex === 1 ? <ClipboardPen className="h-5 w-5 text-indigo-500" /> :
                   specificStageIndex === 2 ? <IconSignature size={20} className="text-purple-600" /> : null}
                  {t(`groupTitles.${participantGroups[specificStageIndex]?.title}`)}
                </>
              ) : (
                t('add-participants')
              )}
            </DialogTitle>
            <DialogDescription data-testid="docExecutionPage.rsb.fillout.multiStageDialogDescription">
              {specificStageIndex !== null ? (
                specificStageIndex === 0 ? t('add-users-who-need-to-approve-the-document-before-execution') :
                specificStageIndex === 1 ? t('add-users-who-will-execute-and-sign-the-document') :
                specificStageIndex === 2 ? t('add-users-who-need-to-sign-after-document-execution') : 
                t('select-a-stage-and-add-participants-to-the-workflow')
              ) : (
                t('select-a-stage-and-add-participants-to-the-workflow')
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Add tempParticipantGroups state - moved outside of IIFE to follow hooks rules */}
          {(() => {
            // Function to add a user to temporary groups
            const addUserToTempGroups = (groupIndex: number, user: DocufenUser) => {
              const participant: Participant = convertToParticipant(user);
              // Check if user already exists in the group to prevent duplicates
              const userExists = tempParticipantGroups[groupIndex].participants.some(
                p => p.id === participant.id
              );
              
              if (!userExists) {
                const updatedGroups = [...tempParticipantGroups];
                updatedGroups[groupIndex].participants.push(participant);
                setTempParticipantGroups(updatedGroups);
              }
              setSearchQuery("");
            };
            
            // Function to remove a user from temporary groups
            const removeUserFromTempGroups = (groupIndex: number, participantIndex: number) => {
              const updatedGroups = [...tempParticipantGroups];
              updatedGroups[groupIndex].participants.splice(participantIndex, 1);
              setTempParticipantGroups(updatedGroups);
            };
            
            // Function to save changes from temp to actual groups
            const saveGroupChanges = (groupIndex: number) => {
              if (currentGroupIndex === null || !tempParticipantGroups[groupIndex]) return;
              const updatedGroups = [...participantGroups];
              updatedGroups[groupIndex] = {...tempParticipantGroups[groupIndex]};
              // Mark that user has made changes (this is a user-initiated action)
              allowAutoChangeDetection.current = false;
              saveParticipantGroups(updatedGroups, groupIndex).catch((err: unknown) => {
                if (err instanceof Error) {
                  console.error("Error saving participant groups:", err.message);
                }
              });
              // Let the autosave mechanism handle saving
              console.log("Saving participant groups via autosave...");
            };
            
            // Use conditional rendering instead of early return to avoid hooks issues
            if (currentGroupIndex == null || participantGroups.length < 4 || !participantGroups[currentGroupIndex]) {
              return null //<div className="p-4 text-center text-gray-500">{t('unable-to-load-participant-groups')}</div>;
            }
            
            // If opened from a specific stage button, show only that stage
            if (specificStageIndex !== null) {
              const stageIndex = specificStageIndex;
              const stageConfig = {
                0: {
                  title: t('documents.pre-approval'),
                  description: t('add-users-who-need-to-approve-the-document-before-execution'),
                  popoverOpen: preApprovalPopoverOpen,
                  setPopoverOpen: setPreApprovalPopoverOpen,
                  switchComponent: PreApprovalSwitch,
                  buttonClass: "bg-amber-500 hover:bg-amber-600",
                  iconColor: "text-amber-500"
                },
                1: {
                  title: t('documents.execution'),
                  description: t('add-users-who-will-execute-and-sign-the-document'),
                  popoverOpen: executionPopoverOpen,
                  setPopoverOpen: setExecutionPopoverOpen,
                  switchComponent: null,
                  buttonClass: "bg-indigo-500 hover:bg-indigo-600",
                  iconColor: "text-indigo-500"
                },
                2: {
                  title: t('documents.post-approval'),
                  description: t('add-users-who-need-to-sign-after-document-execution'),
                  popoverOpen: postApprovalPopoverOpen,
                  setPopoverOpen: setPostApprovalPopoverOpen,
                  switchComponent: PostApprovalSwitch,
                  buttonClass: "bg-purple-600 hover:bg-purple-700",
                  iconColor: "text-purple-600"
                }
              }[stageIndex];

              // Use conditional rendering instead of early return to avoid hooks issues
              if (!stageConfig || !tempParticipantGroups[stageIndex]) {
                return null //<div className="p-4 text-center text-gray-500">{t('unable-to-load-stage-configuration')}</div>;
              }

              return (
                <>
                  <div className="space-y-4">
                    <div>
                        
                        {/* Display selected participants as chips */}
                        {tempParticipantGroups[stageIndex]?.participants.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {tempParticipantGroups[stageIndex].participants.map((participant, index) => (
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeUserFromTempGroups(stageIndex, index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span className="sr-only">{t('actions.remove')}</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Popover open={stageConfig.popoverOpen} onOpenChange={stageConfig.setPopoverOpen}>
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                data-testid="addUsersDialog.searchInput"
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                              {filteredUsersMultiStage.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">{t('participants.noUsersFound')}</p>
                              ) : (
                                filteredUsersMultiStage.map((user: DocufenUser) => (
                                  <div
                                    key={user.oid}
                                    className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                    onClick={() => {
                                      addUserToTempGroups(stageIndex, user);
                                      stageConfig.setPopoverOpen(false);
                                    }}
                                    data-testid={`userlist.selection.object.${user.legalName}`}
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
                                    <PlusCircle className={`h-4 w-4 ${stageConfig.iconColor}`} />
                                  </div>
                                ))
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                    </div>
                  <DialogFooter className="mt-6 !flex-row !justify-between items-center">
                    <div className="flex items-center gap-4">
                      {stageConfig.switchComponent && (
                        <div className="flex items-center gap-2">
                          <stageConfig.switchComponent
                            id={`dialog-signing-order-${stageIndex}`}
                            checked={tempParticipantGroups[stageIndex]?.signingOrder !== false}
                            onCheckedChange={(checked) => {
                              const updatedGroups = [...tempParticipantGroups];
                              updatedGroups[stageIndex].signingOrder = checked;
                              setTempParticipantGroups(updatedGroups);
                            }}
                          />
                          <label htmlFor={`dialog-signing-order-${stageIndex}`} className="text-sm font-medium cursor-pointer">
                            {tempParticipantGroups[stageIndex]?.signingOrder !== false ? t('signing-order-on') : t('signing-order-off')}
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleCloseMultiStageDialog} data-testid="docExecutionPage.rsb.fillout.multiStageDialogCloseButton">
                        {t('actions.cancel')}
                      </Button>
                      <Button 
                        variant="default" 
                        className={stageConfig.buttonClass}
                        onClick={() => {
                          saveGroupChanges(stageIndex);
                          handleCloseMultiStageDialog();
                        }}
                        data-testid="docExecutionPage.rsb.fillout.saveButton"
                      >
                        {t('actions.save')}
                      </Button>
                    </div>
                  </DialogFooter>
              </>
            );
            }
            
            // Otherwise show tabs
            return (
              <>
                <Tabs defaultValue="pre-approval" value={activeStageTab} onValueChange={setActiveStageTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-5 h-11 w-full">
                  <TabsTrigger value="pre-approval" className="flex items-center justify-center gap-2 py-2 px-3 text-sm w-full">
                    <IconSignature size={17} className="text-amber-500" />
                    <span>{t('documents.pre-approval')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="execution" className="flex items-center justify-center gap-2 py-2 px-3 text-sm w-full">
                    <ClipboardPen className="h-4.5 w-4.5 text-indigo-500" />
                    <span>{t('documents.execution')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="post-approval" className="flex items-center justify-center gap-2 py-2 px-3 text-sm w-full">
                    <IconSignature size={17} className="text-purple-600" />
                    <span>{t('documents.post-approval')}</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pre-approval">
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 bg-white">
                      <h3 className="text-xl font-semibold mb-2">{t('documents.pre-approval')}</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {t('add-users-who-need-to-approve-the-document-before-execution')}
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                            
                          {/* Display selected participants as chips - MOVED UP */}
                          {tempParticipantGroups[0]?.participants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {tempParticipantGroups[0].participants.map((participant, index) => (
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeUserFromTempGroups(0, index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">{t('actions.remove')}</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <Popover open={preApprovalPopoverOpen} onOpenChange={setPreApprovalPopoverOpen}>
                            <PopoverTrigger asChild>
                              <div className="relative cursor-pointer">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder={t('search-users')}
                                  className="pl-8"
                                  readOnly
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start" sideOffset={-40}>
                              <div className="p-2">
                                <Input
                                  placeholder={t('search-users')}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  autoFocus
                                  data-testid="addUsersDialog.searchInput"
                                />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {filteredUsersMultiStage.length === 0 ? (
                                  <p className="text-center text-sm text-muted-foreground py-4">{t('participants.noUsersFound')}</p>
                                ) : (
                                  filteredUsersMultiStage.map((user: DocufenUser) => (
                                    <div
                                      key={user.oid}
                                      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                      onClick={() => {
                                        addUserToTempGroups(0, user);
                                        setPreApprovalPopoverOpen(false);
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
                                      <PlusCircle className="h-4 w-4 text-amber-500" />
                                    </div>
                                  ))
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* REMOVED from here - moved above search field */}
                        
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PreApprovalSwitch
                              id="dialog-signing-order-pre-approval"
                              checked={tempParticipantGroups[0]?.signingOrder !== false}
                              onCheckedChange={(checked) => {
                                const updatedGroups = [...tempParticipantGroups];
                                updatedGroups[0].signingOrder = checked;
                                setTempParticipantGroups(updatedGroups);
                              }}
                            />
                            <label htmlFor="dialog-signing-order-pre-approval" className="text-sm font-medium cursor-pointer">
                              {tempParticipantGroups[0]?.signingOrder !== false ? t('signing-order-on') : t('signing-order-off')}
                            </label>
                          </div>
                          <Button 
                            variant="default" 
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={() => {
                              saveGroupChanges(0);
                            }}
                          >
                            {t('actions.save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="execution">
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 bg-white">
                      <h3 className="text-xl font-semibold mb-2">{t('documents.execution')}</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {t('add-users-who-will-execute-and-sign-the-document')}
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                            
                          {/* Display selected participants as chips - MOVED UP */}
                          {tempParticipantGroups[1]?.participants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {tempParticipantGroups[1].participants.map((participant, index) => (
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeUserFromTempGroups(1, index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">{t('actions.remove')}</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <Popover open={executionPopoverOpen} onOpenChange={setExecutionPopoverOpen}>
                            <PopoverTrigger asChild>
                              <div className="relative cursor-pointer">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder={t('search-users')}
                                  className="pl-8"
                                  readOnly
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start" sideOffset={-40}>
                              <div className="p-2">
                                <Input
                                  placeholder={t('search-users')}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {filteredUsersMultiStage.length === 0 ? (
                                  <p className="text-center text-sm text-muted-foreground py-4">{t('participants.noUsersFound')}</p>
                                ) : (
                                  filteredUsersMultiStage.map((user: DocufenUser) => (
                                    <div
                                      key={user.oid}
                                      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                      onClick={() => {
                                        addUserToTempGroups(1, user);
                                        setExecutionPopoverOpen(false);
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
                                      <PlusCircle className="h-4 w-4 text-indigo-500" />
                                    </div>
                                  ))
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* REMOVED from here - moved above search field */}
                        
                        <div className="mt-6 flex items-center justify-end">
                          <Button 
                            variant="default" 
                            className="bg-indigo-500 hover:bg-indigo-600"
                            onClick={() => {
                              saveGroupChanges(1);
                            }}
                          >
                            {t('actions.save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="post-approval">
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 bg-white">
                      <h3 className="text-xl font-semibold mb-2">{t('documents.post-approval')}</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {t('add-users-who-need-to-sign-after-document-execution')}
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                            
                          {/* Display selected participants as chips - MOVED UP */}
                          {tempParticipantGroups[2]?.participants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {tempParticipantGroups[2].participants.map((participant, index) => (
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeUserFromTempGroups(2, index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">{t('actions.remove')}</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <Popover open={postApprovalPopoverOpen} onOpenChange={setPostApprovalPopoverOpen}>
                            <PopoverTrigger asChild>
                              <div className="relative cursor-pointer">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder={t('search-users')}
                                  className="pl-8"
                                  readOnly
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start" sideOffset={-40}>
                              <div className="p-2">
                                <Input
                                  placeholder={t('search-users')}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {filteredUsersMultiStage.length === 0 ? (
                                  <p className="text-center text-sm text-muted-foreground py-4">{t('participants.noUsersFound')}</p>
                                ) : (
                                  filteredUsersMultiStage.map((user: DocufenUser) => (
                                    <div
                                      key={user.oid}
                                      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                      onClick={() => {
                                        addUserToTempGroups(2, user);
                                        setPostApprovalPopoverOpen(false);
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
                                      <PlusCircle className="h-4 w-4 text-purple-600" />
                                    </div>
                                  ))
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* REMOVED from here - moved above search field */}
                        
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PostApprovalSwitch
                              id="dialog-signing-order-post-approval"
                              checked={tempParticipantGroups[2]?.signingOrder !== false}
                              onCheckedChange={(checked) => {
                                const updatedGroups = [...tempParticipantGroups];
                                updatedGroups[2].signingOrder = checked;
                                setTempParticipantGroups(updatedGroups);
                              }}
                            />
                            <label htmlFor="dialog-signing-order-post-approval" className="text-sm font-medium cursor-pointer">
                              {tempParticipantGroups[2]?.signingOrder !== false ? t('signing-order-on') : t('signing-order-off')}
                            </label>
                          </div>
                          <Button 
                            variant="default" 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                              saveGroupChanges(2);
                            }}
                          >
                            {t('actions.save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={handleCloseMultiStageDialog} data-testid="docExecutionPage.rsb.fillout.multiStageDialogCloseButton">
                    {t('actions.cancel')}
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
            
      <AddUsersDialog 
        showUsersDialog={showViewersDialog}
        setShowUsersDialog={setShowViewersDialog}
        participantGroups={participantGroups}
        groupIndex={4}
        // handleRemoveParticipant={handleRemoveParticipant}
        users={users}
        titleKey="participants.addViewer"
        descriptionKey="participants.addViewersDescription"
        t={t}
      />
      <AddUsersDialog 
        showUsersDialog={showOwnersDialog}
        setShowUsersDialog={setShowOwnersDialog}
        participantGroups={participantGroups}
        groupIndex={3}
        // handleRemoveParticipant={handleRemoveParticipant}
        users={users}
        titleKey="participants.addOwner"
        descriptionKey="participants.addOwnersDescription"
        t={t}
      />
    </div>
  );
}

export default FillOutTab;
