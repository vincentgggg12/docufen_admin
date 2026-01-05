// import { Button } from "../../../components/ui/button";
// import { PanelRightClose, PanelRight } from "lucide-react";
// import { useTranslation } from "react-i18next";

// interface SidebarRightTriggerProps {
//   onClick?: () => void;
//   isVisible?: boolean;
// }

// export function SidebarRightTrigger({ onClick, isVisible = true }: SidebarRightTriggerProps) {
//   // Use different icons based on sidebar visibility
//   const Icon = isVisible ? PanelRightClose : PanelRight;
//   const { t } = useTranslation();
//   return (
//     <Button
//       variant="ghost"
//       size="icon"
//       className="h-9 w-9"
//       onClick={onClick}
//       aria-label={t('sbrtrigger.toggleRightSidebar')}
//       data-testid="sidebarRightTrigger.button"
//     >
//       <Icon className="h-5 w-5" data-testid="sidebarRightTrigger.icon" />
//     </Button>
//   );
// } 