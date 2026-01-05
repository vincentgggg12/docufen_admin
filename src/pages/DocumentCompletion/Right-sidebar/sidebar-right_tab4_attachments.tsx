import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  // Image as ImageIcon,
  File,
  FileImage,
  FileType,
  X,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  ChevronLeft,
  Stamp,
  Video,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppStore, useDocumentStore, useUserStore } from "@/lib/stateManagement";
import { StoreAttachment } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { verifyAttachment, VerifyAttachmentResult, getAttachments, LoginMessage } from "@/lib/apiUtils";
import { ActionType } from '@/components/editor/lib/AuditLogItem';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { RAWSERVERURL, SERVERURL } from "@/lib/server";
import { getFullUser, Stage } from "@/components/editor/lib/lifecycle";
import { DateTime } from "luxon";
import { formatDatetimeString } from "@/lib/dateUtils";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { encodeUrlFilename } from "@/lib/utils";

// Define attachment type for component internal use
interface Attachment extends StoreAttachment { }


// Helper function to determine file type from URL or name
const getFileType = (url: string, name: string): Attachment["fileType"] => {
  const lowercaseName = name.toLowerCase();
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.startsWith("/document/")) return "document";

  if (lowercaseName.endsWith(".pdf") || lowercaseUrl.endsWith(".pdf")) {
    return "pdf";
  } else if (
    lowercaseName.endsWith(".jpg") ||
    lowercaseName.endsWith(".jpeg") ||
    lowercaseName.endsWith(".png") ||
    lowercaseUrl.endsWith(".jpg") ||
    lowercaseUrl.endsWith(".jpeg") ||
    lowercaseUrl.endsWith(".png")
  ) {
    return "image";
  } else if (
    lowercaseName.endsWith(".mp4") ||
    lowercaseName.endsWith(".mov") ||
    lowercaseName.endsWith(".webm") ||
    lowercaseName.endsWith(".avi") ||
    lowercaseName.endsWith(".mkv") ||
    lowercaseUrl.endsWith(".mp4") ||
    lowercaseUrl.endsWith(".mov") ||
    lowercaseUrl.endsWith(".webm") ||
    lowercaseUrl.endsWith(".avi") ||
    lowercaseUrl.endsWith(".mkv")
  ) {
    return "video";
  } else {
    return "document";
  }
};


// Component for file type icon
const FileTypeIcon = ({ fileType, url }: { fileType: Attachment["fileType"], url: string }) => {
  // Get more specific file type based on URL
  if (url.toLowerCase().endsWith('.docx')) {
    return <FileText className="h-5 w-5 text-gray-500" />;
  } else if (url.toLowerCase().endsWith('.xlsx')) {
    return <FileText className="h-5 w-5 text-gray-500" />;
  } else if (url.toLowerCase().endsWith('.txt')) {
    return <FileText className="h-5 w-5 text-gray-500" />;
  }

  // Default file type icons
  switch (fileType) {
    case "pdf":
      return <FileType className="h-5 w-5 text-gray-500" />;
    case "image":
      return <FileImage className="h-5 w-5 text-gray-500" />;
    case "video":
      return <Video className="h-5 w-5 text-gray-500" />;
    case "document":
      return <FileText className="h-5 w-5 text-gray-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

// Function to check if a URL is an image
const isImageUrl = (url: string): boolean => {
  if (!url) return false;

  const lower = url.toLowerCase();
  // Check for common image extensions or patterns in the URL
  return lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.includes('.jpg?') ||
    lower.includes('.jpeg?') ||
    lower.includes('.png?') ||
    lower.includes('image/') ||
    lower.includes('content-type=image') ||
    lower.includes('/att_') && (lower.includes('jpg') || lower.includes('jpeg') || lower.includes('png'));
};

// Function to check if a URL is a PDF
const isPdfUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return lower.endsWith('.pdf') ||
    lower.includes('.pdf?') ||
    lower.includes('application/pdf') ||
    lower.includes('content-type=pdf');
};

// Function to check if a URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;

  const lower = url.toLowerCase();
  // Check for common video extensions or patterns in the URL
  return lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.mkv') ||
    lower.includes('.mp4?') ||
    lower.includes('.mov?') ||
    lower.includes('.webm?') ||
    lower.includes('.avi?') ||
    lower.includes('.mkv?') ||
    lower.includes('video/') ||
    lower.includes('content-type=video');
};

// Add the AttachmentPreview component above the AttachmentsTab function
const AttachmentPreview: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [previewMode, setPreviewMode] = useState<"loading" | "image" | "pdf" | "video" | "download">("loading");
  const [loadAttempted, setLoadAttempted] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    // Reset state when attachment changes
    setPreviewMode("loading");
    setLoadAttempted(false);
  }, [attachment.id]);


  useEffect(() => {
    if (previewMode === "loading" && !loadAttempted) {
      setLoadAttempted(true);

      // Log the URL we're trying to load (console only)
      // console.log("Trying to preview attachment:", attachment.url, "File type:", attachment.fileType);

      // Add logic to handle both localhost and production URLs
      // Encode the filename portion for browser use (raw URLs stored in database)
      let attachmentUrl = encodeUrlFilename(attachment.url);

      // Detect video content based on fileType, URL, or filename
      const isVideoContent =
        attachment.fileType === 'video' ||
        isVideoUrl(attachmentUrl) ||
        attachment.name.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv)$/);

      if (isVideoContent) {
        // console.log("Detected as video, using iframe approach:", attachmentUrl);
        setPreviewMode("video");
      } else if (isImageUrl(attachmentUrl)) {
        // console.log("Detected as image from URL pattern");
        setPreviewMode("image");
      } else if (isPdfUrl(attachmentUrl)) {
        // console.log("Detected as PDF from URL pattern");
        setPreviewMode("pdf");
      } else {
        // For unknown content types, try image first and fall back to download
        console.log("Unknown content type, trying to load as image");

        const img = new Image();

        // Add CORS handling
        img.crossOrigin = "anonymous";

        img.onload = () => {
          console.log("Successfully loaded as image");
          setPreviewMode("image");
        };
        img.onerror = (e) => {
          console.error("Failed to load as image:", e);

          // Try as PDF next if URL has "pdf" anywhere in it
          if (attachmentUrl.toLowerCase().includes('pdf')) {
            console.log("Trying as PDF based on URL");
            setPreviewMode("pdf");
          } else {
            console.log("Falling back to download link");
            setPreviewMode("download");
          }
        };
        img.src = attachmentUrl;
      }
    }
  }, [attachment.url, attachment.fileType, attachment.name, previewMode, loadAttempted]);


  // Show the loading state
  if (previewMode === "loading") {
    return (
      <>
        <div className="p-6 rounded-md min-h-[400px] flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
          <div className="text-center">
            <File className="h-20 w-20 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-sm text-gray-500">{t('att.loading-attachment-preview')}</p>
          </div>
        </div>
      </>
    );
  }

  if (previewMode === "video") {
    // Ensure video URL uses the correct port in development
    let videoUrl = encodeUrlFilename(attachment.url);

    // // For localhost development, fix potential port mismatch
    // if (window.location.hostname === 'localhost') {
    //   // Fix docufen.com URLs
    //   if (videoUrl.includes('docufen.com')) {
    //     const urlParts = videoUrl.split('/attachments/');
    //     if (urlParts.length > 1) {
    //       const relativePath = urlParts[1];
    //       videoUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/attachments/${relativePath}`;
    //     }
    //   }

    //   // Always force port 3000 for API calls regardless of frontend port
    //   if (videoUrl.includes('localhost:')) {
    //     videoUrl = videoUrl.replace(/localhost:\d+/, 'localhost:3000');
    //     console.log("Fixed video URL port to 3000:", videoUrl);
    //   }
    // }

    return (
      <>
        <div className="p-6 rounded-md min-h-[400px] flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
          <div className="text-center w-full max-h-[500px]">
            <div className="video-container relative mx-auto" style={{ maxWidth: '100%', backgroundColor: 'black', borderRadius: '0.375rem', overflow: 'hidden' }}>
              {/* iframe for video that passes auth cookies naturally */}
              <iframe
                src={videoUrl}
                style={{
                  width: '100%',
                  height: '400px',
                  border: 'none',
                  backgroundColor: 'black'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Video: ${attachment.name}`}
                aria-label={`${t('att.video-attachment')} ${attachment.name}`}
                onError={(e) => {
                  console.error("iframe failed to load:", e);

                  // Show error UI on failure
                  const iframe = e.currentTarget;
                  iframe.style.display = 'none';

                  const errorContainer = document.getElementById(`video-error-${attachment.id}`);
                  if (errorContainer) {
                    errorContainer.style.display = 'flex';
                  }
                }}
              ></iframe>

              {/* Error fallback */}
              <div
                id={`video-error-${attachment.id}`}
                className="flex-col items-center justify-center p-6 h-[300px]"
                style={{ display: 'none' }}
                aria-live="polite"
              >
                <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  {t('att.video-preview-couldnt-be-loaded-in-this-browser')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons moved outside the preview card */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(videoUrl + "?download=1", '_self', 'download')}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {t('actions.download')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(videoUrl, '_blank')}
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('att.open-in-new-tab')}
          </Button>
        </div>
      </>
    );
  }

  if (previewMode === "image") {
    // Create primary and alternate URLs for trying both port versions
    const primaryUrl = encodeUrlFilename(attachment.url);
    // const alternateUrl = getAlternateImageUrl(primaryUrl);

    return (
      <>
        <div className="p-6 rounded-md min-h-[400px] flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
          <div className="text-center w-full max-h-[500px] overflow-auto">
            {/* First attempt with regular URL */}
            <img
              key={`img-${attachment.id}`}
              src={primaryUrl}
              alt={attachment.name}
              className="max-w-full h-auto mx-auto object-contain"
              style={{ maxHeight: '400px' }}
            />

          </div>
        </div>

        {/* Buttons moved outside the preview card */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(primaryUrl + "?download=1", '_self', 'download')}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {t('actions.download')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(primaryUrl, '_blank')}
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('att.open-in-new-tab')}
          </Button>
        </div>
      </>
    );
  }

  if (previewMode === "pdf") {
    // Encode the filename portion for browser use
    const encodedUrl = encodeUrlFilename(attachment.url);
    // Add toolbar parameters for better PDF viewer
    const pdfUrl = encodedUrl.includes('#')
      ? encodedUrl
      : `${encodedUrl}#toolbar=0&navpanes=0`;

    return (
      <>
        <div className="p-6 rounded-md min-h-[400px] flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
          <div className="text-center w-full h-[500px]">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none"
              title={attachment.name}
            >
              <p className="text-sm text-gray-500">
                {t('your-browser-doesnt-support-pdf-embedding')}
                <a
                  href={encodedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {t('att.click-to-view-pdf')}
                </a>
              </p>
            </iframe>
          </div>
        </div>

        {/* Buttons moved outside the preview card */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(encodedUrl + "?download=1", '_self', 'download')}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {t('actions.download')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(encodedUrl, '_blank')}
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('att.open-in-new-tab')}
          </Button>
        </div>
      </>
    );
  }

  // Fall back to download link if all other options fail
  return (
    <>
      <div className="p-6 rounded-md min-h-[400px] flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
        <div className="text-center">
          <FileText className="h-20 w-20 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 mb-4">
            {t('att.this-attachment-cannot-be-previewed')}
          </p>
        </div>
      </div>

      {/* Button moved outside the preview card */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(encodeUrlFilename(attachment.url), '_blank')}
          className="flex items-center gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t('buttonTitle.open')} {attachment.name}
        </Button>
      </div>
    </>
  );
};

export function AttachmentsTab() {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(-1);
  const drawerOpenTimeRef = useRef<number>(Date.now());
  const [sheetWidth, setSheetWidth] = useState(50); // Default to 50% width
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [notActiveStage, setNotActiveStage] = useState(false);

  const { user, tenantName } = useUserStore(useShallow((state) => ({
    user: state.user,
    tenantName: state.tenantName
  })));

  // Get current user info
  const { initials: currentUserInitials } = useUserStore(
    useShallow((state) => ({
      legalName: state.legalName,
      initials: state.initials,
    }))
  );
  const { t, i18n } = useTranslation()
  // Get document info and attachments from store
  const { attachments: sortedAttachments, addAttachment, updateAttachment, documentId, documentStage, 
    clearAttachments, verifications, setVerifications, updateVerifications } = useDocumentStore(
    useShallow((state) => ({
      attachments: state.attachments,
      addAttachment: state.addAttachment,
      updateAttachment: state.updateAttachment,
      documentId: state.documentId,
      documentStage: state.documentStage,
      clearAttachments: state.clearAttachments,
      updateVerifications: state.updateVerifications,
      setVerifications: state.setVerifications,
      verifications: state.verifications
    }))
  );
  const { hideInsertIntoCellDialog } = useAppStore(useShallow((state) => ({
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
  })));

  // Sort attachments by number for consistent display

  const resizingRef = useRef(false);
  const initialXRef = useRef(0);
  const initialWidthRef = useRef(0);

  // Add useRef for the carousel
  const carouselApi = useRef<any>(null);

  // Function to load attachments
  const loadAttachments = async () => {
    if (!documentId) return;

    setIsLoadingAttachments(true);
    try {
      // Clear existing attachments first
      clearAttachments();

      const attachmentItems = await getAttachments(documentId);

      console.log("Loaded attachment items:", attachmentItems);

      // Get the latest document row to access verifications
      const lastItem = attachmentItems.slice().sort((a, b) => b.time - a.time)[0];
      console.log("Latest document state:", lastItem);

      // Process attachment items and add them to the store
      attachmentItems.forEach(item => {
        if ([ActionType.AddDocufenLink, ActionType.AddAttachment, ActionType.CursorAddDocufenLink, ActionType.CursorAddAttachment].includes(item.actionType ? item.actionType : ActionType.Undefined) && item.attachmentUrl && item.attachmentName) {
          const fileType = getFileType(item.attachmentUrl, item.attachmentName);

          // Create a StoreAttachment object
          const dt = DateTime.fromMillis(item.time, { zone: item.timezone })
          const attachment: Omit<StoreAttachment, 'id'> = {
            name: item.attachmentName,
            number: item.attachmentNumber,
            url: item.attachmentUrl,
            fileType: fileType,
            fileHash: item.attachmentHash || undefined,
            attachedBy: item.legalName,
            attachedOn: formatDatetimeString(dt, t),
            verifications: []
          };


          // Add to store
          addAttachment(attachment);
        }
      });
      updateVerifications();
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  // Load attachments when component mounts or documentId changes
  useEffect(() => {
    if (documentId) {
      loadAttachments();
    }
  }, [documentId]);
  useEffect(() => {
    const activeStage = [Stage.Draft, Stage.PreApprove, Stage.Execute].includes(documentStage)
    setNotActiveStage(!activeStage);
  }, [documentStage])

  // Also refresh attachments when attachment drawer is opened
  useEffect(() => {
    if (isDrawerOpen && documentId) {
      loadAttachments();
    }
  }, [isDrawerOpen]);

  // Add useEffect to track slide changes
  useEffect(() => {
    if (!carouselApi.current) return;

    // Set the carousel to the selected attachment
    carouselApi.current.scrollTo(selectedAttachmentIndex);

    // Setup slide change listener
    const onSelect = () => {
      const selectedIndex = carouselApi.current.selectedScrollSnap();
      if (selectedIndex !== selectedAttachmentIndex) {
        setSelectedAttachment(sortedAttachments[selectedIndex]);
        setSelectedAttachmentIndex(selectedIndex);
      }
    };

    carouselApi.current.on("select", onSelect);

    return () => {
      if (carouselApi.current) {
        carouselApi.current.off("select", onSelect);
      }
    };
  }, [carouselApi, selectedAttachmentIndex, sortedAttachments]);

  const handleAttachmentClick = (attachment: Attachment, index: number) => {
    // Track attachment viewed
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ATTACHMENT_VIEWED, {
      document_id: documentId,
      attachment_id: attachment.id,
      attachment_name: attachment.name,
      attachment_type: attachment.fileType,
      view_source: 'attachment_list_click'
    });
    
    setSelectedAttachment(attachment);
    setSelectedAttachmentIndex(index);
    setIsDrawerOpen(true);
    hideInsertIntoCellDialog()
    
    // Track attachment drawer opened
    drawerOpenTimeRef.current = Date.now();
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ATTACHMENT_DRAWER_OPENED, {
      document_id: documentId || 'unknown',
      attachment_id: attachment.id,
      attachment_name: attachment.name,
      open_source: 'attachment_list_click'
    });

    // Force-refresh the attachments data when viewing an item
    if (documentId) {
      loadAttachments();
    }
  };

  const closeDrawer = () => {
    // Track attachment drawer closed if it was open
    if (isDrawerOpen && selectedAttachment) {
      const timeOpen = Date.now() - drawerOpenTimeRef.current;
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ATTACHMENT_DRAWER_CLOSED, {
        document_id: documentId || 'unknown',
        attachment_id: selectedAttachment.id,
        time_open_ms: timeOpen
      });
    }
    setIsDrawerOpen(false);
    setSelectedAttachment(null)
  };

  // Navigate to the next attachment
  const goToNextAttachment = () => {
    if (selectedAttachmentIndex < sortedAttachments.length - 1) {
      const nextIndex = selectedAttachmentIndex + 1;
      setSelectedAttachment(sortedAttachments[nextIndex]);
      setSelectedAttachmentIndex(nextIndex);
    }
  };

  // Navigate to the previous attachment
  const goToPrevAttachment = () => {
    if (selectedAttachmentIndex > 0) {
      const prevIndex = selectedAttachmentIndex - 1;
      setSelectedAttachment(sortedAttachments[prevIndex]);
      setSelectedAttachmentIndex(prevIndex);
    }
  };

  const handleVerifyButtonClick = () => {
    setVerifyDialogOpen(true);
    setIsCertified(false);
  };


  const callVerifyAttachment = React.useCallback(async (event: MessageEvent) => {
    if (event.origin !== RAWSERVERURL) {
      console.log("Origin not allowed: " + event.origin)
      console.log("Allowed origin: " + RAWSERVERURL)
      return;
    }
    console.log("Message: type: " + (typeof event.data))
    if (typeof event.data !== "string") return
    if (event.data.startsWith("ej2")) {
      console.log("ej2 message: " + event.source)
      return
    }
    console.log("Received message: ")
    console.log("it is: " + event.data)
    console.log("user: " + user?.email)

    if (!selectedAttachment) {
      console.log("xxxNot certified or selected attachment is null");
      console.log("isCertified: " + isCertified);
      console.log("selectedAttachment: " + JSON.stringify(selectedAttachment));
      setVerifyDialogOpen(false);
      return;
    }
    const data = JSON.parse(event.data) as LoginMessage;
    const signedAsUser = getFullUser(data)
    if (user?.email != signedAsUser.email || user?.tenantName != signedAsUser.tenantName) {
      console.log("user")
      console.dir(user)
      console.log("signedAsUser")
      console.dir(signedAsUser)
      console.log("User signed in is different from current user")
      return
    }
    console.log("Do the signing")
    try {
      // Call the API verification function with document ID and attachment number
      const result: VerifyAttachmentResult = await verifyAttachment(documentId, selectedAttachment.number);
      if (result.status === "failed" || result.error) {
        // Handle error
        const errorMessage = result.error || t('att.could-not-verify-attachment');
        toast.error(t('att.verification-failed-errormessage', { errorMessage}));
        setIsVerifying(false);
        return;
      }

      // Add verification to UI
      const newVerification = currentUserInitials

      // Update the attachment in the store with the new verification
      const newVerifications = [
          ...(selectedAttachment.verifications || []),
          newVerification
        ]
      updateAttachment(selectedAttachment.number, {
        verifications: newVerifications
      });
      setVerifications({ ...verifications, [selectedAttachment.number.toString()]: newVerifications })

      // Also update the local state for immediate UI feedback
      setSelectedAttachment({
        ...selectedAttachment,
        verifications: [
          ...(selectedAttachment.verifications || []),
          newVerification
        ]
      });

      // Track attachment verified
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ATTACHMENT_VERIFIED, {
        document_id: documentId,
        attachment_id: selectedAttachment.id,
        attachment_name: selectedAttachment.name,
        verification_number: (selectedAttachment.verifications?.length || 0) + 1
      });
      
      // Show success message
      toast.success(t('att.your-verification-has-been-recorded-successfully'));

      // Log the updated state after verification
      console.log("Attachment verified successfully:", {
        attachmentNumber: selectedAttachment.number,
        verifications: [
          ...(selectedAttachment.verifications || []),
          newVerification
        ]
      });
    } catch (error) {
      console.error("Error verifying attachment:", error);
      toast.error(t('an-unexpected-error-occurred-while-verify'));
    } finally {
      setIsVerifying(false);
    }
  }, [selectedAttachment, currentUserInitials, documentId, updateAttachment, setIsVerifying, toast]);

  React.useEffect(() => {
    window.addEventListener('message', callVerifyAttachment)
    return () => {
      window.removeEventListener('message', callVerifyAttachment)
    }
  }, [callVerifyAttachment])

  const handleOpenLogin = () => {
    console.log("Start signing: ");
    if (!user) {
      console.log("User is null");
      return;
    }

    let url: string = "";
    if (!SERVERURL.includes("localhost")) {
      const selfUrl = window.location.origin;
      if (documentId.length > 5)
        url = selfUrl + "/api/sign/" + tenantName + "?lng=" + i18n.language;
    } else {
      if (documentId.length > 5)
        url = `${SERVERURL}sign/${tenantName}?lng=${i18n.language}`;
    }

    // Simply open the window - the message event listener will handle completion
    window.open(url, 'loginWindow', 'width=600,height=600,top=100,left=300');
  };


  const handleVerifyConfirmed = async () => {
    if (!isCertified || !selectedAttachment) {
      console.log("Is certified or selected attachment is null");
      console.log("isCertified: " + isCertified);
      console.log("selectedAttachment: " + JSON.stringify(selectedAttachment));
      setVerifyDialogOpen(false);
      return;
    }

    setVerifyDialogOpen(false);

    // Show loading state
    setIsVerifying(true);
    handleOpenLogin();

  };

  // Check if current user has verified
  const hasCurrentUserVerified = React.useMemo(() => {
    if (!selectedAttachment?.verifications || !currentUserInitials) return false;

    const hasVerified = selectedAttachment.verifications.some(v =>
      v.toUpperCase() === currentUserInitials.toUpperCase()
    );

    console.log(`Checking if ${currentUserInitials} has verified:`,
    selectedAttachment.verifications.map(v => v.toUpperCase()),
      "Result:", hasVerified
    );

    return hasVerified;
  }, [selectedAttachment, currentUserInitials]);

  // Check if verification is complete (2 verifications)
  const isVerificationComplete = (selectedAttachment?.verifications?.length || 0) >= 2;

// Function to get accurate file type display text
const getAccurateFileType = useCallback((fileType: Attachment["fileType"], url: string): string => {
  if (url && url.startsWith("/document/")) {
    return t('controlledDocument');
  }
  const fileExtension = url.split('.').pop()?.toLowerCase();

  if (fileType === "image") {
    if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
      return t('att.image-jpg');
    } else if (url.toLowerCase().includes('.png')) {
      return t('att.image-png');
    } else {
      return t('att.image');
    }
  } else if (fileType === "pdf") {
    return t('att.pdf-document-pdf');
  } else if (fileType === "video") {
    if (url.toLowerCase().includes('.mp4')) {
      return t('att.video-mp4');
    } else if (url.toLowerCase().includes('.mov')) {
      return t('att.video-mov');
    } else if (url.toLowerCase().includes('.webm')) {
      return t('att.video-webm');
    } else if (url.toLowerCase().includes('.avi')) {
      return t('att.video-avi');
    } else if (url.toLowerCase().includes('.mkv')) {
      return t('att.video-mkv');
    } else {
      return t('att.video');
    }
  } else {
    // Try to determine file type from extension
    if (fileExtension) {
      switch (fileExtension) {
        case "docx":
          return t('att.word-document-docx');
        case "xlsx":
          return t('att.excel-spreadsheet-xlsx');
        case "txt":
          return t('att.text-document-txt');
        default:
          return t('att.document-fileextension');
      }
    }
    return t('att.document');
  }
}, [t]);
  useEffect(() => {
    if (selectedAttachment) {
      console.log("Selected attachment verifications:", selectedAttachment.verifications);
      console.log("Current user initials:", currentUserInitials);
      console.log("Has user verified:", hasCurrentUserVerified);
      console.log("Is verification complete:", isVerificationComplete);
    }
  }, [selectedAttachment, currentUserInitials]);

  // Set up resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    resizingRef.current = true;
    initialXRef.current = e.clientX;
    initialWidthRef.current = sheetWidth;
    document.body.style.cursor = 'ew-resize';

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';

    // Add event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;

    // Calculate the delta movement
    const deltaX = initialXRef.current - e.clientX;

    // Calculate new width as a percentage (min 30%, max 80%)
    const newWidth = Math.max(30, Math.min(80, initialWidthRef.current + (deltaX / window.innerWidth * 100)));

    setSheetWidth(newWidth);
  };

  const handleResizeEnd = () => {
    resizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  // Add keyboard navigation for attachments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawerOpen) return;

      if (e.key === "ArrowRight") {
        goToNextAttachment();
      } else if (e.key === "ArrowLeft") {
        goToPrevAttachment();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, selectedAttachmentIndex, sortedAttachments]);

  return (
    <div className="h-full bg-background" style={{ backgroundColor: "#F5F2EE" }} data-testid="docExecutionPage.rsb.attachments.container">
      {/* Header with title */}
      <div className="flex items-center justify-between mb-4" data-testid="docExecutionPage.rsb.attachments.header">
        <h2 className="text-base font-medium" data-testid="docExecutionPage.rsb.attachments.title">{t('attachments')}</h2>
      </div>

      <div className="space-y-2" data-testid="docExecutionPage.rsb.attachments.list">
        {isLoadingAttachments ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm" data-testid="docExecutionPage.rsb.attachments.loadingState">
            {t('att.loading-attachments')}
          </div>
        ) : sortedAttachments.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm" data-testid="docExecutionPage.rsb.attachments.emptyState">
            {t('att.no-attachments-yet')}
          </div>
        ) : (
          sortedAttachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 bg-[#FAF9F5] rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleAttachmentClick(attachment, index)}
              data-testid={`docExecutionPage.rsb.attachments.item${attachment.id}`}
            >
              <div className="flex items-center justify-center w-6 min-w-6 text-xs font-medium text-gray-500" data-testid={`docExecutionPage.rsb.attachments.itemNumber${attachment.id}`}>
                {String(attachment.number).padStart(2, '0')}
              </div>
              <FileTypeIcon fileType={attachment.fileType} url={attachment.url} />
              <span className="text-sm flex-grow truncate" data-testid={`docExecutionPage.rsb.attachments.itemName${attachment.id}`}>{attachment.name}</span>

              {/* Show verification icons - one for each verification (max 2) */}
              {(attachment.verifications?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-gray-500" data-testid={`docExecutionPage.rsb.attachments.verificationIcons${attachment.id}`}>
                  {attachment.verifications?.slice(0, 2).map((_verification, idx) => (
                    <Stamp 
                      key={idx}
                      className="h-4 w-4 flex-shrink-0" 
                      // title={`${idx === 0 ? '1st' : '2nd'} verification by ${verification}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Full-screen overlay drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="right"
          className="!max-w-none p-0 border-l [&>button]:hidden"
          style={{ width: `${sheetWidth}%`, backgroundColor: "#F5F2EE" }}
          aria-labelledby="attachment-sheet-title"
          data-testid="docExecutionPage.rsb.attachments.drawer"
        >
          <div
            className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
            onMouseDown={handleResizeStart}
            data-testid="docExecutionPage.rsb.attachments.resizeHandle"
          >
            <GripVertical className="h-6 w-6 text-gray-400" />
          </div>

          <div className="h-full flex flex-col pl-2" style={{ backgroundColor: "#F5F2EE" }} data-testid="docExecutionPage.rsb.attachments.drawerContent">
            <div className="flex justify-between items-center p-4 border-b" data-testid="docExecutionPage.rsb.attachments.drawerHeader">
              <div className="flex items-center gap-4">
                {selectedAttachment && (
                  <h2 className="text-xl font-medium" id="attachment-sheet-title" data-testid="docExecutionPage.rsb.attachments.drawerTitle">
                    <span className="text-gray-700 mr-1">
                      {t('att.attachment')} {String(selectedAttachment.number).padStart(2, '0')}
                    </span>
                    {selectedAttachment.name && (
                      <span className="text-gray-700"> - {selectedAttachment.name}</span>
                    )}
                  </h2>
                )}
              </div>

              <Button variant="ghost" size="icon" onClick={closeDrawer} aria-label={t('att.close-attachment-panel')} data-testid="docExecutionPage.rsb.attachments.closeButton">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
              {selectedAttachment && (
                <>
                  <div className="mb-8">
                    <div className="space-y-3 p-4 rounded-md" style={{ backgroundColor: "#F5F2EE" }}>
                      <div className="grid grid-cols-[120px_1fr] gap-x-2 text-sm">
                        <div className="font-medium">Type:</div>
                        <div className="text-gray-500">{getAccurateFileType(selectedAttachment.fileType, selectedAttachment.url)}</div>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] gap-x-2 text-sm">
                        <div className="font-medium">{t('att.file-hash')}</div>
                        <div className="text-gray-500 text-xs break-all">{selectedAttachment.fileHash || t('att.pending...')}</div>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] gap-x-2 text-sm">
                        <div className="font-medium">{t('att.attachment-link')}</div>
                        <div className="text-gray-500 text-xs break-all">
                          <a
                            href={selectedAttachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            onClick={() => {
                              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                                button_name: 'attachment_open_new_tab',
                                button_location: 'attachment_details',
                                page_name: 'Document Editor'
                              });
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t('att.open-in-new-tab')}
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] gap-x-2 text-sm">
                        <div className="font-medium">{t('att.attached-by')}</div>
                        <div className="text-gray-500">{selectedAttachment.attachedBy}</div>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] gap-x-2 text-sm">
                        <div className="font-medium">{t('att.attached-on')}</div>
                        <div className="text-gray-500">{selectedAttachment.attachedOn}</div>
                      </div>

                      {/* True Copy Verifications section inside details card - without divider */}
                      <div className="grid grid-cols-[120px_1fr] gap-x-2 text-sm pt-2 mt-2">
                        <div className="font-medium">{t('att.true-copy-verifications')}</div>
                        <div className="text-gray-500">
                          <div className="flex justify-between items-center">
                            {/* Show Verify button if not verified */}
                            {!hasCurrentUserVerified && !isVerificationComplete && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleVerifyButtonClick}
                                disabled={isVerifying||notActiveStage}
                                className="flex items-center gap-1.5"
                              >
                                <Stamp className="h-3.5 w-3.5" />
                                {t('buttonTitle.verify')}
                              </Button>
                            )}
                            {hasCurrentUserVerified && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1.5 pointer-events-none"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('att.verified-by-you')}
                              </Button>
                            )}
                          </div>
                          {selectedAttachment.verifications && selectedAttachment.verifications.length > 0 ? (
                            <div className="space-y-1 mt-2">
                              {selectedAttachment.verifications.map((verification, idx) => (
                                <div key={idx} className="flex items-center gap-2 py-1 text-sm">
                                  <Stamp className="h-4 w-4" />
                                  <span className="font-medium">
                                    {idx === 0 ? '1st' : '2nd'} Verification: {verification}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 text-sm italic">
                              {t('att.not-yet-verified-as-a-true-copy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carousel for attachments */}
                  {sortedAttachments.length > 1 ? (
                    <div className="mt-4 mb-4">
                      <Carousel
                        className="w-full"
                        opts={{
                          startIndex: selectedAttachmentIndex,
                          loop: false,
                          align: "start"
                        }}
                        setApi={(api) => {
                          carouselApi.current = api;
                        }}
                        aria-label={t('att.attachment-viewer-carousel')}
                      >
                        <CarouselContent>
                          {sortedAttachments.map((attachment) => (
                            <CarouselItem key={attachment.id} role="group" aria-label={`${t('att.attachment')} ${attachment.number}: ${attachment.name}`}>
                              <AttachmentPreview attachment={attachment} />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </Carousel>
                    </div>
                  ) : (
                    <AttachmentPreview attachment={selectedAttachment} />
                  )}
                </>
              )}
            </div>

            {/* Fixed footer for navigation controls */}
            {selectedAttachment && (
              <div className="border-t p-3 bg-[#F5F2EE] flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedAttachmentIndex <= 0}
                  className="flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevAttachment();
                  }}
                  aria-label={t('att.previous-attachment')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t('common.previous')}</span>
                </Button>

                <span className="text-xs text-gray-500">
                  {t('att.attachment')} {selectedAttachmentIndex + 1} of {sortedAttachments.length}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedAttachmentIndex >= sortedAttachments.length - 1}
                  className="flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextAttachment();
                  }}
                  aria-label={t('att.next-attachment')}
                >
                  <span>{t('common.next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-labelledby="verification-dialog-title" data-testid="docExecutionPage.rsb.attachments.verificationDialog">
          <DialogHeader data-testid="docExecutionPage.rsb.attachments.verificationDialogHeader">
            <DialogTitle id="verification-dialog-title" className="flex items-center gap-2 font-semibold" data-testid="docExecutionPage.rsb.attachments.verificationDialogTitle">
              <Stamp className="h-5 w-5" />
              <span className="text-lg">{t("verifyAttachmentTitle")}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4" data-testid="docExecutionPage.rsb.attachments.verificationDialogBody">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={isCertified}
                onCheckedChange={(checked) => setIsCertified(checked === true)}
                className="mt-1"
                data-testid="docExecutionPage.rsb.attachments.verificationCheckbox"
              />
              <label
                htmlFor="terms"
                className="text-sm leading-relaxed"
                data-testid="docExecutionPage.rsb.attachments.verificationLabel"
              >
                {t('att.i-hereby-certify-true-copy')}
              </label>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end" data-testid="docExecutionPage.rsb.attachments.verificationDialogFooter">
            <Button
              variant="outline"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                  button_name: 'verify_attachment_cancel',
                  button_location: 'verify_attachment_dialog',
                  page_name: 'Document Editor'
                });
                setVerifyDialogOpen(false);
              }}
              data-testid="docExecutionPage.rsb.attachments.verificationCancelButton"
            >
              {t('buttonTitle.cancel')}
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90"
              disabled={!isCertified}
              onClick={handleVerifyConfirmed}
              data-testid="docExecutionPage.rsb.attachments.verificationConfirmButton"
            >
              {t('buttonTitle.verify')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttachmentsTab;
