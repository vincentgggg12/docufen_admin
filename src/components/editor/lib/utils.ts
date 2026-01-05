import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Stage } from "./lifecycle"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to convert document stage to string format for data-testid attributes
 * @param documentStage - The current document stage
 * @returns Stage string for use in data-testid attributes
 */
export function getStageString(documentStage: Stage): string {
  switch (documentStage) {
    case Stage.PreApprove:
      return 'preApproval';
    case Stage.Execute:
      return 'execution';
    case Stage.PostApprove:
      return 'postApproval';
    default:
      return 'unknown';
  }
}

/**
 * Helper function to convert Stage enum to DocumentStage type for analytics
 * @param stage - The Stage enum value
 * @returns DocumentStage type for analytics events
 */
export function stageToDocumentStage(stage: Stage | number | string | null): 'pre_approval' | 'execution' | 'post_approval' | 'completed' | 'closed' {
  if (stage === null || stage === undefined) return 'pre_approval';
  
  // Handle string representation of stages
  if (typeof stage === 'string') {
    const stageNum = parseInt(stage, 10);
    if (!isNaN(stageNum)) {
      stage = stageNum;
    } else {
      return 'pre_approval';
    }
  }
  
  switch (stage) {
    case Stage.PreApprove:
      return 'pre_approval';
    case Stage.Execute:
      return 'execution';
    case Stage.PostApprove:
      return 'post_approval';
    case Stage.Closed:
      return 'closed';
    case Stage.Finalised:
      return 'completed';
    default:
      return 'pre_approval';
  }
}
