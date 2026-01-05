import { useState, useRef, useCallback, useEffect } from 'react';
import { Participant } from '@/lib/apiUtils';
import { useParticipants } from '@/hooks/useParticipants';

interface UseMentionsProps {
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  participantGroups: any[];
}

export function useMentions({ inputRef, participantGroups }: UseMentionsProps) {
  // State for mentions feature
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const mentionMenuRef = useRef<HTMLDivElement>(null);
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  
  const { filterParticipants, getParticipantRoles } = useParticipants(participantGroups);
  
  // Memoize filtered participants
  const filteredParticipants = filterParticipants(mentionFilter);

  // Function to handle input change and detect @ symbol for mentions
  const handleInputChange = useCallback((text: string, cursorPosition: number) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
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
  }, []);

  // Handle selecting a mention from the dropdown
  const insertMention = useCallback((text: string, participant: Participant): { newText: string, newCursorPosition: number } => {
    if (mentionStartIndex < 0) return { newText: text, newCursorPosition: text.length };
    
    const textBeforeMention = text.substring(0, mentionStartIndex);
    const textAfterMention = text.substring(mentionStartIndex + 1 + mentionFilter.length);
    
    // Insert the mention with a special format
    const newText = `${textBeforeMention}@${participant.name}${textAfterMention}`;
    
    // Add the participant ID to mentionIds if it has an ID and isn't already included
    if (participant.id && !mentionIds.includes(participant.id)) {
      setMentionIds(prev => [...prev, participant.id!]);
    }
    
    setShowMentionMenu(false);
    const newCursorPosition = mentionStartIndex + participant.name.length + 1; // +1 for the @ symbol
    
    return { newText, newCursorPosition };
  }, [mentionStartIndex, mentionFilter, mentionIds]);

  // Reset mentions
  const resetMentions = useCallback(() => {
    setMentionIds([]);
    setShowMentionMenu(false);
    setMentionFilter("");
    setMentionStartIndex(-1);
  }, []);

  // Detect clicks outside mention menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowMentionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputRef]);

  return {
    showMentionMenu,
    setShowMentionMenu,
    mentionFilter,
    mentionMenuRef,
    mentionIds,
    filteredParticipants,
    handleInputChange,
    insertMention,
    resetMentions,
    getParticipantRoles
  };
}