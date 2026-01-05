/**
 * Shared type definitions for API Connectors
 */

export interface APIConnector {
  id: string;
  stableId?: string; // Stable UUID for document tracking (optional during transition)
  name: string;
  token: string;
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  isExpired: boolean;
  description?: string;
  // Optional fields for UI display
  documentsReceived?: number;
  lastActivity?: string;
}
