import { Loader2, RefreshCw, WifiOff, X } from "lucide-react";
import { useState } from "react";

interface OfflineBannerProps {
  /** If true, shows amber "waking up" state instead of red error */
  isColdStart?: boolean;
  /** Called when user clicks Recheck button */
  onRecheck?: () => void;
  onDismiss?: () => void;
}

export default function OfflineBanner({
  isColdStart = false,
  onRecheck,
  onDismiss,
}: OfflineBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (isColdStart) {
    // Amber banner: backend is waking up (ICP cold start)
    return (
      <div className="sticky top-0 z-50 w-full bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>Backend waking up (ICP cold start) — please wait…</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Red banner: backend is truly unreachable after retries
  return (
    <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>Backend is unreachable — some features may be unavailable</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onRecheck && (
          <button
            type="button"
            onClick={() => {
              setDismissed(false);
              onRecheck();
            }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-destructive-foreground/10 transition-colors"
            aria-label="Recheck backend"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recheck
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-destructive-foreground/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
