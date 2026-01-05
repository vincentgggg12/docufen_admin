import React, { useState, useEffect } from 'react';
import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
import { Separator } from "../../components/ui/separator"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AuditLogTable, { AuditLogDocument } from './AuditLogTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Key,
  FileText,
  Code,
  Terminal,
  Loader2,
  Send,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { useTranslation } from "react-i18next"
import type { APIConnector } from '@/types/connector'
import { useNavigate } from 'react-router-dom';
import { SERVERURL } from '@/lib/server';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';

interface ConnectorsStandardProps {
  connector?: APIConnector;
  isNew?: boolean;
  onBack?: () => void;
  onConnectorUpdated?: (newTokenId?: string) => void;
}

const ConnectorsStandard: React.FC<ConnectorsStandardProps> = ({ connector, isNew = false, onBack, onConnectorUpdated }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate('/connectors'));
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })));

  const [tokenCopied, setTokenCopied] = useState(false);
  const [endpointCopied, setEndpointCopied] = useState(false);
  const [regeneratedToken, setRegeneratedToken] = useState<{tokenId: string, stableId: string, token: string} | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogDocument[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);

  const [baseEndpointUrl, setBaseEndpointUrl] = useState<string>("");

  // Set endpoint URL on mount
  useEffect(() => {
    if (!SERVERURL.includes("localhost")) {
      const selfUrl = window.location.origin;
      setBaseEndpointUrl(selfUrl + "/api/connector/upload-document")
    } else {
      setBaseEndpointUrl(`${SERVERURL}connector/upload-document`)
    }
  }, []);

  // The connector prop comes from parent and is always up-to-date
  // After regeneration, parent will refresh and pass updated connector
  const currentConnector = connector;

  // Initialize edited values when connector loads
  useEffect(() => {
    if (currentConnector) {
      setEditedName(currentConnector.name || '');
      setEditedDescription(currentConnector.description || 'No description provided');
    }
  }, [currentConnector?.id]);

  // Check if there are unsaved changes
  const hasChanges = currentConnector && (
    editedName !== currentConnector.name ||
    editedDescription !== (currentConnector.description || 'No description provided')
  );

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(baseEndpointUrl);
    setEndpointCopied(true);
    setTimeout(() => setEndpointCopied(false), 2000);
  };

  const handleRegenerateToken = async () => {
    if (!currentConnector?.id) return;

    setShowRegenerateWarning(false);
    setIsRegenerating(true);

    try {
      const response = await fetch(`${SERVERURL}tokens/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tokenId: currentConnector.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to regenerate token:', errorData.message);
        alert('Failed to regenerate token: ' + (errorData.message || 'Unknown error'));
        return;
      }

      const data = await response.json();
      setRegeneratedToken({ tokenId: data.tokenId, stableId: data.stableId, token: data.token });

      // Notify parent to refresh its token list and update selected connector ID
      if (onConnectorUpdated) {
        onConnectorUpdated(data.tokenId);
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      alert('Failed to regenerate token. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyRegeneratedToken = () => {
    if (regeneratedToken) {
      navigator.clipboard.writeText(regeneratedToken.token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!currentConnector?.id || !hasChanges) return;

    try {
      const response = await fetch(`${SERVERURL}tokens/${currentConnector.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editedName,
          description: editedDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update connector:', errorData.message);
        toast.error('Failed to update connector: ' + (errorData.message || 'Unknown error'));
        return;
      }

      // Refresh the parent component's connector list to show updated data
      if (onConnectorUpdated) {
        onConnectorUpdated();
      }

      toast.success('Connector updated successfully!');
    } catch (error) {
      console.error('Failed to update connector:', error);
      toast.error('Failed to update connector. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (currentConnector) {
      setEditedName(currentConnector.name || '');
      setEditedDescription(currentConnector.description || 'No description provided');
    }
  };

  // Fetch audit logs from the new endpoint
  const fetchAuditLogs = React.useCallback(async () => {
    if (!currentConnector?.name) return;

    setIsLoadingAuditLogs(true);
    try {
      // Use stableId if available, otherwise skip query (old tokens won't have documents to show)
      if (!currentConnector.stableId) {
        console.warn('Token does not have stableId - cannot query documents');
        setAuditLogs([]);
        setAuditTotalPages(0);
        setIsLoadingAuditLogs(false);
        return;
      }

      const params = new URLSearchParams({
        tokenId: currentConnector.stableId,
        page: auditCurrentPage.toString(),
        pageSize: auditRowsPerPage.toString(),
        search: auditSearchTerm,
        actionFilter: auditActionFilter
      });

      const response = await fetch(`${SERVERURL}connector/audit-logs?${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.documents || []);
        setAuditTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error('Failed to fetch audit logs:', response.statusText);
        setAuditLogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setAuditLogs([]);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, [setIsLoadingAuditLogs, setAuditLogs, setAuditTotalPages, auditCurrentPage,
    currentConnector, auditRowsPerPage, auditSearchTerm, auditActionFilter]);


  // Fetch audit logs when connector, page, pageSize, search, or filter changes
  useEffect(() => {
    if (currentConnector?.id) {
      fetchAuditLogs();
    }
  }, [currentConnector?.id, auditCurrentPage, auditRowsPerPage, auditSearchTerm, 
    auditActionFilter, fetchAuditLogs]);

  // Set page title
  React.useEffect(() => {
    document.title = isNew ? 'New API Connector' : connector?.name || 'Standard API Connector';
  }, [isNew, connector]);
  if (connector == null) return null;
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
                    {t('nav.connectors')} / {isNew ? 'New API Connector' : connector?.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 text-gray-600">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => {
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                button_name: 'back_to_connectors',
                button_location: 'connector_detail_page',
                page_name: 'Connector Details'
              });
              handleBack();
            }}
            data-testid="connectorsStandard.backButton"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('connectors.backToConnectors')}
          </Button>

          <Tabs defaultValue="setup" className="space-y-4" onValueChange={(value) => {
            trackAmplitudeEvent(AMPLITUDE_EVENTS.TAB_SWITCHED, {
              from_tab: 'previous_tab',
              to_tab: value,
              tab_group: 'connector_tabs',
              page_name: 'Connector Details'
            });
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup" data-testid="connectorsStandard.setupTab">{t('connectors.connectorSettings')}</TabsTrigger>
              <TabsTrigger value="integration" data-testid="connectorsStandard.integrationTab">{t('connectors.integrationGuide')}</TabsTrigger>
              <TabsTrigger value="logs" data-testid="connectorsStandard.logsTab">{t('connectors.auditLog')}</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup">
              <Card>
                <CardHeader>
                  <CardTitle>Standard REST API Connector</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="connector-name">{t('connectors.connectorName')}</Label>
                        <Input
                          id="connector-name"
                          placeholder={t('connectors.connectorNamePlaceholder')}
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          data-testid="connectorsStandard.nameInput"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{t('connectors.connectorDescription')}</Label>
                        <Input
                          id="description"
                          placeholder={t('connectors.connectorDescriptionPlaceholder')}
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          data-testid="connectorsStandard.descriptionInput"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                            button_name: 'cancel_connector_edit',
                            button_location: 'connector_setup_tab',
                            page_name: 'Connector Details'
                          });
                          handleCancel();
                        }}
                        disabled={!hasChanges}
                        data-testid="connectorsStandard.cancelButton"
                      >
                        {t('connectors.cancel')}
                      </Button>
                      <Button
                        onClick={() => {
                          trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                            button_name: 'save_connector_configuration',
                            button_location: 'connector_setup_tab',
                            page_name: 'Connector Details'
                          });
                          handleSaveConfiguration();
                        }}
                        disabled={!hasChanges}
                        data-testid="connectorsStandard.saveButton"
                      >
                        {t('connectors.saveChanges')}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* API Endpoint */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      API Endpoint URL
                    </h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={baseEndpointUrl}
                          readOnly
                          className="font-mono text-sm"
                          data-testid="connectorsStandard.endpointInput"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                              button_name: 'copy_endpoint_url',
                              button_location: 'connector_setup_tab',
                              page_name: 'Connector Details'
                            });
                            handleCopyEndpoint();
                          }}
                          className="min-w-[100px]"
                          data-testid="connectorsStandard.copyEndpointButton"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {endpointCopied ? t('connectors.copied') : t('connectors.copy')}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {t('connectors.apiToken')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={currentConnector?.token || 'No token available'}
                          readOnly
                          className="font-mono text-sm"
                          data-testid="connectorsStandard.tokenInput"
                        />
                        {/* <Button
                          variant="outline"
                          onClick={() => {
                            trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                              button_name: 'copy_api_token',
                              button_location: 'connector_setup_tab',
                              page_name: 'Connector Details'
                            });
                            handleCopyToken(currentConnector?.token || '');
                          }}
                          className="min-w-[100px]"
                          disabled={!currentConnector?.token}
                          data-testid="connectorsStandard.copyTokenButton"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {tokenCopied ? t('connectors.copied') : t('connectors.copy')}
                        </Button> */}
                        <Button
                          variant="outline"
                          onClick={() => {
                            trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                              button_name: 'regenerate_api_token_warning',
                              button_location: 'connector_setup_tab',
                              page_name: 'Connector Details'
                            });
                            setShowRegenerateWarning(true);
                          }}
                          disabled={!currentConnector || isRegenerating}
                          data-testid="connectorsStandard.regenerateTokenButton"
                        >
                          {isRegenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t('connectors.creating')}
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {t('connectors.regenerateToken')}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Include this token in the Authorization header: Bearer {`{token}`}
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Requirements
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Supported format:</strong> .docx only</div>
                      <div>• <strong>Maximum file size:</strong> 2 MB</div>
                      <div>• <strong>Content-Type:</strong> multipart/form-data or JSON with base64</div>
                      <div>• <strong>File field name:</strong> "document" (for multipart) or "documentFileBase64" (for JSON)</div>
                    </div>
                  </div>

                  <Separator />

                  {/* API Endpoint Reference */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      API Endpoint Reference
                    </h3>
                    <p className="text-sm text-muted-foreground">POST /api/connector/upload-document</p>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Required Parameters</h4>
                      <div className="rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="border-b bg-muted/50">
                            <tr>
                              <th className="p-3 text-left font-medium">Parameter</th>
                              <th className="p-3 text-left font-medium">Type</th>
                              <th className="p-3 text-left font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="p-3 font-mono text-xs">connector</td>
                              <td className="p-3">string</td>
                              <td className="p-3">Connector type (must match token: "standard" or "opentext")</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono text-xs">documentName</td>
                              <td className="p-3">string</td>
                              <td className="p-3">Name of the document</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono text-xs">externalReference</td>
                              <td className="p-3">string</td>
                              <td className="p-3">Document number or reference</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono text-xs">documentCategory</td>
                              <td className="p-3">string</td>
                              <td className="p-3">Category (e.g., "Batch Record")</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono text-xs">document</td>
                              <td className="p-3">file</td>
                              <td className="p-3">.docx file (max 2MB) - for multipart upload</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono text-xs">documentFileBase64</td>
                              <td className="p-3">string</td>
                              <td className="p-3">Base64-encoded .docx file - alternative to multipart</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono text-xs">filename</td>
                              <td className="p-3">string</td>
                              <td className="p-3">Optional: filename when using base64 upload</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        <strong>Success (201 Created):</strong> Returns <code className="text-xs bg-green-100 px-1 py-0.5 rounded">documentId</code>, <code className="text-xs bg-green-100 px-1 py-0.5 rounded">status</code>, and confirmation message
                      </AlertDescription>
                    </Alert>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Integration Guide Tab */}
            <TabsContent value="integration">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Guide</CardTitle>
                  <CardDescription>
                    Step-by-step instructions to connect your system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Handling Instructions */}
                  <Alert className="border-green-200 bg-green-50">
                    <AlertTitle className="text-green-900">Important: Sending .docx Files</AlertTitle>
                    <AlertDescription className="text-green-800 space-y-3 mt-3">
                      <div className="font-semibold">The Docufen API supports two upload methods:</div>

                      <div className="space-y-4 mt-4">
                        <div className="p-3 bg-green-100 rounded">
                          <strong>Method 1: Multipart Upload (Recommended)</strong>
                          <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Sends the .docx file as raw binary (no encoding overhead)</li>
                            <li>Better performance and smaller payload size</li>
                            <li>File arrives exactly as sent, preserving all formatting</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-green-100 rounded">
                          <strong>Method 2: Base64 JSON Upload</strong>
                          <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Encode the .docx file as base64 string</li>
                            <li>Send in JSON body with metadata</li>
                            <li>Useful for systems that don't support multipart uploads</li>
                          </ul>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-green-900 text-green-50 rounded">
                        <strong>Requirements:</strong> .docx format only, maximum 2 MB file size
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Separator />

                  {/* Example for different systems */}
                  <Tabs defaultValue="vbscript" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="vbscript">VBScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                    </TabsList>

                    <TabsContent value="vbscript" className="space-y-4">
                      <Alert>
                        <Code className="h-4 w-4" />
                        <AlertTitle>VBScript Example - Multipart Upload</AlertTitle>
                        <AlertDescription>
                          Send .docx files as raw binary using multipart/form-data (recommended)
                        </AlertDescription>
                      </Alert>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto max-w-full">
                        <pre className="text-xs whitespace-pre-wrap break-words">{`' Function to send .docx file using multipart/form-data
Public Function SendToDocufen(docPath, connector, documentName, externalReference, documentCategory)
    Dim fso, fs, http
    Dim bin, bodyStream
    Dim boundary, CRLF
    Dim actualFileName
    Dim url

    SendToDocufen = False
    url = "https://localhost:3000/api/connector/upload-document"
    CRLF = vbCrLf

    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(docPath) Then MsgBox "File not found: " & docPath, vbCritical: Exit Function
    actualFileName = fso.GetFileName(docPath)

    Randomize
    boundary = "--------------------------" & Year(Now) & Right("0" & Month(Now), 2) & Right("0" & Day(Now), 2) & Right("0" & Hour(Now), 2) & Right("0" & Minute(Now), 2) & Right("0" & Second(Now), 2) & CStr(Int(Rnd() * 100000))

    ' build the multipart body into a binary stream
    Set bin = CreateObject("ADODB.Stream")
    bin.Type = 1
    bin.Open

    AppendAsciiText "--" & boundary & CRLF & _
        "Content-Disposition: form-data; name=""connector""" & CRLF & CRLF & connector & CRLF, bin

    AppendAsciiText "--" & boundary & CRLF & _
        "Content-Disposition: form-data; name=""documentName""" & CRLF & CRLF & documentName & CRLF, bin

    AppendAsciiText "--" & boundary & CRLF & _
        "Content-Disposition: form-data; name=""externalReference""" & CRLF & CRLF & externalReference & CRLF, bin

    AppendAsciiText "--" & boundary & CRLF & _
        "Content-Disposition: form-data; name=""documentCategory""" & CRLF & CRLF & documentCategory & CRLF, bin

    AppendAsciiText "--" & boundary & CRLF & _
        "Content-Disposition: form-data; name=""document""; filename=""" & actualFileName & """" & CRLF & _
        "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document" & CRLF & CRLF, bin

    ' append file bytes directly from file stream
    Set fs = CreateObject("ADODB.Stream")
    fs.Type = 1
    fs.Open
    fs.LoadFromFile docPath
    fs.CopyTo bin
    fs.Close

    AppendAsciiText CRLF & "--" & boundary & "--" & CRLF, bin

    ' prepare stream for send
    bin.Position = 0

    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 5000, 5000, 30000, 30000
    http.Open "POST", url, False
    http.setRequestHeader "Authorization", "Bearer doc_DkraPS-aUfZr88LZEslmW2QLVoLsVkJC1dLcggOWkkE"
    http.setRequestHeader "Content-Type", "multipart/form-data; boundary=" & boundary
    http.setOption 2, 13056  ' ignore SSL errors (curl -k)

    ' now send the stream instead of byte array
    http.Send bin

    SendToDocufen = (http.Status = 200 Or http.Status = 201)
    If SendToDocufen Then
        MsgBox "Upload successful!" & vbCrLf & http.ResponseText, vbInformation
    Else
        MsgBox "Upload failed (HTTP " & http.Status & "):" & vbCrLf & http.ResponseText, vbCritical
    End If

    bin.Close
End Function

' Example usage:
SendToDocufen("C:\\docs\\BatchRecord.docx", "Batch Record 250mg", "BR-2024-001", "Batch Record")`}</pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="python" className="space-y-4">
                      <Alert>
                        <Code className="h-4 w-4" />
                        <AlertTitle>Python Example - Both Methods</AlertTitle>
                        <AlertDescription>
                          Examples for both multipart and base64 JSON upload
                        </AlertDescription>
                      </Alert>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto max-w-full">
                        <pre className="text-xs whitespace-pre-wrap break-words">{`import requests
import os
import base64

# Method 1: Multipart Upload (Recommended)
def upload_multipart(file_path, doc_name, doc_ref, doc_category):
    """Send .docx file using multipart/form-data"""

    # Check file size (must be under 2 MB)
    file_size = os.path.getsize(file_path)
    if file_size > 2 * 1024 * 1024:
        print(f"Error: File size ({file_size} bytes) exceeds 2 MB limit")
        return False

    with open(file_path, 'rb') as f:
        files = {
            'document': (os.path.basename(file_path), f,
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        }

        data = {
            'connector': 'standard',
            'documentName': doc_name,
            'externalReference': doc_ref,
            'documentCategory': doc_category
        }

        headers = {
            'Authorization': f'Bearer ${connector?.token || 'YOUR_TOKEN'}'
        }

        response = requests.post(
            '${baseEndpointUrl}',
            files=files,
            data=data,
            headers=headers
        )

    if response.status_code == 201:
        print(f"Success: {response.json()}")
        return True
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return False


# Method 2: Base64 JSON Upload
def upload_base64(file_path, doc_name, doc_ref, doc_category):
    """Send .docx file as base64 in JSON body"""

    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size > 2 * 1024 * 1024:
        print(f"Error: File exceeds 2 MB limit")
        return False

    with open(file_path, 'rb') as f:
        file_content = base64.b64encode(f.read()).decode('utf-8')

    response = requests.post(
        '${baseEndpointUrl}',
        json={
            'connector': 'standard',
            'documentName': doc_name,
            'externalReference': doc_ref,
            'documentCategory': doc_category,
            'documentFileBase64': file_content,
            'filename': os.path.basename(file_path)
        },
        headers={
            'Authorization': f'Bearer ${connector?.token || 'YOUR_TOKEN'}',
            'Content-Type': 'application/json'
        }
    )

    if response.status_code == 201:
        print(f"Success: {response.json()}")
        return True
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return False


# Example usage:
upload_multipart(
    'C:/docs/BatchRecord.docx',
    'Batch Record 250mg',
    'BR-2024-001',
    'Batch Record'
)`}</pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="curl" className="space-y-4">
                      <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>cURL Examples - Both Methods</AlertTitle>
                        <AlertDescription>
                          Test from command line using multipart or base64
                        </AlertDescription>
                      </Alert>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto max-w-full">
                        <pre className="text-xs whitespace-pre-wrap break-words">{`# Method 1: Multipart Upload (Recommended)
curl -X POST ${baseEndpointUrl} \\
  -H "Authorization: Bearer ${connector?.token || 'YOUR_TOKEN'}" \\
  -F "connector=standard" \\
  -F "documentName=Batch Record 250mg" \\
  -F "externalReference=BR-2024-001" \\
  -F "documentCategory=Batch Record" \\
  -F "document=@/path/to/BatchRecord.docx"

# Method 2: Base64 JSON Upload
# First encode the file to base64
BASE64_DATA=$(base64 -w 0 /path/to/BatchRecord.docx)

# Then send as JSON
curl -X POST ${baseEndpointUrl} \\
  -H "Authorization: Bearer ${connector?.token || 'YOUR_TOKEN'}" \\
  -H "Content-Type: application/json" \\
  -d "{
    \"connector\": \"standard\",
    \"documentName\": \"Batch Record 250mg\",
    \"externalReference\": \"BR-2024-001\",
    \"documentCategory\": \"Batch Record\",
    \"documentFileBase64\": \"$BASE64_DATA\",
    \"filename\": \"BatchRecord.docx\"
  }"

# Windows PowerShell (Base64):
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\docs\\BatchRecord.docx"))
curl -X POST ${baseEndpointUrl} \`
  -H "Authorization: Bearer ${connector?.token || 'YOUR_TOKEN'}" \`
  -H "Content-Type: application/json" \`
  -d '{"connector":"standard","documentName":"Batch Record 250mg","externalReference":"BR-2024-001","documentCategory":"Batch Record","documentFileBase64":"$base64","filename":"BatchRecord.docx"}'
`}</pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="nodejs" className="space-y-4">
                      <Alert>
                        <Code className="h-4 w-4" />
                        <AlertTitle>Node.js Example - Both Methods</AlertTitle>
                        <AlertDescription>
                          JavaScript/TypeScript implementation for multipart and base64
                        </AlertDescription>
                      </Alert>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto max-w-full">
                        <pre className="text-xs whitespace-pre-wrap break-words">{`const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Method 1: Multipart Upload (Recommended)
async function uploadMultipart(filePath, docName, docRef, docCategory) {
  const form = new FormData();
  form.append('connector', 'standard');
  form.append('documentName', docName);
  form.append('externalReference', docRef);
  form.append('documentCategory', docCategory);
  form.append('document', fs.createReadStream(filePath));

  try {
    const response = await axios.post(
      '${baseEndpointUrl}',
      form,
      {
        headers: {
          'Authorization': 'Bearer ${connector?.token || 'YOUR_TOKEN'}',
          ...form.getHeaders()
        }
      }
    );

    console.log('Success:', response.data);
    return response.status === 201;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Method 2: Base64 JSON Upload
async function uploadBase64(filePath, docName, docRef, docCategory) {
  const fileContent = fs.readFileSync(filePath);
  const base64Data = fileContent.toString('base64');

  try {
    const response = await axios.post(
      '${baseEndpointUrl}',
      {
        connector: 'standard',
        documentName: docName,
        externalReference: docRef,
        documentCategory: docCategory,
        documentFileBase64: base64Data,
        filename: filePath.split('/').pop()
      },
      {
        headers: {
          'Authorization': 'Bearer ${connector?.token || 'YOUR_TOKEN'}',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Success:', response.data);
    return response.status === 201;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Example usage:
uploadMultipart(
  './BatchRecord.docx',
  'Batch Record 250mg',
  'BR-2024-001',
  'Batch Record'
);`}</pre>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  {/* Response Handling */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Response Handling</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Success (201 Created)</p>
                          <pre className="text-sm text-muted-foreground mt-1">{`{
  "status": "uploaded",
  "documentId": "abc123-def456-ghi789",
  "documentName": "Batch Record 250mg",
  "message": "Document received successfully...",
  "uploadedBy": "user@example.com",
  "uploadedAt": 1234567890
}`}</pre>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Error (400 Bad Request)</p>
                          <pre className="text-sm text-muted-foreground mt-1">{`{
  "message": "documentName and connector are required"
}`}</pre>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Authentication Error (401)</p>
                          <pre className="text-sm text-muted-foreground mt-1">{`{
  "message": "Invalid or missing API token"
}`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>{t('connectors.auditLogTitle')}</CardTitle>
                  <CardDescription>
                    {t('connectors.auditLogDescription', { connector: connector.name })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filter Controls */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder={t('connectors.searchDocuments')}
                        value={auditSearchTerm}
                        onChange={(e) => {
                          setAuditSearchTerm(e.target.value);
                          setAuditCurrentPage(1); // Reset to first page on search
                        }}
                        data-testid="connectorsStandard.auditLogSearchInput"
                      />
                    </div>
                    <div className="w-[180px]">
                      <Select value={auditActionFilter} onValueChange={(value) => {
                        setAuditActionFilter(value);
                        setAuditCurrentPage(1); // Reset to first page on filter change
                      }}>
                        <SelectTrigger data-testid="connectorsStandard.auditLogFilterSelect">
                          <SelectValue placeholder={t('connectors.filterByAction')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('connectors.showAll')}</SelectItem>
                          <SelectItem value="upload">{t('connectors.uploaded')}</SelectItem>
                          <SelectItem value="claim">{t('connectors.claimed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Audit Log Table */}
                  {isLoadingAuditLogs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">{t('connectors.loadingAuditLogs')}</span>
                    </div>
                  ) : (
                    <AuditLogTable
                      documents={auditLogs}
                      currentPage={auditCurrentPage}
                      totalPages={auditTotalPages}
                      rowsPerPage={auditRowsPerPage}
                      setCurrentPage={setAuditCurrentPage}
                      setRowsPerPage={(value) => {
                        setAuditRowsPerPage(value);
                        setAuditCurrentPage(1); // Reset to first page on page size change
                      }}
                      emptyMessage={t('connectors.noAuditLogsYet')}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* Regenerate Confirmation Warning Dialog */}
      <Dialog open={showRegenerateWarning} onOpenChange={(open) => {
        if (!open) {
          trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CANCELLED, {
            dialog_type: 'regenerate_token_warning',
            action_cancelled: 'regenerate_connector_token',
            page_name: 'Connector Details'
          });
          setShowRegenerateWarning(false);
        }
      }}>
        <DialogContent className="max-w-md" data-testid="connectorsStandard.regenerateWarningDialog">
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
                    dialog_type: 'regenerate_token_warning',
                    action_cancelled: 'regenerate_connector_token',
                    page_name: 'Connector Details'
                  });
                  setShowRegenerateWarning(false);
                }}
                data-testid="connectorsStandard.regenerateWarningDialog.cancelButton"
              >
                {t('connectors.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.DIALOG_CONFIRMED, {
                    dialog_type: 'regenerate_token_warning',
                    action_confirmed: 'regenerate_connector_token',
                    page_name: 'Connector Details'
                  });
                  handleRegenerateToken();
                }}
                disabled={isRegenerating}
                data-testid="connectorsStandard.regenerateWarningDialog.confirmButton"
              >
                {isRegenerating ? t('connectors.creating') : t('connectors.regenerateToken')}
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
        <DialogContent className="max-w-lg" data-testid="connectorsStandard.tokenRegeneratedDialog">
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
                  data-testid="connectorsStandard.tokenRegeneratedDialog.tokenInput"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                      button_name: 'copy_regenerated_token',
                      button_location: 'token_regenerated_dialog',
                      page_name: 'Connector Details'
                    });
                    handleCopyRegeneratedToken();
                  }}
                  className="min-w-[100px]"
                  data-testid="connectorsStandard.tokenRegeneratedDialog.copyButton"
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
                data-testid="connectorsStandard.tokenRegeneratedDialog.doneButton"
              >
                {t('connectors.done')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ConnectorsStandard;
