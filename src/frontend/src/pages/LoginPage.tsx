import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Car, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const isLoggingIn = loginStatus === "logging-in";

  // If already authenticated, redirect to post-login landing
  useEffect(() => {
    if (identity) {
      navigate({ to: "/post-login" });
    }
  }, [identity, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full">
              <Car className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Namma Driver Pilot
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <Button
            className="w-full h-11 text-base font-medium"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
