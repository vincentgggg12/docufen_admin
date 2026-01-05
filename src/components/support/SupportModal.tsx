import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Ticket, Upload, X, FileText, Image as ImageIcon, MessageCircle, Send, ChevronLeft, Clock, User } from 'lucide-react';
import { useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { createSupportTicket, getUserTickets, addTicketComment, SupportTicket } from '@/lib/supportTickets';
import { formatDate, formatTime, isToday } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { DateTime } from 'luxon';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t } = useTranslation();
  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      legalName: state.legalName,
    }))
  );

  const [activeTab, setActiveTab] = useState<'create' | 'tickets'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; ticketKey?: string } | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Form state
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Detail view state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  // const [isLoadingTicketDetail, setIsLoadingTicketDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyFileError, setReplyFileError] = useState<string | null>(null);

  // Load tickets when tab changes to 'tickets'
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSummary('');
      setDescription('');
      setFiles([]);
      setFileErrors([]);
      setError(null);
      setSuccess(null);
      setActiveTab('create');
      setSelectedTicket(null);
      setReplyMessage('');
      setReplyFile(null);
      setReplyFileError(null);
    }
  }, [isOpen]);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    setError(null);
    
    try {
      const response = await getUserTickets();
      if (response.success && response.tickets) {
        console.log("Loaded tickets: ", JSON.stringify(response.tickets));
        setTickets(response.tickets);
        return response.tickets; // Return tickets for immediate use
      } else {
        setError(response.error || t('support.errors.loadTicketsFailed'));
        return null;
      }
    } catch (err) {
      setError(t('support.errors.loadTicketsFailed'));
      return null;
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const newErrors: string[] = [];

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      newErrors.push(t('support.errors.fileTooLarge'));
      setFileErrors(newErrors);
      return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      newErrors.push(t('support.errors.invalidFileType'));
      setFileErrors(newErrors);
      return false;
    }

    // Replace any existing file with the new one
    setFiles([file]);
    setFileErrors([]);
    return true;
  };

  const validateReplyFile = (file: File) => {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setReplyFileError(t('support.errors.fileTooLarge'));
      return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setReplyFileError(t('support.errors.invalidFileType'));
      return false;
    }

    setReplyFile(file);
    setReplyFileError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    validateAndSetFile(selectedFile);
    
    // Clear the input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0 && droppedFiles[0]) {
      validateAndSetFile(droppedFiles[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setFileErrors([]);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' ' + t('support.fileSize.bytes');
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ' + t('support.fileSize.kilobytes');
    return (bytes / (1024 * 1024)).toFixed(1) + ' ' + t('support.fileSize.megabytes');
  };

  const loadTicketDetail = async (ticketKey: string, ticketsArray?: SupportTicket[]) => {
    // setIsLoadingTicketDetail(true);
    setError(null);
    // Use provided tickets array or current state
    const ticketsList = ticketsArray || tickets;
    const selectedTicket = ticketsList.find(ticket => ticket.ticketKey === ticketKey);
    setSelectedTicket(selectedTicket || null);
    // try {
    //   const response = await getTicketByKey(ticketKey);
    //   if (response.success && response.ticket) {
    //     setSelectedTicket(response.ticket);
    //   } else {
    //     setError(response.error || t('support.errors.loadTicketDetailFailed'));
    //   }
    // } catch (err) {
    //   setError(t('support.errors.loadTicketDetailFailed'));
    // } finally {
    //   setIsLoadingTicketDetail(false);
    // }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket || !replyMessage.trim()) return;
    
    setIsSubmittingReply(true);
    setError(null);
    
    try {
      // If there's a file, add reference to it in the comment
      let finalMessage = replyMessage;
      if (replyFile) {
        finalMessage += `\n\n[Attached: ${replyFile.name}]`;
      }
      
      const response = await addTicketComment(selectedTicket.ticketKey, finalMessage, replyFile || undefined);
      if (response.success) {
        setReplyMessage('');
        setReplyFile(null);
        setReplyFileError(null);
        // Reload ticket list first to get fresh data including new comment
        const freshTickets = await loadTickets();
        // Use the fresh tickets data to update the selected ticket immediately
        if (freshTickets) {
          await loadTicketDetail(selectedTicket.ticketKey, freshTickets);
        }
      } else {
        setError(response.error || t('support.errors.replyFailed'));
      }
    } catch (err) {
      setError(t('support.errors.replyFailed'));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleViewDetails = (ticket: SupportTicket) => {
    loadTicketDetail(ticket.ticketKey);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setReplyMessage('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError(t('support.errors.notAuthenticated'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await createSupportTicket({
        summary,
        description,
      }, files);

      if (response.success && response.ticketKey) {
        setSuccess({
          message: t('support.success.ticketCreated'),
          ticketKey: response.ticketKey,
        });
        
        // Clear form
        setSummary('');
        setDescription('');
          setFiles([]);
        setFileErrors([]);
        
        // Switch to tickets tab after a delay
        setTimeout(() => {
          setActiveTab('tickets');
          loadTickets();
        }, 2000);
      } else {
        setError(response.error || t('support.errors.createFailed'));
      }
    } catch (err) {
      setError(t('support.errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('done') || lowerStatus.includes('resolved')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus.includes('progress')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (lowerStatus.includes('waiting')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const setTrimmedSummary = (value: string) => {
    let trimmedValue = value
    if (value.length > 100)
      trimmedValue = value.slice(0, 100);
    setSummary(trimmedValue);
  };

  const setTrimmedDescription = (value: string) => {
    let trimmedValue = value
    if (value.length > 10000)
      trimmedValue = value.slice(0, 10000);
    setDescription(trimmedValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        data-testid="supportModal.dialogContainer">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {t('support.title')}
          </DialogTitle>
          <DialogDescription>
            {t('support.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'tickets')} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" data-testid="supportModal.createTabTrigger">
              {t('support.tabs.create')}
            </TabsTrigger>
            <TabsTrigger value="tickets" data-testid="supportModal.ticketsTabTrigger">
              {t('support.tabs.tickets')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive" data-testid="supportModal.errorAlert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50" data-testid="supportModal.successAlert">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success.message}
                  {success.ticketKey && (
                    <span className="block mt-1 font-medium">
                      {t('support.ticketNumber')}: {success.ticketKey}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary">{t('support.fields.summary')} *</Label>
                <Input
                  id="summary"
                  value={summary}
                  onChange={(e) => setTrimmedSummary(e.target.value)}
                  placeholder={t('support.fields.summaryPlaceholder')}
                  required
                  disabled={isSubmitting}
                  data-testid="supportModal.summaryInput"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('support.fields.description')} *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setTrimmedDescription(e.target.value)}
                  placeholder={t('support.fields.descriptionPlaceholder')}
                  rows={6}
                  required
                  disabled={isSubmitting}
                  data-testid="supportModal.descriptionTextarea"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="attachments">
                  {t('support.fields.attachment')} 
                  <span className="text-sm text-gray-500 ml-1">
                    {t('support.fields.attachmentHint')}
                  </span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="file-upload" 
                      className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        isDragging 
                          ? "border-blue-400 bg-blue-50" 
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      data-testid="supportModal.dragDropArea"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className={cn("w-8 h-8 mb-2", isDragging ? "text-blue-500" : "text-gray-400")} />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">
                            {isDragging 
                              ? t('support.fields.dropToUpload') 
                              : t('support.fields.clickOrDrag')
                            }
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('support.fields.allowedTypes')}
                        </p>
                      </div>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        data-testid="supportModal.fileUploadInput"
                      />
                    </label>
                  </div>
                  
                  {/* File errors */}
                  {fileErrors.length > 0 && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {fileErrors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Selected files */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file)}
                            <span className="text-sm text-gray-700 truncate max-w-xs">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={isSubmitting}
                            data-testid="supportModal.removeFileButton"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                data-testid="supportModal.submitButton"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('support.submitting')}
                  </>
                ) : (
                  t('support.submit')
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="tickets" className="mt-4">
            {selectedTicket ? (
              // Detail View
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="flex items-center gap-1"
                    data-testid="supportModal.backToTicketsButton"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('support.backToTickets')}
                  </Button>
                  <Badge className={cn("text-xs", getStatusColor(selectedTicket.status))}>
                    {selectedTicket.status}
                  </Badge>
                </div>

                {/* {isLoadingTicketDetail ? (
                  <div className="flex items-center justify-center py-8" data-testid="supportModal.ticketDetailLoading">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <> */}
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">{selectedTicket.summary}</h3>
                      <p className="text-sm text-gray-500 mt-1">{selectedTicket.ticketKey}</p>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                      {/* Initial description as first message */}
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-end">
                          <div className="bg-blue-50 rounded-lg p-3 max-w-[80%]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{selectedTicket.userName}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(
                                  typeof selectedTicket.createdAt === 'string' 
                                    ? DateTime.fromISO(selectedTicket.createdAt) 
                                    : DateTime.fromMillis(selectedTicket.createdAt), 
                                  t
                                )}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Comments */}
                      {selectedTicket.comments?.map((comment) => {
                        const commentDateTime = typeof comment.created === 'string' 
                          ? DateTime.fromISO(comment.created) 
                          : DateTime.fromMillis(comment.created);
                        return (
                        <div key={comment.id} className={cn("flex gap-3", comment.isSupport ? "" : "flex-row-reverse")}>
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center",
                              comment.isSupport ? "bg-green-500" : "bg-primary"
                            )}>
                              {comment.isSupport ? (
                                <Ticket className="h-4 w-4 text-white" />
                              ) : (
                                <User className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                          <div className={cn("flex-1", comment.isSupport ? "" : "flex flex-col items-end")}>
                            <div className={cn(
                              "rounded-lg p-3 max-w-[80%]",
                              comment.isSupport ? "bg-green-50" : "bg-blue-50"
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {comment.isSupport ? t('support.supportTeam') : comment.author}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {isToday(commentDateTime) ? 
                                  formatTime(commentDateTime) :
                                  formatDate(commentDateTime, t)}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>

                    {/* Reply form */}
                    <form onSubmit={handleReplySubmit} className="border-t pt-4 space-y-3">
                      <div className="flex gap-2">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder={t('support.replyPlaceholder')}
                          rows={3}
                          disabled={isSubmittingReply}
                          className="flex-1"
                          data-testid="supportModal.replyTextarea"
                        />
                        <Button 
                          type="submit" 
                          disabled={isSubmittingReply || !replyMessage.trim()}
                          className="self-end"
                          data-testid="supportModal.sendReplyButton"
                        >
                          {isSubmittingReply ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {/* File attachment section */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="reply-file-upload"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                validateReplyFile(file);
                              }
                              e.target.value = ''; // Reset input
                            }}
                            disabled={isSubmittingReply}
                          />
                          <label
                            htmlFor="reply-file-upload"
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors",
                              "border border-gray-300 bg-white hover:bg-gray-50",
                              isSubmittingReply && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Upload className="h-4 w-4" />
                            {t('support.attachFile')}
                          </label>
                          {replyFile && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {getFileIcon(replyFile)}
                              <span className="truncate max-w-xs">{replyFile.name}</span>
                              <span className="text-xs text-gray-500">({formatFileSize(replyFile.size)})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyFile(null);
                                  setReplyFileError(null);
                                }}
                                className="text-red-500 hover:text-red-700"
                                disabled={isSubmittingReply}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {replyFileError && (
                          <p className="text-sm text-red-600">{replyFileError}</p>
                        )}
                      </div>
                    </form>
                  {/* </>
                )} */}
              </div>
            ) : (
              // List View
              <>
                {error && (
                  <Alert variant="destructive" className="mb-4" data-testid="supportModal.ticketsErrorAlert">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isLoadingTickets ? (
                  <div className="flex items-center justify-center py-8" data-testid="supportModal.ticketsLoading">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{t('support.noTickets')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <Card 
                        key={ticket.id} 
                        className="hover:shadow-md transition-shadow"
                        data-testid="supportModal.ticketCard"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{ticket.summary}</CardTitle>
                              <CardDescription className="flex items-center gap-4 text-xs mt-1">
                                <span>{ticket.ticketKey}</span>
                                <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                                  {ticket.status}
                                </Badge>
                                {ticket.comments && ticket.comments.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    {ticket.comments.length}
                                  </span>
                                )}
                                {ticket.hasNewReply && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('support.newReply')}
                                  </Badge>
                                )}
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(ticket)}
                              className="flex items-center gap-1"
                              data-testid="supportModal.viewDetailsButton"
                            >
                              {t('support.viewDetails')}
                              <ChevronLeft className="h-3 w-3 rotate-180" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                          <div className="mt-3 flex justify-between text-xs text-gray-500">
                            <span>{t('support.created')}: {formatDate(
                              typeof ticket.createdAt === 'string' 
                                ? DateTime.fromISO(ticket.createdAt) 
                                : DateTime.fromMillis(ticket.createdAt), 
                              t
                            )}</span>
                            <span>{t('support.updated')}: {formatDate(
                              typeof ticket.updatedAt === 'string' 
                                ? DateTime.fromISO(ticket.updatedAt) 
                                : DateTime.fromMillis(ticket.updatedAt), 
                              t
                            )}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}