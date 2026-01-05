import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { VerificationTypes, verifyUserSignature, INVITED, SignatureImageVerificationResponse, IDigitalSignatureVerification } from '../../lib/apiUtils';
import { DocufenUser } from '../../lib/apiUtils';
import { Loader2, Info, FileType, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { format } from 'date-fns';
import { useUsersStore, useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';

interface DigitalSignatureVerificationProps {
  user: DocufenUser;
  setSelectedUser: (user: DocufenUser) => void;
  onVerificationComplete: (verificationType: string) => void;
}



export const DigitalSignatureVerification: React.FC<DigitalSignatureVerificationProps> = ({
  user,
  setSelectedUser,
  onVerificationComplete,
}) => {
  const [verificationType, setVerificationType] = useState<IDigitalSignatureVerification>('Verified Image');
  const [notationText, setNotationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { managerName, managerInitials, logout } = useUserStore(useShallow(state => ({
    managerName: state.legalName,
    managerInitials: state.initials,
    logout: state.logout,
  })))
  const { updateUser } = useUsersStore((useShallow(state => ({ 
    updateUser: state.updateUser
  }))))

  // Check if user already has verification details
  useEffect(() => {
    console.log('DigitalSignatureVerification: User data updated:', {
      oid: user.oid,
      digitalSignatureVerification: user.digitalSignatureVerification,
      digitalSignatureUrl: user.digitalSignatureUrl,
      digitalSignatureNotation: user.digitalSignatureNotation,
      digitalSignatureVerifiedBy: user.digitalSignatureVerifiedBy,
      digitalSignatureVerifiedAt: user.digitalSignatureVerifiedAt
    });
    
    if (user.digitalSignatureVerification && 
        user.digitalSignatureVerification !== VerificationTypes.NOT_VERIFIED) {
      setShowVerificationDetails(true);
      // Reset any form state when showing verification details
      setSelectedFile(null);
      setFilePreview(null);
      setNotationText('');
      setErrorMessage('');
      setSuccessMessage('');
    } else {
      setShowVerificationDetails(false);
    }
  }, [user]);

  useEffect(() => {
    // Clean up object URLs when component unmounts
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage('');
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(t('digitalSignature.invalidFileType'));
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrorMessage(t('digitalSignature.fileTooLarge'));
      return;
    }

    // Clean up previous preview if exists
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    // Create a preview URL for the file
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
    setSelectedFile(file);
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Clean up preview URL
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Check if user is in invited status
    if (user.invitationStatus === INVITED) {
      setErrorMessage(t('digitalSignature.invitedUserCannotVerify'));
      setIsLoading(false);
      return;
    }
    
    try {
      let status: number;
      
      switch (verificationType) {
        case VerificationTypes.VERIFIED_IMAGE:
          if (!selectedFile) {
            setErrorMessage(t('digitalSignature.noFileSelected'));
            setIsLoading(false);
            return;
          }
          const tmpUser2: Partial<DocufenUser> & { oid: string } = { 
            oid: user.oid, digitalSignatureVerification: VerificationTypes.VERIFIED_IMAGE , digitalSignatureUrl: filePreview || '',
            digitalSignatureVerifiedBy: `${managerName} (${managerInitials})`,
            digitalSignatureVerifiedAt: Date.now()};
          const imageVerifyResponse = await verifyUserSignature(user.oid, VerificationTypes.VERIFIED_IMAGE, undefined, selectedFile) as SignatureImageVerificationResponse
          console.log('Image verification response:', JSON.stringify(imageVerifyResponse));
          status = imageVerifyResponse.code;
          if (imageVerifyResponse.code === 200) {
            console.log('Image verification successful:', imageVerifyResponse);
            tmpUser2.digitalSignatureUrl = imageVerifyResponse.url;
            updateUser(tmpUser2)
            setSelectedUser({...user, ...tmpUser2})
          } else if (imageVerifyResponse.code >= 400) {
            logout()
          }
          break;
          
        case VerificationTypes.VERIFIED_REGISTER_NOTATION:
          if (!notationText.trim()) {
            setErrorMessage(t('digitalSignature.notationRequired'));
            setIsLoading(false);
            return;
          }
          const tmpUser1: Partial<DocufenUser> & { oid: string } = { oid: user.oid, digitalSignatureVerification: VerificationTypes.VERIFIED_REGISTER_NOTATION, digitalSignatureNotation: notationText,
            digitalSignatureVerifiedBy: `${managerName} (${managerInitials})`,
            digitalSignatureVerifiedAt: Date.now()
           } as Partial<DocufenUser> & { oid: string };
          status = await verifyUserSignature(user.oid, VerificationTypes.VERIFIED_REGISTER_NOTATION, notationText) as number
          if (status === 200) {
            setSelectedUser({...user, ...tmpUser1})
            updateUser(tmpUser1)
          }
          break;
          
        case VerificationTypes.VERIFIED_MS_USER_ID:
          const tmpUser: Partial<DocufenUser> & { oid: string } = { oid: user.oid, digitalSignatureVerification: VerificationTypes.VERIFIED_MS_USER_ID,
            digitalSignatureVerifiedBy: `${managerName} (${managerInitials})`,
            digitalSignatureVerifiedAt: Date.now()
          };
          status = await verifyUserSignature(user.oid, VerificationTypes.VERIFIED_MS_USER_ID) as number
          if (status === 200){
            setSelectedUser({...user, ...tmpUser})
            updateUser(tmpUser);
          }
          break;
          
        default:
          setErrorMessage(t('digitalSignature.selectMethod'));
          console.log()
          setIsLoading(false);
          return;
      }
      
      if (status === 200) {
        setSuccessMessage(t('digitalSignature.success'));
        
        // Add a small delay to ensure backend processing is complete
        setTimeout(() => {
          onVerificationComplete(verificationType);
          setShowVerificationDetails(true);
        }, 1000);
      } else {
        setErrorMessage(t('digitalSignature.failed', { status }));
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setErrorMessage(t('digitalSignature.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeVerification = () => {
    onVerificationComplete('revoked');
    setShowVerificationDetails(false);
  };

  const formatVerificationDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const dateStr = format(date, 'd-MMM-yyyy');
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    return `${dateStr} ${timeStr}`;
  };

  const renderVerificationDetails = () => {
    if (!showVerificationDetails || !user.digitalSignatureVerification) return null;

    const verificationStatus = user.digitalSignatureVerification;
    const verifiedBy = user.digitalSignatureVerifiedBy || '';
    const verifiedAt = user.digitalSignatureVerifiedAt ? formatVerificationDate(user.digitalSignatureVerifiedAt) : '';

    let statusDisplay = t(verificationStatus)

    console.log('Rendering verification details:', {
      verificationStatus,
      verifiedBy,
      verifiedAt,
      digitalSignatureUrl: user.digitalSignatureUrl,
      digitalSignatureNotation: user.digitalSignatureNotation
    });

    return (
      <div className="mt-6 border rounded-md p-4">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <Check className="h-5 w-5" />
          <span className="font-medium">{t('verification-status')} {statusDisplay}</span>
        </div>

        {verificationStatus == VerificationTypes.VERIFIED_MS_USER_ID && (
          <div className="mb-4">
            <div className="border rounded-md p-3">
              <p className="text-sm font-medium mb-1">{t('users.microsoftUserId')}</p>
              <div className="flex items-center border-b py-2">
                <img src="/microsoft-logo.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
                <p className="text-sm truncate">{user.oid}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t('verified-by')} {verifiedBy}</p>
              <p className="text-xs text-muted-foreground">{t('verified-on')} {verifiedAt}</p>
            </div>
          </div>
        )}

        {verificationStatus == VerificationTypes.VERIFIED_IMAGE && (
          <div className="mb-4">
            <div className="border rounded-md p-3">
              <p className="text-sm font-medium mb-2">{t('signature-image')}</p>
              {user.digitalSignatureUrl ? (
                <div className="max-w-[200px] h-auto border p-2 rounded-md mb-2">
                  <img 
                    src={user.digitalSignatureUrl} 
                    alt={t('digital-signature')} 
                    className="max-w-full h-auto"
                    onError={(e) => {
                      console.error('Error loading signature image:', user.digitalSignatureUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Signature image loaded successfully:', user.digitalSignatureUrl);
                    }}
                  />
                </div>
              ) : (
                <div className="max-w-[200px] h-auto border p-2 rounded-md mb-2 bg-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-500">{t('digitalSignature.notAvailable')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">{t('verified-by')} {verifiedBy}</p>
              <p className="text-xs text-muted-foreground">{t('verified-on')} {verifiedAt}</p>
            </div>
          </div>
        )}

        {verificationStatus == VerificationTypes.VERIFIED_REGISTER_NOTATION && (
          <div className="mb-4">
            <div className="border rounded-md p-3">
              <p className="text-sm font-medium mb-2">{t('register-notation')}</p>
              {user.digitalSignatureNotation ? (
                <p className="text-sm border p-2 rounded-md bg-gray-50 mb-2">
                  {user.digitalSignatureNotation}
                </p>
              ) : (
                <p className="text-sm border p-2 rounded-md bg-gray-100 mb-2 text-gray-500">
                  {t('digitalSignature.notAvailable')}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">{t('verified-by')} {verifiedBy}</p>
              <p className="text-xs text-muted-foreground">{t('verified-on')} {verifiedAt}</p>
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
          onClick={handleRevokeVerification}
          data-testid="digitalSignatureVerification.revokeButton"
        >
          {t("revokeVerification")}
        </Button>
      </div>
    );
  };

  if (showVerificationDetails) {
    return (
      <div className="w-full flex flex-col h-full justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('users.tableHeaders.digitalSignatureVerification')}</h2>
          {renderVerificationDetails()}
        </div>
        <div className="mt-auto pt-6 flex justify-end">
          <Button variant="outline" onClick={() => setShowVerificationDetails(false)} data-testid="digitalSignatureVerification.closeButton">
            {t('buttonTitle.close')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('digitalSignature.verificationDesc')}
        </p>
        
        {errorMessage && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4 text-sm">
            {successMessage}
          </div>
        )}
        
        <div className="space-y-6">
          <RadioGroup
            value={verificationType}
            onValueChange={(value) => setVerificationType(value as IDigitalSignatureVerification)}
            className="space-y-4"
            data-testid="digitalSignatureVerification.verificationTypeRadioGroup"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="Verified Image" id="Verified Image" data-testid="digitalSignatureVerification.imageRadioButton" />
              <div className="grid gap-1.5">
                <Label htmlFor="Verified Image" className="font-medium flex items-center gap-2">
                  {t('digitalSignature.imageUpload')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 info-icon cursor-help" data-testid="digitalSignatureVerification.imageTooltipTrigger" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px] text-xs">
                        {t('digitalSignature.imageUploadDesc')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                
                {verificationType === 'Verified Image' && (
                  <div className="mt-2">
                    <div
                      className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer mt-2 w-full ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-input'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        data-testid="digitalSignatureVerification.fileInput"
                      />
                      {selectedFile ? (
                        <div className="flex flex-col items-center w-full">
                          {selectedFile.type.startsWith('image/') ? (
                            <div className="w-32 h-32 mb-3 border rounded-md overflow-hidden">
                              <img 
                                src={filePreview || ''} 
                                alt={selectedFile.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 mb-3 bg-gray-100 flex items-center justify-center rounded-md border">
                              <FileType size={48} className="text-gray-400" />
                            </div>
                          )}
                          <p className="text-xs font-medium truncate max-w-full">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(e);
                            }}
                            data-testid="digitalSignatureVerification.removeFileButton"
                          >
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="mr-1"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            {t('actions.remove')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="bg-green-50 p-3 rounded-full mb-3">
                            <svg 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="#16a34a" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                            </svg>
                          </div>
                          <div className="flex items-center gap-1 mb-3">
                            <p className="text-xs text-muted-foreground">
                              {t('digitalSignature.dragDropImage')}
                            </p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 info-icon cursor-help" data-testid="digitalSignatureVerification.dragDropTooltipTrigger" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[250px] text-xs">
                                  {t('digitalSignature.acceptedFormats')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            data-testid="digitalSignatureVerification.selectFileButton"
                          >
                            {t('users.selectFile')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="Verified Register Notation" id="Verified Register Notation" data-testid="digitalSignatureVerification.notationRadioButton" />
              <div className="grid gap-1.5">
                <Label htmlFor="Verified Register Notation" className="font-medium flex items-center gap-2">
                  {t('digitalSignature.registerNotation')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 info-icon cursor-help" data-testid="digitalSignatureVerification.notationTooltipTrigger" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px] text-xs">
                        {t('digitalSignature.registerNotationDesc')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                
                {verificationType === "Verified Register Notation" && (
                  <div className="mt-2">
                    <Textarea
                      value={notationText}
                      onChange={(e) => setNotationText(e.target.value)}
                      placeholder={t('digitalSignature.notationPlaceholder')}
                      className="min-h-[80px]"
                      data-testid="digitalSignatureVerification.notationTextarea"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="Verified MS User ID" id="Verified MS User ID" data-testid="digitalSignatureVerification.microsoftRadioButton" />
              <div className="grid gap-1.5">
                <Label htmlFor="Verified MS User ID" className="font-medium flex items-center gap-2">
                  {t('digitalSignature.microsoftVerification')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 info-icon cursor-help" data-testid="digitalSignatureVerification.microsoftTooltipTrigger" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px] text-xs">
                        {t('digitalSignature.microsoftVerificationDesc')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                
                {verificationType === 'Verified MS User ID' && (
                  <div className="mt-2 flex items-center space-x-2 border p-3 rounded-md bg-muted/50">
                    <img src="/microsoft-logo.svg" alt="Microsoft" className="w-6 h-6" />
                    <div>
                      <p className="font-medium">{t('microsoft-user-id')} {user.oid}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('digitalSignature.microsoftVerificationConfirm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="mt-auto pt-6 flex justify-end">
        <Button 
          onClick={handleVerify} 
          disabled={isLoading}
          data-testid="digitalSignatureVerification.verifyButton"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('digitalSignature.processing')}
            </>
          ) : (
            t('digitalSignature.approveButton')
          )}
        </Button>
      </div>
    </div>
  );
};

export default DigitalSignatureVerification; 