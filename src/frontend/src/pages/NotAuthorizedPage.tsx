import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";

export default function NotAuthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-24 h-24 bg-destructive/10 rounded-full">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Not Authorized</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page. Please contact an
            administrator if you believe this is an error.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/" })} size="lg">
          Go Home
        </Button>
      </div>
    </div>
  );
}
