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
//   DialogDescription
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

// interface NonConformanceFormModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   nonconformanceTemplateForm: DocumentTemplate;
//   setNonconformanceTemplateForm: React.Dispatch<React.SetStateAction<DocumentTemplate>>;
//   editingTemplateId: string | null;
//   onSave: (template: DocumentTemplate, docString: string) => void;
//   t: (key: string) => string;
// }

// export function NonConformanceFormModal({
//   open,
//   onOpenChange,
//   nonconformanceTemplateForm = {
//     documentName: "",
//     documentNumber: "",
//     versionNo: "",
//     documentType: "nonconformance" as DocumentType
//   },
//   setNonconformanceTemplateForm,
//   editingTemplateId,
//   onSave,
//   t,
// }: NonConformanceFormModalProps) {
//   const [currentStep, setCurrentStep] = React.useState(1);
//   const [isAcknowledged, setIsAcknowledged] = React.useState(false);
//   const [isApproved, setIsApproved] = React.useState(false);
//   const [docString, setDocString] = React.useState<string>("");

//   const callOnSave = () => {
//     console.log("NonConformanceModal - callOnSave called");
//     console.log("Document file exists:", !!documentFile);

//     if (documentFile) {
//       // Add the document name to the form data
//       const templateData: DocumentTemplate = {
//         ...nonconformanceTemplateForm,
//         documentName: nonconformanceTemplateForm?.documentName || documentFile?.name || "",
//         documentFileName: documentFile?.name || "",
//         documentNumber: nonconformanceTemplateForm?.documentNumber || "",
//         versionNo: nonconformanceTemplateForm?.versionNo || "",
//         documentType: "nonconformance" as DocumentType
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

//   // Make sure the form exists throughout the component
//   React.useEffect(() => {
//     if (!nonconformanceTemplateForm) {
//       setNonconformanceTemplateForm({
//         documentName: "",
//         documentNumber: "",
//         versionNo: "",
//         documentType: "nonconformance"
//       });
//     }
//   }, [nonconformanceTemplateForm, setNonconformanceTemplateForm]);

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
//       setUploadError("Only Word documents (.docx) are supported");
//       setIsUploading(false);
//       return;
//     }

//     setIsUploading(true);
//     setUploadProgress(0);
//     const formData = new FormData();
//     formData.append("file", file);
//     // Use XMLHttpRequest to track upload progress
//     try {
//       console.log("Converting file to DFN...");
//       const dfnObject = await convertDocxFileToDfn(formData, setUploadProgress, setIsUploading)
//       console.log("File converted to DFN:", docObject.slice(0, 100));
//       setDocumentFile(file);

//       // Update form with file info
//       setNonconformanceTemplateForm({
//         ...(nonconformanceTemplateForm || {
//           documentName: "",
//           documentNumber: "",
//           versionNo: "",
//           documentType: "deviation"
//         }),
//         documentFileName: file.name
//       });
//       setDocString(docObject);
//     } catch (err) {
//       setUploadError("Upload failed. Try again.");
//       setIsUploading(false);
//     }
//   }, [nonconformanceTemplateForm, setNonconformanceTemplateForm]);

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

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[550px]">
//         <DialogHeader>
//           <DialogTitle>
//             {editingTemplateId ? "Edit Non-Conformance Template" :
//               currentStep === 1 ? "Add Non-Conformance Template" : "Approve Non-Conformance Template"}
//           </DialogTitle>
//           <DialogDescription>
//             {editingTemplateId
//               ? "Edit your non-conformance form template"
//               : currentStep === 1
//                 ? "Upload or set a template for non-conformance forms. Users will use this template to log non-conformances from their documents."
//                 : "Confirm and sign off on this template to set it as the official standard for use in Docufen."}
//           </DialogDescription>
//         </DialogHeader>

//         {currentStep === 1 ? (
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label htmlFor="documentName">Document Name</Label>
//               <Input
//                 id="documentName"
//                 className="text-foreground"
//                 value={nonconformanceTemplateForm?.documentName || ""}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   setNonconformanceTemplateForm({ ...nonconformanceTemplateForm, documentName: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="documentNumber">Document Number</Label>
//               <Input
//                 id="documentNumber"
//                 className="text-foreground"
//                 value={nonconformanceTemplateForm?.documentNumber || ""}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   setNonconformanceTemplateForm({ ...nonconformanceTemplateForm, documentNumber: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="versionNo">Version no.</Label>
//               <Input
//                 id="versionNo"
//                 className="text-foreground"
//                 value={nonconformanceTemplateForm?.versionNo || ""}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   setNonconformanceTemplateForm({ ...nonconformanceTemplateForm, versionNo: e.target.value })
//                 }
//               />
//             </div>
//             <div className="mb-4">
//               <div
//                 className={`border border-dashed rounded-md p-10 flex flex-col items-center justify-center min-h-[240px] h-[300px] ${isDragging ? 'bg-primary/5 border-primary' : ''} ${uploadError ? 'border-destructive' : ''}`}
//                 onDragOver={handleDragOver}
//                 onDragEnter={handleDragEnter}
//                 onDragLeave={handleDragLeave}
//                 onDrop={handleDrop}
//               >
//                 {documentFile ? (
//                   <div className="text-center flex flex-col items-center justify-center h-[162px]">
//                     <img src={WordIcon} alt="Word Document" className="w-16 h-16 mb-4" />
//                     <p className="font-medium text-center">{documentFile.name}</p>
//                     <Button
//                       variant="outline"
//                       size="default"
//                       onClick={() => {
//                         setDocumentFile(null);
//                         setNonconformanceTemplateForm({ ...nonconformanceTemplateForm, documentFileName: "" });
//                       }}
//                       className="mt-4"
//                     >
//                       <Trash2 className="h-4 w-4 mr-2" />
//                       {t("documents.remove")}
//                     </Button>
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center h-[162px]">
//                     <img src={WordIcon} alt="Word Document" className="w-16 h-16 mb-4" />
//                     <p className="text-center text-muted-foreground mb-3">
//                       {isDragging ? t("documents.dropYourDocumentHere") : t("documents.dragAndDropOrClickToBrowse")}
//                     </p>
//                     <Button
//                       variant="outline"
//                       onClick={() => document.getElementById("nc-file-upload")?.click()}
//                       disabled={isUploading}
//                     >
//                       {isUploading ?
//                         <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("documents.uploading")}</> :
//                         t("documents.uploadDocument")}
//                     </Button>
//                     <input
//                       id="nc-file-upload"
//                       type="file"
//                       accept=".doc,.docx"
//                       className="hidden"
//                       onChange={handleFileUpload}
//                       disabled={isUploading}
//                     />
//                   </div>
//                 )}

//                 {/* Progress indicator area - always reserves space */}
//                 <div className="w-full mt-4 h-[38px]">
//                   {isUploading && (
//                     <>
//                       <div className="flex justify-between mb-1">
//                         <span className="text-sm font-medium">{uploadProgress}%</span>
//                         <span className="text-sm font-medium">{uploadProgress === 100 ? t("documents.processing") : t("documents.uploading")}</span>
//                       </div>
//                       <Progress value={uploadProgress} className="h-2" />
//                     </>
//                   )}
//                 </div>

//                 {uploadError && <div className="mt-3 text-destructive text-sm">{uploadError}</div>}
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-4 py-4">
//             <div className="p-4 border rounded-md">
//               <div className="mb-4 flex items-center space-x-4">
//                 <img src={WordIcon} alt="Word Document" className="w-16 h-16" />
//                 <div>
//                   <h3 className="font-semibold text-lg">{nonconformanceTemplateForm?.documentName || documentFile?.name}</h3>
//                   <p className="text-sm text-muted-foreground">{documentFile?.name}</p>
//                   {nonconformanceTemplateForm?.documentNumber && (
//                     <p className="text-sm">Document Number: {nonconformanceTemplateForm?.documentNumber}</p>
//                   )}
//                   {nonconformanceTemplateForm?.versionNo && (
//                     <p className="text-sm">Version: {nonconformanceTemplateForm?.versionNo}</p>
//                   )}
//                 </div>
//               </div>

//               <div className="border-t pt-4 mt-4">
//                 <div className="flex items-start space-x-2 mb-6">
//                   <Checkbox
//                     id="nc-approve-checkbox"
//                     checked={isAcknowledged}
//                     onCheckedChange={(checked) => setIsAcknowledged(checked === true)}
//                     className="mt-1"
//                   />
//                   <Label htmlFor="nc-approve-checkbox" className="text-sm">
//                     I hereby confirm that this is the current Non-Conformance template approved for official use in our organisation.
//                   </Label>
//                 </div>

//                 {isApproved ? (
//                   <div className="flex items-center justify-center py-2 font-medium">
//                     <Check className="h-4 w-4 mr-2" />
//                     Template Approved
//                   </div>
//                 ) : (
//                   <Button
//                     type="button"
//                     variant="default"
//                     className="w-full"
//                     disabled={!isAcknowledged}
//                     onClick={handleApproveTemplate}
//                   >
//                     <IconSignature className="h-4 w-4 mr-2" />
//                     Approve Template
//                   </Button>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         <DialogFooter>
//           {currentStep === 1 ? (
//             <>
//               <Button
//                 type="button"
//                 onClick={() => setCurrentStep(2)}
//                 disabled={!documentFile}
//               >
//                 Next
//               </Button>
//             </>
//           ) : (
//             <>
//               <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
//                 Back
//               </Button>
//               {isApproved && (
//                 <Button
//                   type="button"
//                   onClick={callOnSave}
//                 >
//                   Set as Template
//                 </Button>
//               )}
//             </>
//           )}
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }