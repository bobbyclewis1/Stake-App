import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function LandingPage() {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      // User is logged in, redirect to dashboard
      window.location.href = "/dashboard";
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingScreen text="Loading..." />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // This should never render as we redirect in all cases
  return null;
}
