import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarRightSkeletonProps {
  className?: string;
}

// Custom skeleton component using the same color as selected sidebar items
const SkeletonBar: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "bg-[#FAF9F5] animate-pulse rounded",
        className
      )}
    />
  );
};

export const SidebarRightSkeleton: React.FC<SidebarRightSkeletonProps> = ({ className }) => {
  return (
    <div className={cn("flex h-full", className)} style={{ backgroundColor: "#F5F2EE" }}>
      {/* Main sidebar content */}
      <div
        className="h-full overflow-hidden bg-background"
        style={{ 
          width: '365px',
          backgroundColor: "#F5F2EE"
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="px-4" style={{ paddingTop: "1.3rem", paddingBottom: "0.25rem" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "1.1rem" }}>
              {/* Document type icon and title skeleton */}
              <div className="flex items-center gap-2 flex-grow mr-2">
                <SkeletonBar className="h-5 w-5 rounded" />
                <SkeletonBar className="h-4 w-48" />
              </div>
            </div>
          </div>
          
          {/* Tab content area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full px-4 py-4 space-y-4">
              {/* Fillout tab skeleton (default) */}
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center gap-2">
                  <SkeletonBar className="h-4 w-4 rounded" />
                  <SkeletonBar className="h-5 w-32" />
                </div>
                
                {/* Participant list skeleton */}
                <div className="space-y-3 pl-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonBar className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <SkeletonBar className="h-4 w-full" />
                        <SkeletonBar className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Another section */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <SkeletonBar className="h-4 w-4 rounded" />
                    <SkeletonBar className="h-5 w-32" />
                  </div>
                  
                  <div className="space-y-3 pl-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <SkeletonBar className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <SkeletonBar className="h-4 w-full" />
                          <SkeletonBar className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with navigation buttons */}
          <div className="px-4 pb-4 pt-2 border-t border-[#E8E7E3]">
            <div className="flex w-full gap-2">
              {/* Left button skeleton */}
              <div className="flex items-center gap-2 h-9 flex-1 border border-[#E8E7E3] rounded-md px-3 justify-start">
                <SkeletonBar className="h-4 w-4 rounded" />
                <SkeletonBar className="h-3 w-16" />
              </div>
              {/* Right button skeleton */}
              <div className="flex items-center gap-2 h-9 flex-1 border border-[#E8E7E3] rounded-md px-3 justify-end">
                <SkeletonBar className="h-3 w-20" />
                <SkeletonBar className="h-4 w-4 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mini sidebar on right */}
      <div className="h-full bg-background border-l flex flex-col items-center py-4 w-12" style={{ 
        backgroundColor: "#F5F2EE",
        borderLeftColor: "#FAF9F5" 
      }}>
        <div className="flex flex-col items-center w-full">
          {/* Toggle button skeleton */}
          <SkeletonBar className="h-9 w-9 mb-2 rounded" />
          
          {/* Tab buttons skeleton */}
          {[...Array(5)].map((_, i) => (
            <SkeletonBar key={i} className="h-9 w-9 my-1 rounded" />
          ))}
          
          {/* Refresh button skeleton */}
          <SkeletonBar className="h-9 w-9 my-1 rounded" />
        </div>
        
        {/* Stage indicator skeleton at bottom */}
        <div className="mt-auto px-2">
          <SkeletonBar className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
};