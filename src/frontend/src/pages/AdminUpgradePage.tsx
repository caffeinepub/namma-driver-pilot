import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useUpgradeToAdmin } from "../hooks/useQueries";

export default function AdminUpgradePage() {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const upgradeMutation = useUpgradeToAdmin();

  const handleUpgrade = async () => {
    setErrorMessage(null);
    try {
      const result = await upgradeMutation.mutateAsync(code);
      // Backend returns null on success, or an error string on failure
      if (result === null) {
        navigate({ to: "/admin/dashboard" });
      } else {
        setErrorMessage(result);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Upgrade</CardTitle>
          <CardDescription>
            Enter the admin setup code to upgrade your account to admin role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="admin-code">Enter Admin Setup Code</Label>
            <Input
              id="admin-code"
              type="password"
              placeholder="Enter setup code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !upgradeMutation.isPending) {
                  handleUpgrade();
                }
              }}
              disabled={upgradeMutation.isPending}
            />
            {errorMessage && (
              <p className="text-sm text-destructive font-medium">
                {errorMessage}
              </p>
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleUpgrade}
            disabled={upgradeMutation.isPending || code.trim() === ""}
          >
            {upgradeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upgrading...
              </>
            ) : (
              "Upgrade to Admin"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
