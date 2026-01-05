// import { Button } from '@/components/ui/button';
// import { PanelRight, PanelRightClose } from 'lucide-react';
// import { useSidebarRight } from '@/pages/DocumentCompletion/Right-sidebar/sidebar-right-context';
// import { cn } from '@/lib/utils';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { useTranslation } from 'react-i18next';

// interface SidebarRightToggleProps {
//   className?: string;
// }

// export function SidebarRightToggle({ className }: SidebarRightToggleProps) {
//   const { isVisible, toggleVisibility } = useSidebarRight();
//   const { t } = useTranslation();
//   // Choose the appropriate icon based on sidebar visibility
//   const Icon = isVisible ? PanelRightClose : PanelRight;

//   return (
//     <TooltipProvider delayDuration={300} data-testid="sidebarRightToggle.tooltipProvider">
//       <Tooltip data-testid="sidebarRightToggle.tooltip">
//         <TooltipTrigger asChild data-testid="sidebarRightToggle.tooltipTrigger">
//           <Button
//             variant="ghost"
//             size="icon"
//             className={cn("h-9 w-9 fixed top-3 right-3 bg-white rounded-md hover:bg-gray-50 z-30", className)}
//             onClick={toggleVisibility}
//             aria-label={isVisible ? t('sbrtoggle.closeSidebar') : t('sbrtoggle.openSidebar-0')}
//             data-testid="sidebarRightToggle.button"
//           >
//             <Icon className="h-5 w-5" data-testid="sidebarRightToggle.icon" />
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent side="left" data-testid="sidebarRightToggle.tooltipContent">
//           <p>{isVisible ? t('sbrtoggle.closeSidebar') : t('sbrtoggle.openSidebar-0')}</p>
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );
// } 