import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

function LoadingScreen(props: LoadingScreenProps) {
  const { loading } = useUserStore(useShallow((state) => ({
    loading: state.loading
  })))
  const { message = "Loading..." } = props;
  const { className } = props;
  if (!loading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
export default LoadingScreen;