// import React, { useState } from "react"
// import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
// import { ComplianceTableData, schema } from "./compliance-data-table"
// import { Separator } from "../../components/ui/separator"
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbList,
//   BreadcrumbPage,
// } from "../../components/ui/breadcrumb"
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "../../components/ui/sidebar"
// import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
// import { Button } from "../../components/ui/button"
// import { FileWarning, PlusCircle, Trash2, FileX, Signature, Edit } from "lucide-react"
// import { useTranslation } from "react-i18next"
// import { useAccountStore, useAppStore, useTemplateStore, useUserStore } from "@/lib/stateManagement"
// import { useShallow } from "zustand/shallow"
// import { DocumentTemplate, DocumentType } from "./DocumentTemplateModal"
// import { createTemplate, deleteTemplate } from "@/lib/formApiUtils"
// import { z } from "zod"
// import WordIcon from "@/assets/word_icon.svg"
// import { ComplianceERSDModal } from "../AccountPage/components/ComplianceERSDModal"

// // Import the compliance data from JSON
// import complianceData from "./compliance-data-table.json"
// import { DocumentTemplateModal } from "./DocumentTemplateModal"
// import { APIURL } from "@/lib/server"

// // Define initial state for contactsToDelete
// // const noDeletes = { adminContacts: [], complianceContacts: [] }

// export default function CompliancePage() {
//   // --- State and Hooks from AccountPage (required for contact management) ---
//   const { tenantName } = useUserStore(useShallow((state) => ({
//     tenantName: state.tenantName,
//     user: state.user
//   })));
//   const { ersdText, setErsdText } = useAccountStore(useShallow((state) => ({
//     ersdText: state.ersdText,
//     setErsdText: state.setErsdText
//     // Keeping the store connection for future use if needed
//   })));

//   const { deviationTemplate, nonConformanceTemplate, setDeviationTemplate, setNonConformanceTemplate } = useTemplateStore(useShallow((state) => {
//     return {
//       deviationTemplate: state.deviationTemplate,
//       nonConformanceTemplate: state.nonConformanceTemplate,
//       setDeviationTemplate: state.setDeviationTemplate,
//       setNonConformanceTemplate: state.setNonConformanceTemplate
//     }
//   }))

//   const { setWorking } = useAppStore(useShallow((state) => ({
//     working: state.working,
//     setWorking: state.setWorking
//   })));

//   // Ref to track contacts to delete
//   // const contactsToDelete = useRef<ContactUsers>(noDeletes)

//   // Translation hook
//   const { t } = useTranslation();

//   // State for ERSD modal and text
//   const [ersdModalOpen, setErsdModalOpen] = useState(false);

//   // State for modal visibility
//   const [deviationFormModalOpen, setDeviationFormModalOpen] = useState(false);
//   const [nonConformanceModalOpen, setNonConformanceModalOpen] = useState(false);

//   // State for templates
//   // const [deviationTemplate, setDeviationTemplate] = useState<Template | null>(null);
//   // const [nonConformanceTemplate, setNonConformanceTemplate] = useState<Template | null>(null);

//   // State for form inputs within modals
//   // const [companyInfoForm, setCompanyInfoForm] = useState<CompanyInfo>({ ...companyInfo });
  
//   // Form templates
//   const [deviationTemplateForm, setDeviationTemplateForm] = useState<DocumentTemplate>({ 
//     documentName: "", 
//     documentNumber: "", 
//     versionNo: "", 
//     documentType: "deviation" 
//   });
//   const [editingDeviationTemplateId, _setEditingDeviationTemplateId] = useState<string | null>(null);

//   const [nonconformanceTemplateForm, setNonconformanceTemplateForm] = useState<DocumentTemplate>({ 
//     documentName: "", 
//     documentNumber: "", 
//     versionNo: "", 
//     documentType: "nonconformance" 
//   });
//   const [editingNonconformanceTemplateId, _setEditingNonconformanceTemplateId] = useState<string | null>(null);

//   // Force refresh state to trigger re-renders
//   const [refreshKey, setRefreshKey] = useState(0);
//   const forceRefresh = () => setRefreshKey(prevKey => prevKey + 1);

//   // // Fetch templates on component mount
//   // useEffect(() => {
//   //   const loadTemplates = async () => {
//   //     setWorking(true);
      
//   //     try {
//   //       // Fetch deviation templates
//   //       const deviationResponse = await fetchTemplates(tenantName, "deviation");
//   //       if (deviationResponse.success && deviationResponse.templates.length > 0) {
//   //         setDeviationTemplate(deviationResponse.templates[0]);
//   //       }
        
//   //       // Fetch non-conformance templates
//   //       const nonConformanceResponse = await fetchTemplates(tenantName, "nonconformance");
//   //       if (nonConformanceResponse.success && nonConformanceResponse.templates.length > 0) {
//   //         setNonConformanceTemplate(nonConformanceResponse.templates[0]);
//   //       }
//   //     } catch (error) {
//   //       console.error("Error loading templates:", error);
//   //     } finally {
//   //       setWorking(false);
//   //     }
//   //   };
    
//   //   loadTemplates();
//   // }, [tenantName, setWorking]);

//   // Effect to update companyInfoForm when companyInfo changes (e.g., initial load or after a save)
//   // useEffect(() => {
//   //   setCompanyInfoForm({ ...companyInfo });
//   // }, [companyInfo])

//   // // Helper function to get updates (simplified for contacts)
//   // const getUpdates = (original: CompanyInfo, updated: CompanyInfo): Partial<CompanyInfo> => {
//   //   const updates: Partial<CompanyInfo> = {}
//   //   // Only check for contact changes
//   //   const adminContactsLive = updated.adminContacts
//   //   const complianceContactsLive = updated.complianceContacts

//   //   // Check for new or updated admin contacts
//   //   if (adminContactsLive && original.adminContacts) {
//   //       const adminContactsChanged = adminContactsLive.length !== original.adminContacts.length ||
//   //           !adminContactsLive.every((contact, index) =>
//   //               original.adminContacts && original.adminContacts[index] &&
//   //               contact.email === original.adminContacts[index].email &&
//   //               contact.legalName === original.adminContacts[index].legalName
//   //           );
//   //       if (adminContactsChanged) {
//   //           updates.adminContacts = [...adminContactsLive];
//   //       }
//   //   } else if (adminContactsLive && (!original.adminContacts || original.adminContacts.length === 0)) {
//   //        if(adminContactsLive.length > 0) updates.adminContacts = [...adminContactsLive];
//   //   } else if (!adminContactsLive && original.adminContacts && original.adminContacts.length > 0) {
//   //        updates.adminContacts = []; // All deleted
//   //   }


//   //   // Check for new or updated compliance contacts
//   //    if (complianceContactsLive && original.complianceContacts) {
//   //       const complianceContactsChanged = complianceContactsLive.length !== original.complianceContacts.length ||
//   //           !complianceContactsLive.every((contact, index) =>
//   //                original.complianceContacts && original.complianceContacts[index] &&
//   //               contact.email === original.complianceContacts[index].email &&
//   //               contact.legalName === original.complianceContacts[index].legalName
//   //           );
//   //       if (complianceContactsChanged) {
//   //           updates.complianceContacts = [...complianceContactsLive];
//   //       }
//   //   } else if (complianceContactsLive && (!original.complianceContacts || original.complianceContacts.length === 0)) {
//   //       if(complianceContactsLive.length > 0) updates.complianceContacts = [...complianceContactsLive];
//   //   } else if (!complianceContactsLive && original.complianceContacts && original.complianceContacts.length > 0) {
//   //       updates.complianceContacts = []; // All deleted
//   //   }

//   //   return updates;
//   // }


//   // Function to handle saving the deviation template
//   const handleSaveDeviationTemplate = async (template: DocumentTemplate, docString: string) => {
//     console.log("handleSaveDeviationTemplate called with template:", template);
//     console.log("File provided:", !!docString);
//     setWorking(true);
    
//     try {
//       if (!docString) {
//         console.error("No file provided");
//         setWorking(false);
//         return;
//       }
      
//       // Create the template on the server
//       const response = await createTemplate(
//         tenantName,
//         {
//           // Cast the document type to ensure it's properly typed
//           documentType: template.documentType as DocumentType,
//           documentName: template.documentName,
//           documentNumber: template.documentNumber,
//           versionNo: template.versionNo,
//           documentFileName: template.documentFileName || "",
//           // Add required DocumentDescription fields
//           id: crypto.randomUUID(),
//           participantGroups: [], // Will be populated on the server
//           timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//           locale: navigator.language,
//           documentCategory: "templates"
//         },
//         docString
//       );
      
//       console.log("Template creation response:", response);
      
//       if (response.success && response.template) {
//         console.log("Setting deviation template:", response.template);
//         setDeviationTemplate(response.template);
//         // Force UI update
//         forceRefresh();
//         // Close the modal
//         setDeviationFormModalOpen(false);
//       } else {
//         console.error("Failed to create template:", response.error);
//       }
//     } catch (error) {
//       console.error("Error saving deviation template:", error);
//     } finally {
//       setWorking(false);
//     }
//   };

//   // Function to delete deviation template
//   const handleDeleteDeviationTemplate = async () => {
//     if (!deviationTemplate) return;
    
//     setWorking(true);
    
//     try {
//       const response = await deleteTemplate(tenantName, deviationTemplate.id);
      
//       if (response.success) {
//         setDeviationTemplate(null);
//       } else {
//         console.error("Failed to delete template:", response.error);
//       }
//     } catch (error) {
//       console.error("Error deleting deviation template:", error);
//     } finally {
//       setWorking(false);
//     }
//   };

//   // Function to handle saving the non-conformance template
//   const handleSaveNonconformanceTemplate = async (template: DocumentTemplate, docString: string) => {
//     console.log("handleSaveNonconformanceTemplate called with template:", template);
//     console.log("docString provided:", !!docString);
//     setWorking(true);
    
//     try {
//       if (!docString) {
//         console.error("No file provided");
//         setWorking(false);
//         return;
//       }
      
//       // Create the template on the server
//       const response = await createTemplate(
//         tenantName,
//         {
//           // Cast the document type to ensure it's properly typed
//           documentType: template.documentType as DocumentType,
//           documentName: template.documentName,
//           documentNumber: template.documentNumber,
//           versionNo: template.versionNo,
//           documentFileName: template.documentFileName || "",
//           // Add required DocumentDescription fields
//           id: crypto.randomUUID(),
//           participantGroups: [], // Will be populated on the server
//           timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//           locale: navigator.language,
//           documentCategory: "templates"
//         },
//         docString
//       );
      
//       console.log("Template creation response:", response);
      
//       if (response.success && response.template) {
//         console.log("Setting non-conformance template:", response.template);
//         setNonConformanceTemplate(response.template);
//         // Force UI update
//         forceRefresh();
//         // Close the modal
//         setNonConformanceModalOpen(false);
//       } else {
//         console.error("Failed to create template:", response.error);
//       }
//     } catch (error) {
//       console.error("Error saving non-conformance template:", error);
//     } finally {
//       setWorking(false);
//     }
//   };

//   // Function to delete non-conformance template
//   const handleDeleteNonConformanceTemplate = async () => {
//     if (!nonConformanceTemplate) return;
    
//     setWorking(true);
    
//     try {
//       const response = await deleteTemplate(tenantName, nonConformanceTemplate.id);
      
//       if (response.success) {
//         setNonConformanceTemplate(null);
//       } else {
//         console.error("Failed to delete template:", response.error);
//       }
//     } catch (error) {
//       console.error("Error deleting non-conformance template:", error);
//     } finally {
//       setWorking(false);
//     }
//   };

//   // Function to handle saving ERSD text
//   const handleSaveErsd = async () => {
//     setWorking(true);
//     try {
//       const response = await fetch(`${APIURL}saveersd/`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ersdText }),
//           credentials: "include"
//         }
//       );

//       if (!response.ok) {
//         console.error('Server response status:', response.status);
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.message || 'Failed to save ERSD text');
//       }
      
//       // Show success message
//       setErsdModalOpen(false);
//       setWorking(false);
//     } catch (error) {
//       console.error('Error saving ERSD text:', error);
//       alert('Error saving ERSD text: ' + (error instanceof Error ? error.message : 'Unknown error'));
//       setWorking(false);
//     }
//   };

//   // --- Placeholder for Compliance Table Data ---
//   // Using data from the imported JSON file
//   console.log("Compliance Data:", JSON.stringify(complianceData));
//   const complianceTableData: z.infer<typeof schema>[] = complianceData;
//   // --- End Placeholder ---


//   return (
//     <SidebarProvider>
//       {/* Use refreshKey to force re-render */}
//       <div key={refreshKey} style={{ display: 'contents' }}>
//         <SidebarLeft />
//         <SidebarInset style={{ border: 'none' }}>
//           <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background z-10">
//             <div className="flex flex-1 items-center gap-2 px-3">
//               <SidebarTrigger />
//               <Separator orientation="vertical" className="mr-2 h-4" />
//               <Breadcrumb>
//                 <BreadcrumbList>
//                   <BreadcrumbItem>
//                     <BreadcrumbPage className="text-lg font-medium text-gray-700">
//                       {t("compliance.complianceSettings", "Compliance")}
//                     </BreadcrumbPage>
//                   </BreadcrumbItem>
//                 </BreadcrumbList>
//               </Breadcrumb>
//             </div>
//           </header>
          
//           {/* Main content - Match exact layout pattern from Dashboard */}
//           <div className="flex flex-1 flex-col">
//             <div className="@container/main flex flex-1 flex-col gap-2">
//               <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
//                 {/* ERSD Card - Separate from the grid */}
//                 <div className="px-4 lg:px-6">
//                   <Card className="@container/card flex flex-col">
//                     <CardHeader className="flex flex-row items-center justify-between">
//                       <CardTitle className="flex items-center gap-2">
//                         <Signature className="h-5 w-5" />
//                         Electronic Record and Signature Disclosure (ERSD)
//                       </CardTitle>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8 text-muted-foreground"
//                         onClick={() => setErsdModalOpen(true)}
//                       >
//                         <Edit className="h-4 w-4" />
//                         <span className="sr-only">Edit ERSD</span>
//                       </Button>
//                     </CardHeader>
//                     <CardContent className="space-y-4 flex-grow">
//                       <div className="space-y-4">
//                         <p className="text-sm text-muted-foreground">
//                           Customise the Electronic Record and Signature Disclosure (ERSD) that users must accept before accessing the application.
//                         </p>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* Template Cards Container - Back to 2 columns */}
//                 <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
//                   {/* Deviation Form Card */}
//                   <Card className="@container/card flex flex-col">
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2">
//                         <FileWarning className="h-5 w-5" />
//                         Deviation Template
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-4 flex-grow">
//                       {deviationTemplate ? (
//                         <div className="space-y-4">
//                           <p className="text-sm text-muted-foreground">
//                             Template set and ready to use
//                           </p>
//                           <div className="mt-4 flex items-start space-x-4 border rounded-md p-4">
//                             <div className="flex-shrink-0">
//                               <img src={WordIcon} alt="Word Document" className="w-12 h-12" />
//                             </div>
//                             <div className="flex-1">
//                               <h3 className="font-medium text-base">{deviationTemplate.documentName}</h3>
//                               <div className="text-sm text-muted-foreground space-y-1 mt-1">
//                                 <p>{deviationTemplate.documentFileName}</p>
//                                 {deviationTemplate.documentNumber && (
//                                   <p>Document Number: {deviationTemplate.documentNumber}</p>
//                                 )}
//                                 {deviationTemplate.versionNo && (
//                                   <p>Version: {deviationTemplate.versionNo}</p>
//                                 )}
//                                 {deviationTemplate.createdAt && (
//                                   <p>Date Added: {new Date(deviationTemplate.createdAt).toLocaleDateString()}</p>
//                                 )}
//                               </div>
//                             </div>
//                             <Button 
//                               variant="ghost" 
//                               size="sm" 
//                               onClick={handleDeleteDeviationTemplate}
//                               className="flex-shrink-0"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                               <span className="sr-only">Delete template</span>
//                             </Button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-4">
//                           <p className="text-sm text-muted-foreground">
//                             Set a template for deviation forms. Users will use this template to log deviations from their documents.
//                           </p>
//                           <Button
//                             variant="default"
//                             size="default"
//                             className="w-full"
//                             onClick={() => setDeviationFormModalOpen(true)}
//                           >
//                             <PlusCircle className="h-4 w-4 mr-2" />
//                             Upload Deviation Template
//                           </Button>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>

//                   {/* Non-Conformance Form Card */}
//                   <Card className="@container/card flex flex-col">
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2">
//                         <FileX className="h-5 w-5" />
//                         Non-Conformance Template
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-4 flex-grow">
//                       {nonConformanceTemplate ? (
//                         <div className="space-y-4">
//                           <p className="text-sm text-muted-foreground">
//                             Template set and ready to use
//                           </p>
//                           <div className="mt-4 flex items-start space-x-4 border rounded-md p-4">
//                             <div className="flex-shrink-0">
//                               <img src={WordIcon} alt="Word Document" className="w-12 h-12" />
//                             </div>
//                             <div className="flex-1">
//                               <h3 className="font-medium text-base">{nonConformanceTemplate.documentName}</h3>
//                               <div className="text-sm text-muted-foreground space-y-1 mt-1">
//                                 <p>{nonConformanceTemplate.documentFileName}</p>
//                                 {nonConformanceTemplate.documentNumber && (
//                                   <p>Document Number: {nonConformanceTemplate.documentNumber}</p>
//                                 )}
//                                 {nonConformanceTemplate.versionNo && (
//                                   <p>Version: {nonConformanceTemplate.versionNo}</p>
//                                 )}
//                                 {nonConformanceTemplate.createdAt && (
//                                   <p>Date Added: {new Date(nonConformanceTemplate.createdAt).toLocaleDateString()}</p>
//                                 )}
//                               </div>
//                             </div>
//                             <Button 
//                               variant="ghost" 
//                               size="sm" 
//                               onClick={handleDeleteNonConformanceTemplate}
//                               className="flex-shrink-0"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                               <span className="sr-only">Delete template</span>
//                             </Button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-4">
//                           <p className="text-sm text-muted-foreground">
//                             Set a template for non-conformance forms. Users will use this template to log non-conformances from their documents.
//                           </p>
//                           <Button
//                             variant="default"
//                             size="default"
//                             className="w-full"
//                             onClick={() => setNonConformanceModalOpen(true)}
//                           >
//                             <PlusCircle className="h-4 w-4 mr-2" />
//                             Upload Non-Conformance Template
//                           </Button>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* Data Table - Using same pattern as Dashboard */}
//                 <DataTableWrapper>
//                   <ComplianceTableData data={complianceTableData} />
//                 </DataTableWrapper>
//               </div>
//             </div>
//           </div>
//         </SidebarInset>
//       </div>

//       {/* Modals */}
//       <ComplianceERSDModal
//         open={ersdModalOpen}
//         onOpenChange={setErsdModalOpen}
//         ersdText={ersdText}
//         setErsdText={setErsdText}
//         onSave={handleSaveErsd}
//       />

//       <DocumentTemplateModal
//         open={deviationFormModalOpen}
//         onOpenChange={setDeviationFormModalOpen}
//         templateForm={deviationTemplateForm}
//         setTemplateForm={setDeviationTemplateForm}
//         editingTemplateId={editingDeviationTemplateId}
//         onSave={handleSaveDeviationTemplate}
//         t={t}
//         documentType="deviation"
//       />

//       <DocumentTemplateModal
//         open={nonConformanceModalOpen}
//         onOpenChange={setNonConformanceModalOpen}
//         templateForm={nonconformanceTemplateForm}
//         setTemplateForm={setNonconformanceTemplateForm}
//         editingTemplateId={editingNonconformanceTemplateId}
//         onSave={handleSaveNonconformanceTemplate}
//         t={t}
//         documentType="nonconformance"
//       />
//     </SidebarProvider>
//   )
// }

// // Helper component to match the dashboard's DataTable wrapper styling
// function DataTableWrapper({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="px-4 lg:px-6">
//       <div className="w-full overflow-x-auto">
//         {children}
//       </div>
//     </div>
//   );
// }