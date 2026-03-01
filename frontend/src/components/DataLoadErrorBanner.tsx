import { useState } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';

interface DataLoadErrorBannerProps {
  message?: string;
}

export default function DataLoadErrorBanner({
  message = 'Some data failed to load. Please refresh.',
}: DataLoadErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:bg-destructive/10 transition-colors"
          aria-label="Refresh page"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-destructive/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
