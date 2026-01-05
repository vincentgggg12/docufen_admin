import React, { ReactNode } from "react"
import { cn } from "../../lib/utils"
import { LucideIcon } from "lucide-react"
import { Badge } from "./badge"

interface StatusChipProps {
  label: string | ReactNode
  icon: LucideIcon
  variant?: "pre-approve" | "execution" | "pre-approval" | "default"
  className?: string
}

export function StatusChip({
  label,
  icon: Icon,
  variant = "default",
  className,
  ...props
}: StatusChipProps & React.HTMLAttributes<HTMLDivElement>) {
  const iconColors = {
    "pre-approve": "text-indigo-500",
    "pre-approval": "text-indigo-500",
    "execution": "text-amber-500",
    "default": "text-gray-500"
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        "text-muted-foreground px-1.5 flex items-center gap-1",
        className
      )}
      {...props}
    >
      <Icon className={cn("h-3.5 w-3.5", iconColors[variant])} />
      {label}
    </Badge>
  )
} 