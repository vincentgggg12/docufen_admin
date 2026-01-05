import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SidebarSkeleton } from "./sidebar-skeleton"
import { SidebarLeft } from "./sidebar-left"
import { SidebarProvider } from "@/components/ui/sidebar"

export function SidebarSkeletonDemo() {
  const [showSkeleton, setShowSkeleton] = useState(true)

  return (
    <div className="space-y-4">
      <Button 
        onClick={() => setShowSkeleton(!showSkeleton)}
        className="mb-4"
      >
        Toggle: {showSkeleton ? "Show Real Sidebar" : "Show Skeleton"}
      </Button>
      
      <div className="border rounded-lg overflow-hidden h-[600px]">
        <SidebarProvider defaultOpen={true}>
          {showSkeleton ? (
            <SidebarSkeleton />
          ) : (
            <SidebarLeft />
          )}
        </SidebarProvider>
      </div>
    </div>
  )
}