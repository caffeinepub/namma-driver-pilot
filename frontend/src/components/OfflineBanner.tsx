import { useState } from 'react';
import { X, WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  onDismiss?: () => void;
}

export default function OfflineBanner({ onDismiss }: OfflineBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>Backend is unreachable — some features may be unavailable</span>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-destructive-foreground/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
