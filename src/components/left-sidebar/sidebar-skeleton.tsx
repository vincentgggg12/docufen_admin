import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "../ui/sidebar"

export function SidebarSkeleton() {
  return (
    <Sidebar className="border-0 text-gray-600 animate-pulse" style={{ border: 'none' }}>
      <SidebarHeader className="text-normal">
        {/* Tenant Switcher Skeleton */}
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 rounded-md">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>

        {/* Navigation Menu Skeleton */}
        <div className="mt-2 space-y-1">
          {/* New Document Button Skeleton */}
          <div className="px-2 py-1">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          
          {/* Menu Items Skeleton */}
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="px-2 py-1">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </SidebarHeader>

      <SidebarContent className="text-normal">
        {/* Recent Documents Section Skeleton */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
          </div>
          
          {/* Recent Document Items */}
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-full max-w-[180px]" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Skeleton at bottom */}
        <div className="flex flex-col mt-auto">
          <div className="border-t px-2 py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-32" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>
      </SidebarContent>
      
      <SidebarRail className="border-0" style={{ border: 'none' }} />
    </Sidebar>
  )
}