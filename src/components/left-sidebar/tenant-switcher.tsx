import * as React from "react"
import { ChevronDown, PlusCircle, Building } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar"
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { UserTenantProps } from "@/lib/User"
import { useTranslation } from "react-i18next";

const TRUNCATION_LENGTH = 27
const MAX_DISPLAY_LENGTH = 30

const TenantSwitcher: React.FC<{}> = () => {
  const { tenants, tenantName, login, user, setUser, setLoading } = useUserStore(useShallow((state) => ({
    tenants: state.tenants,
    tenantName: state.tenantName,
    login: state.login,
    user: state.user,
    setUser: state.setUser,
    setLoading: state.setLoading,
  })))
  const { t } = useTranslation()
  const [activeTeam, setActiveTeam] = React.useState<UserTenantProps | null>(null)

  React.useEffect(() => {
    if (tenants && tenantName && tenants[tenantName]) {
      console.log("activeTeam: ", JSON.stringify(tenants[tenantName]))
      console.log("activeTeam.logo: " + (!!tenants[tenantName].logo).toString())
      setActiveTeam(tenants[tenantName])
    }
  }, [tenantName, tenants])

  if (!activeTeam) {
    return null
  }

  // Get the user's home tenant information from the user object
  // Since homeTenantName is now available, use it directly
  const userHomeTenant = user?.homeTenantName || "";
  
  // Separate tenants into "your organizations" and "external organizations"
  const yourOrganizations = []
  const externalOrganizations = []

  for (const thisTenantName of Object.keys(tenants)) {
    const team: UserTenantProps = tenants[thisTenantName]
    const tenantDisplayName = team.tenantDisplayName == null ? "Company" : team.tenantDisplayName 
    if (team.invitationStatus === "inactive")
      continue // Skip inactive teams
    
    // Check if this is the user's home organization
    // Compare the tenantName with the user's homeTenantName
    const isHomeOrganization = thisTenantName === userHomeTenant;
    
    const organizationItem = (
      <DropdownMenuItem
        key={thisTenantName}
        data-testid={`lsb.tenant-switcher.organization.${thisTenantName}`}
        onClick={() => changeTeam(thisTenantName)}
        className="gap-2 p-2"
      >
        <div className="flex size-6 items-center justify-center rounded-xs border">
          {team.logo ? (
            <img 
              src={team.logo} 
              alt={`${team.tenantDisplayName || 'Company'} logo`} 
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                console.error(`Failed to load logo in menu: ${team.logo}`);
                // Replace the image with a Building icon instead of hiding it
                const parentDiv = e.currentTarget.parentElement;
                if (parentDiv) {
                  e.currentTarget.style.display = 'none';
                  const iconSpan = document.createElement('span');
                  iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>';
                  parentDiv.appendChild(iconSpan);
                }
              }}
              onLoad={() => console.log(`Successfully loaded logo in menu: ${team.logo}`)}
            />
          ) : (
            <Building className="size-4 text-foreground opacity-70" />
          )}
        </div>
        {tenantDisplayName.length > MAX_DISPLAY_LENGTH ? tenantDisplayName.slice(0, TRUNCATION_LENGTH) + "..." : tenantDisplayName}
      </DropdownMenuItem>
    )
    
    if (isHomeOrganization) {
      yourOrganizations.push(organizationItem)
    } else {
      externalOrganizations.push(organizationItem)
    }
  }

  // Check if user already has their own organization account
  // This would be the case if the Microsoft tenant ID matches the Docufen tenant ID
  
  const hasOwnOrganizationAccount = yourOrganizations.length > 0 || user?.tenants[userHomeTenant] != null

  const changeTeam = (teamKey: string) => {
    if (teamKey !== tenantName) {
      setActiveTeam(tenants[teamKey])
      login(teamKey, "/home")
    }
  }

  const handleCreateOrganization = () => {
    setLoading(true)
    setUser(null)
    login(userHomeTenant, "/setup")
  }
  const displayName = activeTeam.tenantDisplayName == null ? "Company" : activeTeam.tenantDisplayName
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton 
              data-testid="lsb.tenant-switcher.trigger"
              className="w-fit px-1.5"
            >
            <div className="bg-muted flex aspect-square size-5 items-center justify-center rounded-md overflow-hidden">
                {activeTeam.logo ? (
                  <img 
                    src={activeTeam.logo} 
                    alt={`${activeTeam.tenantDisplayName || 'Company'} logo`} 
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      console.error(`Failed to load logo: ${activeTeam.logo}`);
                      // Replace the image with a Building icon instead of hiding it
                      const parentDiv = e.currentTarget.parentElement;
                      if (parentDiv) {
                        e.currentTarget.style.display = 'none';
                        const iconSpan = document.createElement('span');
                        iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>';
                        parentDiv.appendChild(iconSpan);
                      }
                    }}
                    // onLoad={() => console.log(`Successfully loaded logo: ${activeTeam.logo}`)}
                  />
                ) : (
                  <Building className="size-3 text-foreground opacity-70" />
                )}
              </div>
              <span className="truncate font-medium">{displayName.length > MAX_DISPLAY_LENGTH ? displayName.slice(0, TRUNCATION_LENGTH) + "..." : displayName}</span>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {yourOrganizations.length > 0 && (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {t('switcher.yourOrganisation')}
                </DropdownMenuLabel>
                {yourOrganizations}
              </>
            )}
            
            {externalOrganizations.length > 0 && (
              <>
                {yourOrganizations.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {t('switcher.externalOrganisations')}
                </DropdownMenuLabel>
                {externalOrganizations}
              </>
            )}
            
            {!hasOwnOrganizationAccount && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 p-2 cursor-pointer">
                  <button 
                    data-testid="lsb.tenant-switcher.createOrganizationButton"
                    onClick={handleCreateOrganization}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <PlusCircle className="h-5 w-5 text-primary" />
                    <span>{t('switcher.createYourOrgAccount')}</span>
                  </button>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default TenantSwitcher
