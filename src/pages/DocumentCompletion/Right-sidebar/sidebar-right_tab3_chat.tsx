import React from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useChatStore, useUserStore, useAppStore, useDocumentStore 
} from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { ChatMessage, Participant } from "@/lib/apiUtils";
import { formatDatetimeStringFromTimestamp } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { useMessageManager } from "@/hooks/useMessageManager";
import { useParticipants } from "@/hooks/useParticipants";

export function ChatTab() {
  const { messages } = useChatStore(
    useShallow((state) => ({
      messages: state.messages,
      addMessage: state.addMessage,
    }))
  );
  const userStore = useUserStore(useShallow((state) => ({
    user: state.user,
    legalName: state.legalName,
    setUser: state.setUser,
    initials: state.initials,
  })));
  // Get user information from the user store
  const { legalName, initials } = userStore
  const { participantGroups } = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    setDocumentStage: state.setDocumentStage,
    setMarkerCounter: state.setMarkerCounter,
    setEmptyCellCount: state.setEmptyCellCount,
    setEditedBy: state.setEditedBy,
    setEditedAt: state.setEditedAt,
    editTime: state.editTime,
    setEditTime: state.setEditTime,
    setDocumentHasContent: state.setDocumentHasContent,
    participantGroups: state.participantGroups
  })));
  const { t } = useTranslation()
  const { saveMessageToDocument } = useMessageManager();
 
  // Get editor and toggleComments from app store
  const { editor } = useAppStore(
    useShallow((state) => ({
      editor: state.editor,
    }))
  );

  const [newMessage, setNewMessage] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // State for mentions feature
  const [showMentionMenu, setShowMentionMenu] = React.useState(false);
  const [mentionFilter, setMentionFilter] = React.useState("");
  const [mentionStartIndex, setMentionStartIndex] = React.useState(-1);
  const mentionMenuRef = React.useRef<HTMLDivElement>(null);
  const [mentionIds, setMentionIds] = React.useState<string[]>([]);
  const { 
    filterParticipants,
    getParticipantRoles
  } = useParticipants(participantGroups);
  
  // Helper function to determine if the message is from the current user
  const isCurrentUser = (sender: string) => {
    if (!legalName) return false;
    return sender === legalName || 
           (initials && sender.includes(initials));
  };

  // Helper function to format sender name (remove initials if they're already displayed separately)
  const formatSenderName = (sender: string) => {
    if (initials && sender.includes(`(${initials})`)) {
      return sender.replace(` (${initials})`, '');
    }
    return sender;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get all participants from participant groups
  const getAllParticipants = React.useMemo(() => {
    const allParticipants: Participant[] = [];
    const uniqueIds: string[] = [];
    participantGroups.forEach(group => {
      console.log("Group: ", group.title, group.participants.length);
      if (group.participants && group.participants.length > 0) {
        group.participants.forEach(participant => {
          console.log("Participant: ", participant.name, participant.id);
          if (participant.id && !uniqueIds.includes(participant.id)) {
            console.log("!!!IN!!! Participant: ", participant.name, participant.id);
            uniqueIds.push(participant.id);
            allParticipants.push(participant);
          }
        });
      }
    });
    return allParticipants;
  }, [participantGroups]);

// Replace existing filteredParticipants with:
const filteredParticipants = React.useMemo(() => {
  return filterParticipants(mentionFilter);
}, [mentionFilter, filterParticipants]);

  // Function to handle input change and detect @ symbol for mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNewMessage(newValue);

    // Check for @ symbol and handle mentions
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
    // console.log("@ processing: ", cursorPosition, atSymbolIndex, textBeforeCursor);

    if (atSymbolIndex !== -1 && (atSymbolIndex === 0 || textBeforeCursor[atSymbolIndex - 1] === ' ')) {
      // Capture text after @ symbol as filter for mentions
      const mentionText = textBeforeCursor.substring(atSymbolIndex + 1);
      // console.log("Updating mention filter text: ", mentionText);
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
      const textBeforeMention = newMessage.substring(0, mentionStartIndex);
      const textAfterMention = newMessage.substring(mentionStartIndex + 1 + mentionFilter.length);
      
      // Insert the mention with a special format
      const newText = `${textBeforeMention}@${participant.name}${textAfterMention}`;
      setNewMessage(newText);
      setMentionIds((prev) => {
        if (!participant.id) return prev;
        const newMentionIds = [...prev];
        if (!newMentionIds.includes(participant.id)) {
          newMentionIds.push(participant.id);
        }
        return newMentionIds;
      });
      setMentionFilter("");
      setShowMentionMenu(false);
      
      // Focus input and place cursor after the mention
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPosition = mentionStartIndex + participant.name.length + 1; // +1 for the @ symbol
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 0);
      }
    }
  };

  // Detect clicks outside mention menu to close it
  React.useEffect(() => {
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
  }, []);

  // Format message text to highlight mentions
  const formatMessageWithMentions = (message: string) => {
    // Split by @ symbol to find potential mentions
    const parts = message.split('@');
    if (parts.length === 1) return message; // No @ symbols found

    return (
      <>
        {parts.map((part, index) => {
          if (index === 0) return part; // Text before first @

          // Check if this part starts with a participant name
          const participantMatch = getAllParticipants.find(p => 
            part.startsWith(p.name)
          );

          if (participantMatch) {
            const remainingText = part.substring(participantMatch.name.length);
            return (
              <React.Fragment key={index}>
                <span className="bg-blue-100 text-blue-800 px-1 rounded">@{participantMatch.name}</span>
                {remainingText}
              </React.Fragment>
            );
          }

          // If no match, just return the @ and the text
          return <>@{part}</>;
        })}
      </>
    );
  };

  // Function to navigate to comment position in the document
  const navigateToComment = (msg: ChatMessage) => {
    if (!editor || !msg.bookmarkId) return;
    
    // Navigate to the bookmark
    editor.selection.selectBookmark(msg.bookmarkId);
    
    // Add a temporary highlight animation class to the document editor
    const editorContainer = document.querySelector('.e-de-content-wrapper');
    if (editorContainer) {
      // Add class that will trigger the highlight animation
      editorContainer.classList.add('bookmark-highlight-active');
      
      // Store the bookmark ID for CSS targeting
      editorContainer.setAttribute('data-active-bookmark', msg.bookmarkId);
      
      // Remove the class after animation completes (3 seconds)
      setTimeout(() => {
        editorContainer.classList.remove('bookmark-highlight-active');
        editorContainer.removeAttribute('data-active-bookmark');
      }, 3000);
    }
  };


  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;
    
    const result = await saveMessageToDocument(newMessage, mentionIds);
    if (result) {
      setNewMessage("");
      setMentionIds([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showMentionMenu && filteredParticipants.length > 0) {
        // If mention menu is open and there are results, select the first one
        handleSelectMention(filteredParticipants[0]);
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape' && showMentionMenu) {
      setShowMentionMenu(false);
    } else if (e.key === 'ArrowDown' && showMentionMenu) {
      // Focus the first item in the mention menu
      const firstItem = mentionMenuRef.current?.querySelector('div') as HTMLElement;
      if (firstItem) firstItem.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background" style={{ backgroundColor: "#F5F2EE" }} data-testid="docExecutionPage.rsb.chat.container">
      {/* Header with title */}
      <div className="flex items-center justify-between mb-4" data-testid="docExecutionPage.rsb.chat.header">
        <h2 className="text-base font-medium" data-testid="docExecutionPage.rsb.chat.title">{t('mPopup.tab.notes')}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-0 space-y-4" data-testid="docExecutionPage.rsb.chat.messagesContainer">
        {messages.map((msg) => (
          <div key={msg.timestamp} className={`flex items-start gap-2 ${isCurrentUser(msg.sender) ? "justify-end" : "justify-start"}`} data-testid={`docExecutionPage.rsb.chat.message${msg.timestamp}`}>
            {!isCurrentUser(msg.sender) && (
              <div className="w-2"></div>
            )}
            <div 
              className={`p-3 rounded-lg flex-1 relative ${
                isCurrentUser(msg.sender)
                  ? "bg-[#FAF9F5] border border-gray-200" 
                  : "bg-[#FAF9F5]"
              } ${msg.bookmarkId ? "cursor-pointer hover:bg-opacity-90 transition-colors" : ""}`}
              onClick={() => msg.bookmarkId && navigateToComment(msg)}
              title={msg.bookmarkId ? t('click-to-go-to-this-note-in-document') : ""}
              data-testid={`docExecutionPage.rsb.chat.messageContent${msg.timestamp}`}
            >
              {/* Header with sender name and initials */}
              <div className="flex justify-between items-center mb-1" data-testid={`docExecutionPage.rsb.chat.messageHeader${msg.timestamp}`}>
                <div className="text-sm font-medium" data-testid={`docExecutionPage.rsb.chat.senderName${msg.timestamp}`}>{formatSenderName(msg.sender)}</div>
                <Avatar className="h-5 w-5 flex-shrink-0" data-testid={`docExecutionPage.rsb.chat.senderAvatar${msg.timestamp}`}>
                  <AvatarFallback className="text-[10px] bg-muted/30">
                    {isCurrentUser(msg.sender) ? 
                      (initials || msg.sender.split(' ').slice(0, 2).map(n => n?.[0] || '').join('')) : 
                      msg.sender.split(' ').slice(0, 2).map(n => n?.[0] || '').join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="text-sm" data-testid={`docExecutionPage.rsb.chat.messageText${msg.timestamp}`}>{formatMessageWithMentions(msg.message)}</div>
              <div className="text-xs text-gray-500 mt-1" data-testid={`docExecutionPage.rsb.chat.messageTimestamp${msg.timestamp}`}>
                {msg.bookmarkId && <span className="mr-2">📝</span>}
                {formatDatetimeStringFromTimestamp(msg.timestamp, t)}
              </div>
            </div>
            {isCurrentUser(msg.sender) && (
              <div className="w-2"></div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="pb-4 relative" data-testid="docExecutionPage.rsb.chat.inputSection">
        <div className="flex items-center gap-2" data-testid="docExecutionPage.rsb.chat.inputContainer">
          <Input 
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={t('notes.type-to-mention-someone')}
            className="flex-1"
            data-testid="docExecutionPage.rsb.chat.messageInput"
          />
          <Button size="icon" onClick={handleSendMessage} data-testid="docExecutionPage.rsb.chat.sendButton">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Mention menu dropdown */}
        {showMentionMenu && (
          <div 
            ref={mentionMenuRef} 
            className="absolute bottom-full left-0 mb-1 bg-white shadow-lg rounded-md max-h-64 overflow-y-auto z-10 w-3/4"
            data-testid="docExecutionPage.rsb.chat.mentionMenu"
          >
            {filteredParticipants.length === 0 ? (
              <div className="p-2 text-sm text-gray-500" data-testid="docExecutionPage.rsb.chat.mentionNoResults">{t('notes.noMatchesFound')}</div>
            ) : (
              filteredParticipants.map((participant, index) => (
                <div
                  key={participant.id || index}
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
                        inputRef.current?.focus();
                      } else {
                        const prevItem = mentionMenuRef.current?.querySelector(`div:nth-child(${index})`) as HTMLElement;
                        if (prevItem) prevItem.focus();
                      }
                      e.preventDefault();
                    }
                  }}
                  data-testid={`docExecutionPage.rsb.chat.mentionOption${participant.id || index}`}
                >
                  <Avatar className="h-6 w-6" data-testid={`docExecutionPage.rsb.chat.mentionAvatar${participant.id || index}`}>
                    <AvatarFallback className="text-xs">
                      {participant.initials || participant.name.split(' ').slice(0, 2).map(n => n?.[0] || '').join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium" data-testid={`docExecutionPage.rsb.chat.mentionName${participant.id || index}`}>
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
    </div>
  );

  // Then replace the getParticipantRole function with:
  function getParticipantRole(participant: Participant): string {
    return getParticipantRoles(participant);
  }
}
export default ChatTab;
