"use client"
import * as React from "react"
import {
  MessageCircleQuestion,
  Settings,
  ChartSpline,
  LucideProps,
} from "lucide-react"
import { NavMain } from "./nav-main"
import { UserProfile } from "./user-profile"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "../ui/sidebar"
import { useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { SidebarSkeleton } from "./sidebar-skeleton"

interface NavigationItem {
  title: string
  url: string,
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>,
  isActive: boolean,
  onClick: () => void
}

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, userType, loading } = useUserStore(useShallow((state) => ({
    user: state.user,
    userType: state.userType,
    loading: state.loading,
  })))
  const { t } = useTranslation()
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = React.useState<string | null>(null)

  const [navList, setNavList] = React.useState({
    navMain: [] as NavigationItem[],
    navSecondary: [
      {
        title: t('help'),
        url: "#",
        icon: MessageCircleQuestion,
      },
    ],
  })

  // Update active item based on current location
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin')) {
      setActiveMenuItem('Admin Dashboard');
    } else if (path.includes('/metrics')) {
      setActiveMenuItem('Metrics');
    } else {
      setActiveMenuItem(null);
    }
  }, [location]);

  // Set active item manually when a menu item is clicked
  const handleMenuItemClick = (itemTitle: string) => {
    setActiveMenuItem(itemTitle);
  };

  // Create navList inside the component
  React.useEffect(() => {
    if (user == null || userType == null) return
    const navMain: NavigationItem[] = []

    // Admin Dashboard
    navMain.push({
      title: 'Admin Dashboard',
      url: "/admin",
      icon: Settings,
      isActive: activeMenuItem === 'Admin Dashboard',
      onClick: () => handleMenuItemClick('Admin Dashboard')
    })

    // Metrics
    navMain.push({
      title: 'Metrics',
      url: "/metrics",
      icon: ChartSpline,
      isActive: activeMenuItem === 'Metrics',
      onClick: () => handleMenuItemClick('Metrics')
    })

    setNavList({
      navMain,
      navSecondary: [
        {
          title: t('help'),
          url: "#",
          icon: MessageCircleQuestion,
        },
      ],
    })
  }, [user, userType, activeMenuItem, t])

  if (loading) {
    return <SidebarSkeleton {...props} />
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {/* User profile section */}
        <UserProfile />
      </SidebarHeader>
      <SidebarContent>
        {/* Main navigation */}
        <NavMain items={navList.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
