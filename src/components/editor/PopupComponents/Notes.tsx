import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, useDocumentStore, useUserStore } from '@/lib/stateManagement';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useShallow } from 'zustand/shallow';
import { Label } from '@/components/ui/label';
import { ContentInsertedEvent } from './MasterPopup';
import { Participant } from '@/lib/apiUtils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMessageManager } from '@/hooks/useMessageManager';
import { useParticipants } from '@/hooks/useParticipants';
import { useTranslation } from 'react-i18next';
import { Stage } from '@/components/editor/lib/lifecycle';
import { getStageString, stageToDocumentStage } from '@/components/editor/lib/utils';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { cn } from '@/lib/utils';
import { useSidebarRight } from '@/pages/DocumentCompletion/Right-sidebar/sidebar-right-context';
import { BorderTrail } from '@/components/motion-primitives/border-trail';
import { getStageColor } from '@/components/editor/lib/stageColors';

const Notes: React.FC = () => {
  const { t } = useTranslation();
  
  // Define common note phrases
  const COMMON_NOTES = [
    t('notes.quickNotes.signHere'),
    t('notes.quickNotes.missingEntry'),
    t('notes.quickNotes.clarificationNeeded'),
    t('notes.quickNotes.correctThis')
  ];
  
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  
  // State for mentions feature
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const mentionMenuRef = useRef<HTMLDivElement>(null);
  // Add state to track mentioned user IDs
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const { saveMessageToDocument } = useMessageManager();
  // Get the sidebar context to show notes tab
  const { setTabAndVisibility, isVisible, activeTab } = useSidebarRight();

  const { participantGroups, documentStage } = useDocumentStore(
    useShallow((state) => ({
      participantGroups: state.participantGroups,
      documentStage: state.documentStage
    }))
  );
  const stageColor = getStageColor(documentStage);
  const { 
    filterParticipants,
    getParticipantRoles
  } = useParticipants(participantGroups);
    
  const { hideInsertIntoCellDialog } = useAppStore(
    useShallow((state) => ({
      hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    }))
  );
  
  const filteredParticipants = React.useMemo(() => {
    return filterParticipants(mentionFilter);
  }, [mentionFilter, filterParticipants]);

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, []);

  function getParticipantRole(participant: Participant): string {
    return getParticipantRoles(participant);
  }

  // Function to handle input change and detect @ symbol for mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setNote(newValue);

    if (!textareaRef.current) return;

    // Get cursor position
    const cursorPosition = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (atSymbolIndex !== -1 && (atSymbolIndex === 0 || textBeforeCursor[atSymbolIndex - 1] === ' ' || textBeforeCursor[atSymbolIndex - 1] === '\n')) {
      // Capture text after @ symbol as filter for mentions
      const mentionText = textBeforeCursor.substring(atSymbolIndex + 1);
      setMentionFilter(mentionText);
      setMentionStartIndex(atSymbolIndex);
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  // Handle selecting a mention from the dropdown
  const handleSelectMention = (participant: Participant) => {
    if (mentionStartIndex >= 0) {
      const textBeforeMention = note.substring(0, mentionStartIndex);
      const textAfterMention = note.substring(mentionStartIndex + 1 + mentionFilter.length);
      
      // Insert the mention with a special format
      const newText = `${textBeforeMention}@${participant.name}${textAfterMention}`;
      setNote(newText);
      
      // Add the participant ID to mentionIds if it has an ID and isn't already included
      if (participant.id && !mentionIds.includes(participant.id)) {
        setMentionIds(prev => [...prev, participant.id!]);
        
        // Track user mentioned event
        trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_MENTIONED, {
          document_id: useDocumentStore.getState().documentId || 'unknown',
          mentioned_user_id: participant.id,
          mention_context: 'note',
          mentioner_user_id: useUserStore.getState().user?.userId || 'unknown'
        });
      }
      
      setShowMentionMenu(false);
      
      // Focus textarea and place cursor after the mention
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPosition = mentionStartIndex + participant.name.length + 1; // +1 for the @ symbol
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 0);
      }
    }
  };

  // Detect clicks outside mention menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target as Node) && 
          textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowMentionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation in mention menu and Control+Enter to add note
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Control+Enter to add note
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (note.trim()) {
        handleAddNote();
      }
      return;
    }

    if (showMentionMenu) {
      if (e.key === 'Enter' && filteredParticipants.length > 0) {
        // Select the first participant when Enter is pressed
        e.preventDefault(); // Prevent form submission
        handleSelectMention(filteredParticipants[0]);
      } else if (e.key === 'Escape') {
        // Close the mention menu when Escape is pressed
        setShowMentionMenu(false);
      } else if (e.key === 'ArrowDown') {
        // Focus the first item in the mention menu
        e.preventDefault();
        const firstItem = mentionMenuRef.current?.querySelector('div') as HTMLElement;
        if (firstItem) firstItem.focus();
      }
    }
  };

  const insertComment = async (commentText: string) => {
    if (!commentText.trim()) return;
    
    try {
      // Pass mentionIds to saveMessageToDocument
      const bookmarkId = await saveMessageToDocument(commentText, mentionIds);
      
      if (bookmarkId) {
        // Track note added event
        trackAmplitudeEvent(AMPLITUDE_EVENTS.NOTE_ADDED, {
          document_id: useDocumentStore.getState().documentId || 'unknown',
          document_name: useDocumentStore.getState().documentName || 'unknown',
          note_id: bookmarkId,
          note_length: commentText.length,
          note_type: 'comment',
          has_mention: mentionIds.length > 0,
          mentioned_users: mentionIds.length > 0 ? mentionIds : undefined,
          document_stage: stageToDocumentStage(documentStage)
        });
        
        // Create and dispatch custom event for UI notification
        const event = new CustomEvent<ContentInsertedEvent>('contentInserted', {
          detail: {
            type: 'note',
            content: commentText.length > 15 ? `${commentText.substring(0, 15)}...` : commentText,
          },
        });
        document.dispatchEvent(event);
        
        // Clear input, mentions, and close dialog
        setNote('');
        setMentionIds([]); // Reset mention IDs
        hideInsertIntoCellDialog();
        
        // Only switch to chat tab if we're not already there
        // This ensures we don't close an already open chat tab
        if (!isVisible || activeTab !== 'chat') {
          setTabAndVisibility('chat');
        }
      }
    } catch (error) {
      console.error(t('notes.errors.addingNote'), error);
    }
  };

  const handleAddNote = () => {
    insertComment(note);
  };

  return (
    <div className="space-y-4">
      {/* Quick note buttons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium block">
          {t('notes.quickNotes.title')}
        </Label>
        <div className="flex flex-wrap gap-2">
          {COMMON_NOTES.map((comment, index) => (
            <button
              key={index}
              data-testid={`editor.${getStageString(documentStage)}.notes.quickNoteButton.${index}`}
              type="button"
              className="h-9 rounded-md font-medium transition-colors font-inter cursor-pointer min-w-[56px] px-4 bg-background text-gray-700 border border-gray-200 hover:bg-background/90 text-sm"
              onClick={() => insertComment(comment)}
            >
              {comment}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea for custom notes */}
      <div
        className="relative overflow-hidden rounded-md"
        style={{ '--stage-color': stageColor } as React.CSSProperties}
      >
        <Textarea
          data-testid={`editor.${getStageString(documentStage)}.notes.textarea`}
          ref={textareaRef}
          id="note"
          placeholder={t('notes.typeAtToMention')}
          className="w-full focus:outline-none focus:ring-0 focus:border-gray-200 min-h-[62px]"
          value={note}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsTextareaFocused(true)}
          onBlur={() => setIsTextareaFocused(false)}
        />
        {isTextareaFocused && (
          <BorderTrail
            className="bg-gradient-to-l from-[var(--stage-color)]/30 via-[var(--stage-color)] to-[var(--stage-color)]/30"
            size={120}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: 'linear',
            }}
          />
        )}
      </div>

      {/* Add note button directly below textarea */}
      <div className="flex justify-end">
        <Button
          data-testid={`editor.${getStageString(documentStage)}.notes.addNoteButton`}
          type="button"
          onClick={handleAddNote}
          disabled={!note.trim()}
          className={cn(
            'py-1.5 rounded-md',
            documentStage === Stage.PreApprove ? 'bg-[#F5A623] text-white hover:bg-[#F5A623]/90' :
            documentStage === Stage.Execute ? 'bg-[#6366f1] text-white hover:bg-[#6366f1]/90' :
            documentStage === Stage.PostApprove ? 'bg-[#9C27B0] text-white hover:bg-[#9C27B0]/90' :
            'bg-[#F5A623] text-white hover:bg-[#F5A623]/90'
          )}
        >
          {t('notes.addNote')}
        </Button>
      </div>

      {/* Mention menu dropdown */}
      {showMentionMenu && (
        <div
          data-testid={`editor.${getStageString(documentStage)}.notes.mentionMenu`}
          ref={mentionMenuRef}
          className="fixed bg-white shadow-lg rounded-md max-h-64 overflow-y-auto z-[9999] w-64"
          style={{
            top: textareaRef.current ?
              textareaRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
            left: textareaRef.current ?
              textareaRef.current.getBoundingClientRect().left + window.scrollX : 0
          }}
        >
          {filteredParticipants.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">{t('notes.noMatchesFound')}</div>
          ) : (
            filteredParticipants.map((participant, index) => (
              <div
                key={participant.id || index}
                data-testid={`editor.${getStageString(documentStage)}.notes.mentionOption.${participant.id || index}`}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectMention(participant)}
                tabIndex={0}
                role="option"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSelectMention(participant);
                  else if (e.key === 'ArrowDown') {
                    const nextItem = mentionMenuRef.current?.querySelector(`div:nth-child(${index + 2})`) as HTMLElement;
                    if (nextItem) nextItem.focus();
                    e.preventDefault();
                  } else if (e.key === 'ArrowUp') {
                    if (index === 0) {
                      textareaRef.current?.focus();
                    } else {
                      const prevItem = mentionMenuRef.current?.querySelector(`div:nth-child(${index})`) as HTMLElement;
                      if (prevItem) prevItem.focus();
                    }
                    e.preventDefault();
                  }
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {participant.initials || participant.name.split(' ').slice(0, 2).map(n => n?.[0] || '').join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">
                  {participant.name}
                  {/* Show participant group/role if available */}
                  {participantGroups.some(group =>
                    group.participants.some(p => p.id === participant.id && p.id !== undefined)
                  ) && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({getParticipantRole(participant)})
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;