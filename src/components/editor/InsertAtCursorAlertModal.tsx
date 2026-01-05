// import { useTranslation } from "react-i18next";
// import { 
//   Popover,
//   PopoverContent, 
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Button } from "@/components/ui/button";
// import { AlertTriangle, MapPin } from "lucide-react";

// interface InsertAtCursorAlertModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
//   contentType?: "text" | "signature";
//   isLoading?: boolean;
//   triggerElement?: React.ReactNode;
// }

// export function InsertAtCursorAlertModal({ 
//   isOpen, 
//   onClose, 
//   onConfirm,
//   contentType = "text",
//   isLoading = false,
//   triggerElement
// }: InsertAtCursorAlertModalProps) {
//   const { t } = useTranslation();

//   return (
//     <Popover open={isOpen} onOpenChange={()=>{}} data-testid="insertAtCursorAlertModal.popover">
//       <PopoverTrigger asChild data-testid="insertAtCursorAlertModal.trigger">
//         {triggerElement || <div className="hidden" />}
//       </PopoverTrigger>
//       <PopoverContent className="w-80" style={{zIndex: 11000}} data-testid="insertAtCursorAlertModal.content">
//         <div className="space-y-4">
//           <div className="flex items-center gap-2" data-testid="insertAtCursorAlertModal.header">
//             <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
//             <h4 className="text-lg font-semibold" data-testid="insertAtCursorAlertModal.title">
//               {t("insertAtCursor.confirmInsertion")}
//             </h4>
//           </div>
          
//           <p className="text-sm text-muted-foreground" data-testid="insertAtCursorAlertModal.description">
//             {contentType === "signature" 
//               ? t("insertAtCursor.signatureDescription")
//               : t("insertAtCursor.textDescription")
//             }
//           </p>

//           <div className="bg-amber-50 border border-amber-200 rounded-lg p-3" data-testid="insertAtCursorAlertModal.warningContainer">
//             <div className="flex items-start gap-2">
//               <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
//               <p className="text-sm text-amber-800" data-testid="insertAtCursorAlertModal.warningMessage">
//                 {t("insertAtCursor.warningMessage")}
//               </p>
//             </div>
//           </div>

//           <div className="flex gap-2 justify-end" data-testid="insertAtCursorAlertModal.buttonContainer">
//             <Button 
//               variant="outline" 
//               onClick={onClose}
//               disabled={isLoading}
//               size="sm"
//               data-testid="insertAtCursorAlertModal.cancelButton"
//             >
//               {t("actions.cancel")}
//             </Button>
//             <Button 
//               onClick={onConfirm}
//               disabled={isLoading}
//               size="sm"
//               data-testid="insertAtCursorAlertModal.confirmButton"
//             >
//               {isLoading ? (
//                 <>
//                   <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                   {t("states.processing...")}
//                 </>
//               ) : (
//                 t("insertAtCursor.confirmInsert")
//               )}
//             </Button>
//           </div>
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// }
