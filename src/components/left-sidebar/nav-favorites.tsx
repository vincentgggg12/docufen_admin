import {
  MoreHorizontal,
} from "lucide-react"
import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar"
import { FavoriteItem, useDocumentsStore, useSidebarStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { useTranslation } from "react-i18next"


export function NavFavorites({
  favorites,
}: {
  favorites: FavoriteItem[]
}) {
  const { isMobile, setOpen } = useSidebar()
  const navigate = useNavigate()
  const { activeDocumentId, setActiveDocumentId } = useDocumentsStore(useShallow((state) => ({
    activeDocumentId: state.activeDocumentId,
    setActiveDocumentId: state.setActiveDocumentId
  })))
  const { t } = useTranslation()
  // Get setActiveMenuItem from our store to clear main navigation selection
  const { setActiveMenuItem, activeMenuItem } = useSidebarStore()

  // Monitor activeMenuItem changes and clear document selection if menu item is active
  React.useEffect(() => {
    if (activeMenuItem !== null) {
      console.log('Menu item active, clearing document selection');
      setActiveDocumentId(null);
    }
  }, [activeMenuItem, setActiveDocumentId]);

  const logoutAndNavigate = (url: string) => {
    // Clear authentication
    localStorage.setItem('isAuthenticated', 'false')
    // Force a complete page reload to ensure React Router reads the updated localStorage
    window.location.href = url;
  }

  // Handle document click to properly set active document and clear main menu selection
  const handleDocumentClick = (e: React.MouseEvent, item: FavoriteItem) => {
    // Prevent default navigation
    e.preventDefault();
    
    console.log('Document clicked - clearing menu selection and setting active document:', item.id);
    
    // First clear the active menu item
    setActiveMenuItem(null);
    
    // Then set the active document ID
    setActiveDocumentId(item.id);
    
    // Close mobile sidebar if needed
    if (isMobile) {
      setOpen(false);
    }
    
    // Use programmatic navigation
    const navigationId = Date.now().toString();
    sessionStorage.setItem('navigationId', navigationId);
    navigate(item.url, { 
      state: { 
        fromInternal: true, 
        navigationId: navigationId 
      } 
    })
    // navigate(item.url, {
    //   state: { fromInternal: true }, // Indicate this is an internal navigation);
    // })
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t('recents')}</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton 
              asChild
              isActive={activeDocumentId === item.id && activeMenuItem === null}
            >
              {item.forceLogout ? (
                <button 
                  data-testid={`lsb.nav-favorites.documentButton.${item.id}`}
                  onClick={() => logoutAndNavigate(item.url)}
                  title={item.documentName}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {item.emoji ? (
                    <span>{item.emoji}</span>
                  ) : item.icon ? (
                    React.createElement(item.icon, { className: "h-4 w-4" })
                  ) : null}
                  <span>{item.documentName}</span>
                </button>
              ) : (
                <Link 
                  data-testid={`lsb.nav-favorites.documentLink.${item.id}`}
                  to={item.url} 
                  title={item.documentName}
                  onClick={(e) => handleDocumentClick(e, item)}
                >
                  {item.emoji ? (
                    <span>{item.emoji}</span>
                  ) : item.icon ? (
                    React.createElement(item.icon, { className: "h-4 w-4" })
                  ) : null}
                  <span>{item.documentName}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton 
            data-testid="lsb.nav-favorites.moreButton"
            className="text-sidebar-foreground/70"
          >
            <MoreHorizontal />
            <span>{t('more')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
