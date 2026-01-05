// import React from "react";
// import WordIcon from "@/assets/word_icon.svg";
// import { Loader2, Trash2, Check } from "lucide-react";
// import { IconSignature } from "@tabler/icons-react";
// import { Progress } from "@/components/ui/progress";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogDescription,
//   DialogPortal,
//   DialogOverlay
// } from "../../components/ui/dialog";
// import { Button } from "../../components/ui/button";
// import { Input } from "../../components/ui/input";
// import { Label } from "../../components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { convertDocxFileToDfn } from "@/lib/documentUtils";

// // Define the DocumentType enum
// export type DocumentType = "deviation" | "nonconformance";

// // Define our DocumentTemplate type
// export interface DocumentTemplate {
//   documentName: string;
//   documentNumber: string;
//   versionNo: string;
//   documentFileName?: string;
//   documentType: DocumentType;
// }

// interface DocumentTemplateModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   templateForm: DocumentTemplate;
//   setTemplateForm: React.Dispatch<React.SetStateAction<DocumentTemplate>>;
//   editingTemplateId: string | null;
//   onSave: (template: DocumentTemplate, docString: string) => void;
//   t: (key: string) => string;
//   documentType: DocumentType;
// }

// export function DocumentTemplateModal({
//   open,
//   onOpenChange,
//   templateForm,
//   setTemplateForm,
//   editingTemplateId,
//   onSave,
//   t,
//   documentType
// }: DocumentTemplateModalProps) {
//   // Local form state for responsive typing
//   const [localForm, setLocalForm] = React.useState<DocumentTemplate>({
//     documentName: "",
//     documentNumber: "",
//     versionNo: "",
//     documentType: documentType
//   });

//   const [currentStep, setCurrentStep] = React.useState(1);
//   const [isAcknowledged, setIsAcknowledged] = React.useState(false);
//   const [isApproved, setIsApproved] = React.useState(false);
//   const [docString, setDocString] = React.useState<string>("");

//   // Update local form when props change
//   React.useEffect(() => {
//     if (templateForm) {
//       setLocalForm({
//         documentName: templateForm.documentName || "",
//         documentNumber: templateForm.documentNumber || "",
//         versionNo: templateForm.versionNo || "",
//         documentType: templateForm.documentType || documentType,
//         documentFileName: templateForm.documentFileName
//       });
//     }
//   }, [templateForm, documentType]);

//   // Sync local state to parent state when navigating between steps
//   const syncToParentState = React.useCallback(() => {
//     setTemplateForm(localForm);
//   }, [localForm, setTemplateForm]);

//   const callOnSave = () => {
//     console.log(`${documentType === "nonconformance" ? "NonConformance" : "Deviation"}Modal - callOnSave called`);
//     console.log("Document file exists:", !!documentFile);

//     if (documentFile) {
//       // Add the document name to the form data
//       const templateData: DocumentTemplate = {
//         ...localForm,
//         documentName: localForm.documentName || documentFile?.name || "",
//         documentFileName: documentFile?.name || "",
//       };

//       console.log("Calling onSave with template data:", templateData);
//       onSave(templateData, docString);
//       onOpenChange(false);
//     } else {
//       console.error("Cannot save template - no document file");
//     }
//   };

//   const [documentFile, setDocumentFile] = React.useState<File | null>(null);
//   const [isDragging, setIsDragging] = React.useState(false);
//   const [uploadProgress, setUploadProgress] = React.useState(0);
//   const [isUploading, setIsUploading] = React.useState(false);
//   const [uploadError, setUploadError] = React.useState<string | null>(null);

//   // Reset steps when modal is opened/closed
//   React.useEffect(() => {
//     if (!open) {
//       setCurrentStep(1);
//       setIsAcknowledged(false);
//       setIsApproved(false);
//     }
//   }, [open]);

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//       handleFile(e.dataTransfer.files[0]);
//     }
//   };

//   const handleFile = React.useCallback(async (file: File) => {
//     setUploadError(null);
//     setIsUploading(true);
//     setUploadProgress(0);
//     const validExtensions = ['.docx'];
//     const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
//     if (!validExtensions.includes(ext)) {
//       setUploadError(t('documentTemplateModal.OnlyWordDocumentsDocxAreSupported'));
//       setIsUploading(false);
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", file);
    
//     try {
//       console.log("Converting file to DFN...");
//       const docObject = await convertDocxFileToDfn(formData, setUploadProgress, setIsUploading);
//       console.log("File converted to DFN:", docObject.slice(0, 100));
//       setDocumentFile(file);

//       // Update local form with file info
//       setLocalForm(prev => ({
//         ...prev,
//         documentFileName: file.name
//       }));

//       setDocString(docObject);
//     } catch (err) {
//       setUploadError("Upload failed. Try again.");
//       setIsUploading(false);
//     }
//   }, []);

//   const handleFileUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       handleFile(file);
//       e.target.value = "";
//     }
//   }, [handleFile]);

//   const handleApproveTemplate = () => {
//     setIsApproved(true);
//   };

//   // Get a title-cased document type for display
//   const documentTypeDisplay = documentType === "nonconformance" 
//     ? "Non-Conformance" 
//     : "Deviation";

//   // Handle step navigation with state sync
//   const handleNextStep = () => {
//     syncToParentState(); // Sync local state to parent before navigation
//     setCurrentStep(2);
//   };
  
//   const handleBackStep = () => {
//     setCurrentStep(1);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogPortal>
//         <DialogOverlay className="z-[10000]" />
//         <DialogContent className="sm:max-w-[550px] z-[10001]">
//           <DialogHeader>
//             <DialogTitle>
//               {editingTemplateId ? `Edit ${documentTypeDisplay} Template` :
//                 currentStep === 1 ? `Add ${documentTypeDisplay} Template` : `Approve ${documentTypeDisplay} Template`}
//             </DialogTitle>
//             <DialogDescription>
//               {editingTemplateId
//                 ? `Edit your ${documentType} form template`
//                 : currentStep === 1
//                   ? `Upload or set a template for ${documentType} forms. Users will use this template to log ${documentType}s from their documents.`
//                   : "Confirm and sign off on this template to set it as the official standard for use in Docufen."}
//             </DialogDescription>
//           </DialogHeader>

//           {currentStep === 1 ? (
//             <div className="space-y-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="documentName">Document Name</Label>
//                 <Input
//                   id="documentName"
//                   className="text-foreground"
//                   value={localForm.documentName || ""}
//                   onChange={(e) => setLocalForm(prev => ({ ...prev, documentName: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="documentNumber">Document Number</Label>
//                 <Input
//                   id="documentNumber"
//                   className="text-foreground"
//                   value={localForm.documentNumber || ""}
//                   onChange={(e) => setLocalForm(prev => ({ ...prev, documentNumber: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="versionNo">Version no.</Label>
//                 <Input
//                   id="versionNo"
//                   className="text-foreground"
//                   value={localForm.versionNo || ""}
//                   onChange={(e) => setLocalForm(prev => ({ ...prev, versionNo: e.target.value }))}
//                 />
//               </div>
//               <div className="mb-4">
//                 <div
//                   className={`border border-dashed rounded-md p-10 flex flex-col items-center justify-center min-h-[240px] h-[300px] ${isDragging ? 'bg-primary/5 border-primary' : ''} ${uploadError ? 'border-destructive' : ''}`}
//                   onDragOver={handleDragOver}
//                   onDragEnter={handleDragEnter}
//                   onDragLeave={handleDragLeave}
//                   onDrop={handleDrop}
//                 >
//                   {documentFile ? (
//                     <div className="text-center flex flex-col items-center justify-center h-[162px]">
//                       <img src={WordIcon} alt="Word Document" className="w-16 h-16 mb-4" />
//                       <p className="font-medium text-center">{documentFile.name}</p>
//                       <Button
//                         variant="outline"
//                         size="default"
//                         onClick={() => {
//                           setDocumentFile(null);
//                           setLocalForm(prev => ({ ...prev, documentFileName: "" }));
//                         }}
//                         className="mt-4"
//                       >
//                         <Trash2 className="h-4 w-4 mr-2" />
//                         {t("documents.remove")}
//                       </Button>
//                     </div>
//                   ) : (
//                     <div className="flex flex-col items-center justify-center h-[162px]">
//                       <img src={WordIcon} alt="Word Document" className="w-16 h-16 mb-4" />
//                       <p className="text-center text-muted-foreground mb-3">
//                         {isDragging ? t("documents.dropYourDocumentHere") : t("documents.dragAndDropOrClickToBrowse")}
//                       </p>
//                       <Button
//                         variant="outline"
//                         onClick={() => document.getElementById(`${documentType}-file-upload`)?.click()}
//                         disabled={isUploading}
//                       >
//                         {isUploading ?
//                           <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("documents.uploading")}</> :
//                           t("documents.uploadDocument")}
//                       </Button>
//                       <input
//                         id={`${documentType}-file-upload`}
//                         type="file"
//                         accept=".doc,.docx"
//                         className="hidden"
//                         onChange={handleFileUpload}
//                         disabled={isUploading}
//                       />
//                     </div>
//                   )}

//                   {/* Progress indicator area - always reserves space */}
//                   <div className="w-full mt-4 h-[38px]">
//                     {isUploading && (
//                       <>
//                         <div className="flex justify-between mb-1">
//                           <span className="text-sm font-medium">{uploadProgress}%</span>
//                           <span className="text-sm font-medium">{uploadProgress === 100 ? t("documents.processing") : t("documents.uploading")}</span>
//                         </div>
//                         <Progress value={uploadProgress} className="h-2" />
//                       </>
//                     )}
//                   </div>

//                   {uploadError && <div className="mt-3 text-destructive text-sm">{uploadError}</div>}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-4 py-4">
//               <div className="p-4 border rounded-md">
//                 <div className="mb-4 flex items-center space-x-4">
//                   <img src={WordIcon} alt="Word Document" className="w-16 h-16" />
//                   <div>
//                     <h3 className="font-semibold text-lg">{localForm.documentName || documentFile?.name}</h3>
//                     <p className="text-sm text-muted-foreground">{documentFile?.name}</p>
//                     {localForm.documentNumber && (
//                       <p className="text-sm">Document Number: {localForm.documentNumber}</p>
//                     )}
//                     {localForm.versionNo && (
//                       <p className="text-sm">Version: {localForm.versionNo}</p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="border-t pt-4 mt-4">
//                   <div className="flex items-start space-x-2 mb-6">
//                     <Checkbox
//                       id={`${documentType}-approve-checkbox`}
//                       checked={isAcknowledged}
//                       onCheckedChange={(checked) => setIsAcknowledged(checked === true)}
//                       className="mt-1"
//                     />
//                     <Label htmlFor={`${documentType}-approve-checkbox`} className="text-sm">
//                       I hereby confirm that this is the current {documentTypeDisplay} template approved for official use in our organisation.
//                     </Label>
//                   </div>

//                   {isApproved ? (
//                     <div className="flex items-center justify-center py-2 font-medium">
//                       <Check className="h-4 w-4 mr-2" />
//                       Template Approved
//                     </div>
//                   ) : (
//                     <Button
//                       type="button"
//                       variant="default"
//                       className="w-full"
//                       disabled={!isAcknowledged}
//                       onClick={handleApproveTemplate}
//                     >
//                       <IconSignature className="h-4 w-4 mr-2" />
//                       Approve Template
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           <DialogFooter>
//             {currentStep === 1 ? (
//               <>
//                 <Button
//                   type="button"
//                   onClick={handleNextStep}
//                   disabled={!documentFile}
//                 >
//                   Next
//                 </Button>
//               </>
//             ) : (
//               <>
//                 <Button type="button" variant="outline" onClick={handleBackStep}>
//                   Back
//                 </Button>
//                 {isApproved && (
//                   <Button
//                     type="button"
//                     onClick={callOnSave}
//                   >
//                     Set as Template
//                   </Button>
//                 )}
//               </>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </DialogPortal>
//     </Dialog>
//   );
// }