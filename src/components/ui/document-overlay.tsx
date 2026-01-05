import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";

interface DocumentWorkingOverlayProps {
  className?: string;
}

export function DocumentWorkingOverlay({ className }: DocumentWorkingOverlayProps) {
  const { working } = useAppStore(
    useShallow((state) => ({
      working: state.working,
      workingTitle: state.workingTitle,
    }))
  );
  // if (performance.now() > 1000) return null
  // If not working, don't show anything
  if (!working) return null;
  
  // Check if this is a MasterPopup operation (text insertion, corrections, checkboxes, etc.)
  // const isMasterPopupOperation = 
  //   (!workingTitle || workingTitle === "") ||
  //   (workingTitle && (
  //     workingTitle.toLowerCase().includes("inserting") ||
  //     workingTitle.toLowerCase().includes("checkbox") ||
  //     workingTitle.toLowerCase().includes("correct") ||
  //     workingTitle.toLowerCase().includes("attach") ||
  //     workingTitle.toLowerCase().includes("signature") ||
  //     workingTitle.toLowerCase().includes("pre-approval") ||
  //     workingTitle.toLowerCase().includes("preapprove") ||
  //     workingTitle.toLowerCase().includes("pre-approve")
  //   ));

  // For MasterPopup operations, return a simple transparent overlay
  // if (isMasterPopupOperation) {
  //   return (
  //     <div className={cn("fixed inset-0 bg-black/10 z-[9999]", className)} />
  //   );
  // }

  // For other operations, keep a simple modal overlay
  return (
      <div className={cn("fixed inset-0 bg-black/10 z-[9999]", className)} />
    // <div
    //   className={cn(
    //     "fixed inset-0 bg-background/50 z-[9999] flex flex-col items-center justify-center",
    //     className
    //   )}
    // >
    //  /* <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
    //    {workingTitle && (
    //      <h3 className="text-lg font-semibold text-center">{workingTitle}</h3>
     //   )}
     // </div> */}
    // </div>
  );
} 