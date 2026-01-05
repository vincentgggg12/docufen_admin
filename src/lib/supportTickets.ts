// Support Ticket System - Backend API Integration with Jira Service Management

import { SERVERURL } from './server';
import { getAuthorization } from './apiUtils';
import i18n from '@/i18n';

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  tenant: string;
  ticketKey: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  comments: TicketComment[];
  hasNewReply?: boolean;
}

export interface CommentMark {
  type: string;
  attrs: {
    href: string;
  }
}

export interface CommentParagraph {
  type: string;
  text: string;
  marks?: [{"type":"link","attrs":{"href":"http://www.docufen.com"}}]
}

export interface Comment {
  type: string
  content: CommentParagraph[]
}

export interface TicketComment {
  id: string;
  author: string;
  authorEmail: string;
  body: string;
  created: number;
  isSupport: boolean;
}

// export interface TicketDetail extends SupportTicket {
//   comments: TicketComment[];
// }

export interface CreateTicketRequest {
  summary: string;
  description: string;
}

export interface CreateTicketResponse {
  success: boolean;
  ticketKey?: string;
  error?: string;
}

export interface GetTicketsResponse {
  success: boolean;
  tickets?: SupportTicket[];
  error?: string;
}

// Create a new support ticket
export async function createSupportTicket(
  request: CreateTicketRequest,
  files?: File[]
): Promise<CreateTicketResponse> {
  try {
    const authorization = await getAuthorization();
    
    // Use FormData when files are present
    let body: FormData | string;
    let headers: HeadersInit = {
      'Authorization': `Bearer ${authorization}`,
    };
    
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('summary', request.summary);
      formData.append('description', request.description);
      formData.append('priority', 'Medium'); // Default priority (must be English for Jira API)
      
      // Backend expects single file as 'attachment'
      // For now, we'll send only the first file
      if (files[0]) {
        formData.append('attachment', files[0]);
      }
      
      body = formData;
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        ...request,
        priority: 'Medium' // Default priority (must be English for Jira API)
      });
    }
    
    const response = await fetch(`${SERVERURL}support/ticket/create/`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      // Check if response is HTML (indicates wrong endpoint)
      if (errorData.includes('<!DOCTYPE')) {
        throw new Error(i18n.t('support.errors.apiNotAvailable'));
      }
      throw new Error(errorData || i18n.t('support.errors.createFailed'));
    }

    const data = await response.json();
    return {
      success: true,
      ticketKey: data.ticketKey,
    };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : i18n.t('support.errors.unexpectedError'),
    };
  }
}

// Get user's support tickets
export async function getUserTickets(): Promise<GetTicketsResponse> {
  try {
    const response = await fetch(`${SERVERURL}support/ticket/list/`, {
      method: 'GET',
      headers: {
      },
      credentials: 'include',
    });
    console.log("Fetching user tickets from: ", `${SERVERURL}support/ticket/list/`, response.status);
    if (!response.ok) {
      const errorData = await response.text();
      // Check if response is HTML (indicates wrong endpoint)
      if (errorData.includes('<!DOCTYPE')) {
        throw new Error(i18n.t('support.errors.apiNotAvailable'));
      }
      throw new Error(errorData || i18n.t('support.errors.loadTicketsFailed'));
    }

    const data = await response.json();
    return {
      success: true,
      tickets: data.tickets,
    };
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : i18n.t('support.errors.unexpectedError'),
    };
  }
}

// Get a specific ticket by key with full details and comments
export async function getTicketByKey(
  ticketKey: string
): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
  try {
    const authorization = await getAuthorization();
    const response = await fetch(`${SERVERURL}support/ticket/${ticketKey}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authorization}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.text();
      // Check if response is HTML (indicates wrong endpoint)
      if (errorData.includes('<!DOCTYPE')) {
        throw new Error(i18n.t('support.errors.apiNotAvailable'));
      }
      throw new Error(errorData || i18n.t('support.errors.loadTicketDetailFailed'));
    }

    const data = await response.json();
    return {
      success: true,
      ticket: data.ticket,
    };
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : i18n.t('support.errors.unexpectedError'),
    };
  }
}

// Add a comment to a ticket
export async function addTicketComment(
  ticketKey: string,
  comment: string,
  file?: File
): Promise<{ success: boolean; error?: string }> {
  try {
    const authorization = await getAuthorization();
    
    // If there's a file, use FormData
    if (file) {
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('attachment', file);
      
      const response = await fetch(`${SERVERURL}support/ticket/${ticketKey}/comment/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authorization}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        if (errorData.includes('<!DOCTYPE')) {
          throw new Error(i18n.t('support.errors.apiNotAvailable'));
        }
        throw new Error(errorData || i18n.t('support.errors.replyFailed'));
      }

      return {
        success: true,
      };
    } else {
      // No file, use JSON
      const response = await fetch(`${SERVERURL}support/ticket/${ticketKey}/comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authorization}`,
        },
        credentials: 'include',
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        if (errorData.includes('<!DOCTYPE')) {
          throw new Error(i18n.t('support.errors.apiNotAvailable'));
        }
        throw new Error(errorData || i18n.t('support.errors.replyFailed'));
      }

      return {
        success: true,
      };
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : i18n.t('support.errors.unexpectedError'),
    };
  }
}