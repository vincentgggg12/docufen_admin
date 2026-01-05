import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Plug, Copy, Loader2, AlertCircle } from 'lucide-react';
import { SERVERURL } from '@/lib/server';
import { useTranslation } from 'react-i18next';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';

interface ConnectorOption {
  id: string;
  name: string;
  description: string;
  logo?: string;
  useIcon?: boolean;
  comingSoon?: boolean;
}

interface NewConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConnector: (connectorId: string) => void;
  onTokenCreated?: (tokenId?: string) => void;
}

const NewConnectorDialog: React.FC<NewConnectorDialogProps> = ({
  open,
  onOpenChange,
  onSelectConnector,
  onTokenCreated,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<'select' | 'token'>('select');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorOption | null>(null);
  const [tokenName, setTokenName] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [createdTokenId, setCreatedTokenId] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [hasBeenCopied, setHasBeenCopied] = useState(false);

  const connectorOptions: ConnectorOption[] = [
    {
      id: 'Standard',
      name: 'Standard',
      description: 'Create a Standard REST API connector for your system',
      useIcon: true
    },
    {
      id: 'qiksolve',
      name: 'INQ',
      description: 'QikSolve\'s Quality Management System for document control',
      logo: '/connector_INQ_logo.png',
      comingSoon: true
    },
    {
      id: 'opentext',
      name: 'OpenText',
      description: 'Integrate with OpenText DMS for document processing',
      logo: '/connectors_opentext_logo.jpg',
      comingSoon: true
    },
    {
      id: 'mastercontrol',
      name: 'MasterControl',
      description: 'Connect to MasterControl quality management system',
      logo: '/connector_mastercontrol_logo.webp',
      comingSoon: true
    },
    {
      id: 'qualiio',
      name: 'Qualiio',
      description: 'Connect to Qualiio quality management system',
      logo: '/connector_qualiohq_logo.jpeg',
      comingSoon: true
    },
    {
      id: 'scilife',
      name: 'Scilife',
      description: 'Connect to Scilife quality management system',
      logo: '/connector_scilife_logo.jpg',
      comingSoon: true
    }
  ];

  const handleSelectConnector = (connector: ConnectorOption) => {
    setSelectedConnector(connector);
    // For Standard connector, go directly to token creation
    if (connector.id === 'Standard') {
      setCurrentStep('token');
    } else {
      // For other connectors, just notify parent (future: could add other flows)
      onSelectConnector(connector.id);
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('select');
    setSelectedConnector(null);
    setTokenName('');
    setTokenDescription('');
    setError(null);
    setCreatedToken(null);
    setTokenCopied(false);
    setHasBeenCopied(false);
    setIsCreating(false);
  };

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      setError('Please enter a name for the token');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(SERVERURL + 'tokens/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: tokenName,
          description: tokenDescription,
          connector: 'standard'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create token');
      }

      const data = await response.json();
      setCreatedToken(data.token);
      setCreatedTokenId(data.tokenId);

    } catch (err: any) {
      console.error('Failed to create token:', err);
      setError(err.message || 'Failed to create token. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setTokenCopied(true);
      setHasBeenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleDialogClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset state when dialog closes
      setCurrentStep('select');
      setSelectedConnector(null);
      setTokenName('');
      setTokenDescription('');
      setError(null);
      setCreatedToken(null);
      setCreatedTokenId(null);
      setTokenCopied(false);
      setHasBeenCopied(false);
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]" data-testid="connectorsDialogNew.dialog">
        <DialogHeader>
          <DialogTitle>{t('connectors.createConnector')}</DialogTitle>
          {currentStep === 'select' ? (
            <DialogDescription>
              {t('connectors.importFromConnectedApps')}
            </DialogDescription>
          ) : currentStep === 'token' && selectedConnector ? (
            <DialogDescription>
              {t('connectors.createRestApiConnector', { connectorName: selectedConnector.name })}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {currentStep === 'select' ? (
          <div className="pt-4">
            <TooltipProvider>
              <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-2">
                {connectorOptions.map((connector) => {
                  const ConnectorButton = (
                    <button
                      key={connector.id}
                      onClick={() => {
                        if (!connector.comingSoon) {
                          trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                            button_name: `select_connector_${connector.id.toLowerCase()}`,
                            button_location: 'new_connector_dialog',
                            page_name: 'Connectors'
                          });
                          handleSelectConnector(connector);
                        }
                      }}
                      disabled={connector.comingSoon}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors text-left group relative ${
                        connector.comingSoon
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:bg-muted cursor-pointer'
                      }`}
                      data-testid={`connectorsDialogNew.connector.${connector.id}`}
                    >
                      {connector.comingSoon && (
                        <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs">
                          {t('connectors.comingSoon')}
                        </Badge>
                      )}
                      <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-white flex items-center justify-center border">
                        {connector.useIcon ? (
                          <Plug className="h-5 w-5 text-primary" />
                        ) : (
                          <img
                            src={connector.logo}
                            alt={`${connector.name} logo`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to a colored div if image fails to load
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = '#f0f0f0';
                                parent.innerHTML = `<span class="text-xs font-semibold text-gray-600">${connector.name.substring(0, 2).toUpperCase()}</span>`;
                              }
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm">{connector.name}</h3>
                          {!connector.comingSoon && (
                            <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {connector.description}
                        </p>
                      </div>
                    </button>
                  );

                  if (connector.comingSoon) {
                    return (
                      <Tooltip key={connector.id}>
                        <TooltipTrigger asChild>
                          {ConnectorButton}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('connectors.comingSoon')}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return ConnectorButton;
                })}
              </div>
            </TooltipProvider>
          </div>
        ) : currentStep === 'token' ? (
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!createdToken ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-name">{t('connectors.connectorNameRequired')}</Label>
                    <Input
                      id="token-name"
                      placeholder={t('connectors.connectorNamePlaceholder')}
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      disabled={isCreating}
                      data-testid="connectorsDialogNew.tokenNameInput"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token-description">{t('connectors.connectorDescriptionLabel')}</Label>
                    <Input
                      id="token-description"
                      placeholder={t('connectors.connectorDescriptionPlaceholder')}
                      value={tokenDescription}
                      onChange={(e) => setTokenDescription(e.target.value)}
                      disabled={isCreating}
                      data-testid="connectorsDialogNew.tokenDescriptionInput"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                        button_name: 'back_to_connector_selection',
                        button_location: 'new_connector_dialog',
                        page_name: 'Connectors'
                      });
                      handleBack();
                    }}
                    disabled={isCreating}
                    data-testid="connectorsDialogNew.backButton"
                  >
                    {t('connectors.back')}
                  </Button>
                  <Button
                    onClick={() => {
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                        button_name: 'create_connector_and_token',
                        button_location: 'new_connector_dialog',
                        page_name: 'Connectors'
                      });
                      handleCreateToken();
                    }}
                    disabled={isCreating || !tokenName.trim()}
                    data-testid="connectorsDialogNew.createButton"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('connectors.creating')}
                      </>
                    ) : (
                      t('connectors.createConnectorAndToken')
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <AlertTitle className="text-green-900">{t('connectors.tokenCreatedSuccessfully')}</AlertTitle>
                  <AlertDescription className="text-green-800">
                    {t('connectors.copyTokenNow')}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>{t('connectors.yourApiToken')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={createdToken}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="connectorsDialogNew.createdTokenInput"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                          button_name: 'copy_created_token',
                          button_location: 'new_connector_dialog',
                          page_name: 'Connectors'
                        });
                        handleCopyToken();
                      }}
                      className="min-w-[100px]"
                      data-testid="connectorsDialogNew.copyCreatedTokenButton"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {tokenCopied ? t('connectors.copied') : t('connectors.copyToken')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>
                          <Button
                            onClick={() => {
                              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                                button_name: 'done_creating_connector',
                                button_location: 'new_connector_dialog',
                                page_name: 'Connectors'
                              });
                              handleDialogClose(false);
                              // Pass tokenId to parent for navigation
                              if (onTokenCreated && createdTokenId) {
                                onTokenCreated(createdTokenId);
                              }
                            }}
                            disabled={!hasBeenCopied}
                            data-testid="connectorsDialogNew.doneButton"
                          >
                            {t('connectors.done')}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!hasBeenCopied && (
                        <TooltipContent>
                          <p>{t('connectors.copyTokenFirstTooltip')}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default NewConnectorDialog;
