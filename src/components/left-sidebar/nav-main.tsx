"use client"

import { useNavigate } from "react-router-dom"
import { type LucideIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar"
import { useTranslation } from "react-i18next"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    badge?: string
    specialColor?: string
    specialBackground?: string
    onClick?: () => void
  }[]
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleItemClick = (item: typeof items[0], event: React.MouseEvent) => {
    // Prevent default browser navigation
    event.preventDefault();

    // Track navigation event
    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
      button_name: `sidebar_nav_${item.title.replace(/\./g, '_')}`,
      button_location: 'left_sidebar_nav',
      page_name: 'Navigation',
      destination_url: item.url
    });

    // Call the onClick handler if provided
    if (item.onClick) {
      item.onClick();
    }

    // Only navigate if the URL is not a placeholder
    if (item.url && item.url !== "#") {
      navigate(item.url);
    }
  };

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton 
            asChild 
            isActive={item.isActive}
            className={`text-normal ${item.specialBackground || ""} w-full`}
          >
            <button 
              data-testid={`lsb.nav-main.${item.title.replace(/\./g, '-')}`}
              onClick={(e) => handleItemClick(item, e)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer ${
                item.specialBackground === "outline"
                  ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground rounded-md"
                  : item.specialBackground 
                    ? item.specialBackground.includes('border') 
                      ? `${item.specialBackground}` 
                      : `${item.specialBackground} text-white`
                    : "text-gray-600"
              } ${item.specialColor || ""}`}
            >
              <item.icon className={
                item.specialBackground === "outline" 
                  ? "" 
                  : item.specialBackground ? "text-white" : ""
              } />
              <span>{t(item.title)}</span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">
                  {item.badge}
                </span>
              )}
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
