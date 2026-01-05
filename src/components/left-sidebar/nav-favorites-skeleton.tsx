import { Skeleton } from "@/components/ui/skeleton"

export function NavFavoritesSkeleton() {
  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      
      {/* Recent Document Items Skeleton */}
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="px-2">
            <div className="flex items-center gap-2 py-1.5 rounded-md">
              <Skeleton className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}