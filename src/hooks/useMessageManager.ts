import { v4 as uuid } from "uuid";
import { useAppStore, useChatStore, useDocumentStore, useUserStore, useModalStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { tableCellSelectionAndDocumentState, TableCellSelectionStatus } from '@/components/editor/lib/editUtils';
import { formatDatetimeString } from '@/lib/dateUtils';
import { getDocumentContent } from '@/components/editor/lib/editorUtils';
import { ChatMessage, saveMessage } from '@/lib/apiUtils';
import { useCellSelection } from './CellSelection';
import { BasicResult } from '@/components/editor/lib/addinUtils';

export function useMessageManager() {
  const { t } = useTranslation();
  const appStore = useAppStore(useShallow((state) => ({
    editor: state.editor,
    setWorking: state.setWorking,
    setWorkingTitle: state.setWorkingTitle,
  })));
  
  const { editor, setWorking } = appStore;
  
  const userStore = useUserStore(useShallow((state) => ({
    legalName: state.legalName,
    initials: state.initials,
  })));
  
  const { legalName, initials } = userStore;
  
  const documentStore = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    setEditedBy: state.setEditedBy,
    setEditedAt: state.setEditedAt,
    editTime: state.editTime,
    triggerReload: state.triggerReload,
    setReloadSelection: state.setReloadSelection,
    setEditTime: state.setEditTime,
  })));
  
  const { documentId, setEditedBy, setEditedAt } = documentStore;
  
  const { addMessage } = useChatStore(useShallow((state) => ({
    addMessage: state.addMessage,
  })));
  
  const { deselectCell } = useCellSelection();
  
  const modalStore = useModalStore(useShallow((state) => ({
    setDocumentInUse: state.setDocumentInUse,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    setDocumentStatus: state.setDocumentStatus,
    setOperationFailedError: state.setOperationFailedError,
  })));
  
  /**
   * Saves a message to the document and adds it to the chat store
   * @param messageText The text content of the message
   * @param mentionIds Optional array of user IDs mentioned in the message
   * @returns The bookmark ID if successful, empty string otherwise
   */
  const saveMessageToDocument = async (messageText: string, mentionIds: string[] = []): Promise<string> => {
    if (!editor) {
      console.error("No editor available");
      return "";
    }
    
    setWorking(true);
    
    // Create author name with similar format to what's used in the chat
    const authorName = legalName ? 
      `${legalName}` : 
      t('common.guestUser');
    
    // Create a unique bookmark ID
    const bookmarkId = `_${uuid()}`;
    
    try {
      // Run data sanity check
      const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(
        editor, appStore, modalStore, documentStore
      );
      
      if (!dataSanityData) {
        setWorking(false);
        return "";
      }
      
      // Insert bookmark at current selection
      editor.editor.insertBookmark(bookmarkId);
      
      const { dt, timestamp } = dataSanityData;
      const dateString = formatDatetimeString(dt, t);
      
      // Create the chat message object
      const chatMessage: ChatMessage = {
        id: 0, // Will be overridden by addMessage in the store
        sender: authorName,
        avatar: "/avatars/shadcn.jpg",
        message: messageText,
        timestamp: timestamp,
        bookmarkId: bookmarkId,
        mentions: mentionIds,
      };
      
      // Update document metadata
      setEditedBy(`${legalName} (${initials})`);
      setEditedAt(dateString);
      
      if (!documentId) {
        setWorking(false);
        return "";
      }
      
      deselectCell(editor);
      
      // Get the current document content
      const content: string = await getDocumentContent(editor);
      
      // Save message to backend
      const updateAuditLogResult: BasicResult = await saveMessage(documentId, chatMessage, content);
      
      if (updateAuditLogResult.error) {
        console.error("Error saving message:", updateAuditLogResult.error);
        setWorking(false);
        return "";
      }
      
      // Add message to chat store
      addMessage(chatMessage);
      
      setWorking(false);
      return bookmarkId;
      
    } catch (error) {
      console.error("Error saving message:", error);
      setWorking(false);
      return "";
    }
  };
  
  return {
    saveMessageToDocument
  };
}