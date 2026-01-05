import React from 'react';
import { cn } from '@/lib/utils';

interface DocumentSkeletonProps {
  className?: string;
}

// Custom skeleton component with sidebar color scheme
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

export const DocumentSkeleton: React.FC<DocumentSkeletonProps> = ({ className }) => {
  return (
    <div className={cn("h-full w-full relative bg-[#F5F2EE] flex items-center justify-center overflow-hidden", className)}>
      {/* Main document area with scrollable appearance */}
      <div className="relative max-w-5xl w-full h-full mx-auto px-4 md:px-8 overflow-auto" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        {/* Document paper effect with realistic dimensions */}
        <div className="bg-white rounded-sm mx-auto" style={{ maxWidth: '816px', minHeight: '1056px' }}>
          <div className="p-12 md:p-16 space-y-6">
            {/* Document header/title skeleton */}
            <div className="space-y-4 mb-12">
              <SkeletonBar className="h-10 w-4/5" />
              <SkeletonBar className="h-6 w-3/5" />
            </div>
            
            {/* Document content skeleton - multiple sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <div className="space-y-3">
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-5 w-5/6" />
                <SkeletonBar className="h-5 w-4/5" />
              </div>
              
              {/* Section 2 */}
              <div className="space-y-3">
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-5 w-11/12" />
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-5 w-3/4" />
              </div>
              
              {/* Table skeleton */}
              <div className="border border-[#F8F6F3] rounded-md p-4 bg-[#FDFCFB]">
                <div className="grid grid-cols-3 gap-3">
                  {/* Table header */}
                  <SkeletonBar className="h-8 bg-[#F5F3F0]" />
                  <SkeletonBar className="h-8 bg-[#F5F3F0]" />
                  <SkeletonBar className="h-8 bg-[#F5F3F0]" />
                  {/* Table rows */}
                  {[...Array(4)].map((_, i) => (
                    <React.Fragment key={i}>
                      <SkeletonBar className="h-6" />
                      <SkeletonBar className="h-6" />
                      <SkeletonBar className="h-6" />
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              {/* Section 3 */}
              <div className="space-y-3">
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-5 w-5/6" />
                <SkeletonBar className="h-5 w-11/12" />
                <SkeletonBar className="h-5 w-4/5" />
              </div>

              {/* Signature area skeleton */}
              <div className="mt-12 space-y-4">
                <SkeletonBar className="h-5 w-1/3" />
                <div className="flex gap-8">
                  <div className="space-y-2">
                    <SkeletonBar className="h-16 w-48" />
                    <SkeletonBar className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonBar className="h-16 w-48" />
                    <SkeletonBar className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};