import React, { useState } from "react"
import { LogOut, ChevronsUpDown, HelpCircle, Ticket } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "../ui/dropdown-menu"
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "../ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useShallow } from "zustand/shallow"
import { useUserStore } from "@/lib/stateManagement"
import DocufenIcon from "@/assets/docufen_icon_v4.svg"
import DocufenLogo from "@/assets/docufen_logo_v4.svg"
import { useTranslation } from "react-i18next"
import { SupportModal } from "../support/SupportModal"

export function UserProfile({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { user, initials, legalName, logout } = useUserStore(useShallow((state) => ({ 
    initials: state.initials, user: state.user, legalName: state.legalName, logout: state.logout
  })))
  const { t } = useTranslation()
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  if (!user) return null
  return (
    <SidebarGroup {...props} className="pb-4">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  data-testid="lsb.user-profile.trigger"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md py-2"
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={legalName} />
                    ) : (
                      <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{legalName}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" sideOffset={16} className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <img src={DocufenIcon} alt={t('profile.docufenIcon')} className="h-5 w-5" />
                  <img src={DocufenLogo} alt={t('profile.docufenIcon')} className="h-4" />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  data-testid="lsb.user-profile.helpMenuItem"
                  className="flex gap-2 py-2"
                  onClick={() => window.open(t('helpUrl'), '_blank')}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>{t('help')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  data-testid="lsb.user-profile.supportMenuItem"
                  className="flex gap-2 py-2"
                  onClick={() => setIsSupportModalOpen(true)}
                >
                  <Ticket className="h-4 w-4" />
                  <span>{t('support.title', 'Support')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  data-testid="lsb.user-profile.logoutMenuItem"
                  className="flex gap-2 py-2" 
                  onClick={async () => { 
                    await logout(); 
                    // navigate('/login'); 
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('profile.logOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
      
      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </SidebarGroup>
  )
} 