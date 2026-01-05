import { DocumentDescription } from "@/lib/apiUtils";
import { File, FileStack, FileWarning, FileX } from "lucide-react";

export type DocumentType = 
  | "controlled-document" 
  | "controlled-copy" 
  | "deviation" 
  | "non-conformance";

interface DocumentTypeIconProps {
  document: DocumentDescription;
  className?: string;
}

const DocumentTypeIcon = ({ document, className }: DocumentTypeIconProps) => {
  // Determine document type
  let documentType: DocumentType = "controlled-document";
  
  if (document.parentDocument && document.parentDocument.documentId) {
    documentType = "controlled-copy";
  }
  
  
  // Map document type to icon
  const icons = {
    "controlled-document": File,
    "controlled-copy": FileStack,
    "deviation": FileWarning,
    "non-conformance": FileX
  };
  
  const Icon = icons[documentType];
  
  return <Icon className={className} />;
};

export default DocumentTypeIcon;