import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  message?: string;
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Spinner({
  message,
  className,
  size = "medium"
}: SpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && <p className="text-center font-medium text-muted-foreground">{message}</p>}
    </div>
  );
} 