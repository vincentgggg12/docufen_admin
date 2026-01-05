import React, { useState } from 'react';
import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
import { Separator } from "../../components/ui/separator"
import NewConnectorDialog from './connectorsDialogNew'
import ConnectorsStandard from './connectorsStandard'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../../components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Plug,
  Plus,
  Book,
  Trash2,
  RefreshCw,
  Copy,
  CheckCircle2,
  Key,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAppStore, useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useEffect } from 'react'
import type { APIConnector } from '@/types/connector'
import { SERVERURL } from '@/lib/server'
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude'
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events'

const ConnectorsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })));
  const { connectorsEnabled } = useUserStore(useShallow((state) => ({
    connectorsEnabled: state.connectorsEnabled
  })));

  // Redirect to documents page if connectors are disabled
  useEffect(() => {
    if (!connectorsEnabled) {
      navigate('/documents');
    }
  }, [connectorsEnabled, navigate]);

  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [showNewConnectorForm, setShowNewConnectorForm] = useState(false);
  const [showNewConnectorDialog, setShowNewConnectorDialog] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [regeneratedToken, setRegeneratedToken] = useState<{tokenId: string, token: string} | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [regeneratingTokenId, setRegeneratingTokenId] = useState<string | null>(null);
  const [tokenToRegenerate, setTokenToRegenerate] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectorToDelete, setConnectorToDelete] = useState<string | null>(null);

  const [connectors, setConnectors] = useState<APIConnector[]>([]);

  const fetchTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const response = await fetch(`${SERVERURL}tokens/list`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const tokens = await response.json();
        // Filter out revoked tokens (defense in depth against eventual consistency issues)
        const activeTokens = tokens.filter((token: any) => !token.isRevoked);
        // Map tokens from API
        const tokenConnectors: APIConnector[] = activeTokens.map((token: any) => ({
          id: token.id,
          stableId: token.stableId,
          name: token.name,
          token: token.token, // Abbreviated token like "doc_Y0j..."
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
          lastUsedAt: token.lastUsedAt,
          isExpired: token.isExpired,
          description: token.description || 'No description provided'
        }));
        // Sort by createdAt (newest first)
        tokenConnectors.sort((a, b) => b.createdAt - a.createdAt);
        // Replace entire list with fresh data from server
        setConnectors(tokenConnectors);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const handleTokenCreated = async (newTokenId?: string) => {
    // Refresh the tokens list after a new token is created
    await fetchTokens();
    // If a new token ID is provided (e.g., from regeneration), update the selected connector
    if (newTokenId && selectedConnector) {
      setSelectedConnector(newTokenId);
    }
  };

  const handleCopyToken = () => {
    if (regeneratedToken) {
      navigator.clipboard.writeText(regeneratedToken.token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleShowRegenerateWarning = (tokenId: string) => {
    setTokenToRegenerate(tokenId);
  };

  const handleConfirmRegenerate = async () => {
    if (!tokenToRegenerate) return;

    const tokenId = tokenToRegenerate;
    setTokenToRegenerate(null);
    setRegeneratingTokenId(tokenId);

    try {
      const response = await fetch(`${SERVERURL}tokens/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tokenId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to regenerate token:', errorData.message);
        alert('Failed to regenerate token: ' + (errorData.message || 'Unknown error'));
        return;
      }

      const data = await response.json();
      // Show the new token in a dialog/alert
      setRegeneratedToken({ tokenId: data.tokenId, token: data.token });

      // Refresh the tokens list
      fetchTokens();
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      alert('Failed to regenerate token. Please try again.');
    } finally {
      setRegeneratingTokenId(null);
    }
  };

  const handleSelectConnector = (connectorId: string) => {
    // Map connector IDs to their display names and descriptions
    const connectorMap: Record<string, { name: string; description: string }> = {
      'standard-rest-api': { name: 'Standard REST API', description: 'Universal REST API integration' },
      'custom': { name: 'Custom API', description: 'Custom API connector' },
      'qiksolve': { name: 'INQ', description: 'QikSolve\'s Quality Management System' },
      'opentext': { name: 'OpenText DMS', description: 'Document management integration' },
      'mastercontrol': { name: 'MasterControl', description: 'Quality management integration' },
      'qualiio': { name: 'Qualiio', description: 'Quality management integration' }
    };

    const connectorInfo = connectorMap[connectorId];
    if (!connectorInfo) return;

    // Navigate to the appropriate setup page
    if (connectorId === 'opentext') {
      navigate('/connectors/opentext');
    } else if (connectorId === 'standard-rest-api') {
      navigate('/connectors/standard-rest-api');
    } else {
      // For other connectors, just select them
      setSelectedConnector(connectorId);
    }
  };

  const getConnectorLogo = (connectorName: string) => {
    const logoMap: Record<string, { type: 'image' | 'icon'; src?: string }> = {
      'Standard REST API': { type: 'icon' },
      'Custom API': { type: 'icon' },
      'INQ': { type: 'image', src: '/connector_INQ_logo.png' },
      'OpenText DMS': { type: 'image', src: '/connectors_opentext_logo.jpg' },
      'MasterControl': { type: 'image', src: '/connector_mastercontrol_logo.webp' },
      'Qualiio': { type: 'image', src: '/connector_qualiohq_logo.jpeg' },
      'SAP Manufacturing': { type: 'icon' }
    };

    const logoInfo = logoMap[connectorName] || { type: 'icon' };

    if (logoInfo.type === 'icon') {
      return (
        <div className="p-2 bg-primary/10 rounded-lg">
          <Plug className="h-5 w-5 text-primary" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border">
        <img
          src={logoInfo.src}
          alt={`${connectorName} logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '';
              parent.className = 'p-2 bg-primary/10 rounded-lg';
              const icon = document.createElement('div');
              icon.innerHTML = '<svg class="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M16 8l-4-4-4 4M8 16l4 4 4-4"/></svg>';
              parent.appendChild(icon);
            }
          }}
        />
      </div>
    );
  };

  const handleDeleteClick = (connectorId: string) => {
    setConnectorToDelete(connectorId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!connectorToDelete) return;

    try {
      const response = await fetch(`${SERVERURL}tokens/${connectorToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove from local state after successful deletion
        setConnectors(prev => prev.filter(c => c.id !== connectorToDelete));
      } else {
        console.error('Failed to delete token');
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      // Optionally show an error message to the user
    } finally {
      setConnectorToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Set page title
  React.useEffect(() => {
    document.title = t('nav.connectors') || 'Connectors';
  }, [t]);

  // Load tokens on mount
  React.useEffect(() => {
    fetchTokens();
  }, []);

  // Connector Detail View
  if (selectedConnector || showNewConnectorForm) {
    const connector = connectors.find(c => c.id === selectedConnector);
    const isNew = !connector;

    return (
      <ConnectorsStandard
        connector={connector}
        isNew={isNew}
        onBack={() => {
          setSelectedConnector(null);
          setShowNewConnectorForm(false);
        }}
        onConnectorUpdated={handleTokenCreated}
      />
    );
  }

  // Main Connectors List View
  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      defaultOpen={true}
    >
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-medium text-gray-700">
                    {t('nav.connectors')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 text-gray-600">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                  button_name: 'view_api_documentation',
                  button_location: 'connectors_page_header',
                  page_name: 'Connectors'
                });
                window.open('https://docs.docufen.com/api/RestAPI', '_blank');
              }}
              data-testid="connectorsPage.viewApiDocsButton"
            >
              <Book className="h-4 w-4 mr-2" />
              {t('connectors.viewApiDocumentation')}
            </Button>
            <Button
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                  button_name: 'new_connector',
                  button_location: 'connectors_page_header',
                  page_name: 'Connectors'
                });
                setShowNewConnectorDialog(true);
              }}
              data-testid="connectorsPage.newConnectorButton"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('connectors.newConnector')}
            </Button>
          </div>

          {/* Connectors List */}
          <div className="space-y-4">
            {isLoadingTokens ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : connectors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Plug className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('connectors.noConnectors')}</p>
                <p className="text-sm mt-1">{t('connectors.createFirstConnector')}</p>
              </div>
            ) : (
              connectors.map(connector => (
              <div
                key={connector.id}
                className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={`connectorsPage.connectorCard.${connector.id}`}
              >
                <div
                  className="flex items-center gap-4 cursor-pointer flex-1"
                  onClick={() => {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                      button_name: 'open_connector_details',
                      button_location: 'connectors_list',
                      page_name: 'Connectors'
                    });
                    setSelectedConnector(connector.id);
                  }}
                  data-testid={`connectorsPage.connectorCard.${connector.id}.details`}
                >
                  {getConnectorLogo(connector.name)}
                  <div>
                    <p className="font-medium">{connector.name}</p>
                    {connector.description && (
                      <p className="text-xs text-muted-foreground mt-1">{connector.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between flex-[2] text-xs text-muted-foreground">
                  <span className="font-mono">{connector.token}</span>
                  <span className="whitespace-nowrap">
                    {t('connectors.created')}: {new Date(connector.createdAt).toLocaleDateString()}
                  </span>
                  <span className="whitespace-nowrap">
                    {t('connectors.lastUsed')}: {connector.lastUsedAt ? new Date(connector.lastUsedAt).toLocaleDateString() : t('connectors.never')}
                  </span>
                  <div>
                    {connector.isExpired ? (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {t('connectors.expired')}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                        {t('connectors.active')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                        button_name: 'regenerate_connector_token',
                        button_location: 'connectors_list',
                        page_name: 'Connectors'
                      });
                      handleShowRegenerateWarning(connector.id);
                    }}
                    disabled={regeneratingTokenId === connector.id}
                    data-testid={`connectorsPage.connectorCard.${connector.id}.regenerateButton`}
                  >
                    {regeneratingTokenId === connector.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                        button_name: 'delete_connector',
                        button_location: 'connectors_list',
                        page_name: 'Connectors'
                      });
                      handleDeleteClick(connector.id);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`connectorsPage.connectorCard.${connector.id}.deleteButton`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </SidebarInset>

      {/* New Connector Dialog */}
      <NewConnectorDialog
        open={showNewConnectorDialog}
        onOpenChange={setShowNewConnectorDialog}
        onSelectConnector={handleSelectConnector}
        onTokenCreated={handleTokenCreated}
      />

      {/* Regenerate Confirmation Warning Dialog */}
      <Dialog open={!!tokenToRegenerate} onOpenChange={(open) => {
        if (!open) {
          trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CANCELLED, {
            dialog_type: 'regenerate_token_confirmation',
            action_cancelled: 'regenerate_connector_token',
            page_name: 'Connectors'
          });
          setTokenToRegenerate(null);
        }
      }}>
        <DialogContent className="max-w-md" data-testid="connectorsPage.regenerateDialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              {t('connectors.confirmRegenerateTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('connectors.confirmRegenerateMessage')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTitle className="text-orange-900">{t('connectors.importantWarning')}</AlertTitle>
              <AlertDescription className="text-orange-800">
                {t('connectors.confirmRegenerateWarning')}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CANCELLED, {
                    dialog_type: 'regenerate_token_confirmation',
                    action_cancelled: 'regenerate_connector_token',
                    page_name: 'Connectors'
                  });
                  setTokenToRegenerate(null);
                }}
                data-testid="connectorsPage.regenerateDialog.cancelButton"
              >
                {t('connectors.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CONFIRMED, {
                    dialog_type: 'regenerate_token_confirmation',
                    action_confirmed: 'regenerate_connector_token',
                    page_name: 'Connectors'
                  });
                  handleConfirmRegenerate();
                }}
                data-testid="connectorsPage.regenerateDialog.confirmButton"
              >
                {t('connectors.regenerate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerated Token Dialog */}
      <Dialog open={!!regeneratedToken} onOpenChange={(open) => {
        if (!open) {
          setRegeneratedToken(null);
          setTokenCopied(false);
        }
      }}>
        <DialogContent className="max-w-lg" data-testid="connectorsPage.tokenRegeneratedDialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('connectors.tokenRegeneratedTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('connectors.tokenRegeneratedMessage')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">{t('connectors.successTitle')}</AlertTitle>
              <AlertDescription className="text-green-800">
                {t('connectors.oldTokenRevoked')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{t('connectors.yourNewApiToken')}</Label>
              <div className="flex gap-2">
                <Input
                  value={regeneratedToken?.token || ''}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="connectorsPage.tokenRegeneratedDialog.tokenInput"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                      button_name: 'copy_regenerated_token',
                      button_location: 'token_regenerated_dialog',
                      page_name: 'Connectors'
                    });
                    handleCopyToken();
                  }}
                  className="min-w-[100px]"
                  data-testid="connectorsPage.tokenRegeneratedDialog.copyButton"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {tokenCopied ? t('connectors.copied') : t('connectors.copy')}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.MODAL_CLOSED, {
                    modal_name: 'token_regenerated',
                    close_method: 'button',
                    time_open_ms: 0
                  });
                  setRegeneratedToken(null);
                  setTokenCopied(false);
                }}
                data-testid="connectorsPage.tokenRegeneratedDialog.doneButton"
              >
                {t('connectors.done')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="connectorsPage.deleteDialog">
          <DialogHeader>
            <DialogTitle>{t('connectors.deleteConnectorTitle')}</DialogTitle>
            <DialogDescription>
              {t('connectors.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CANCELLED, {
                  dialog_type: 'delete_connector_confirmation',
                  action_cancelled: 'delete_connector',
                  page_name: 'Connectors'
                });
                setDeleteDialogOpen(false);
              }}
              data-testid="connectorsPage.deleteDialog.cancelButton"
            >
              {t('connectors.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CONFIRMED, {
                  dialog_type: 'delete_connector_confirmation',
                  action_confirmed: 'delete_connector',
                  page_name: 'Connectors'
                });
                handleConfirmDelete();
              }}
              data-testid="connectorsPage.deleteDialog.confirmButton"
            >
              {t('connectors.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ConnectorsPage;
