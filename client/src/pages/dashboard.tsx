import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import EnhancedDashboard from "./enhanced-dashboard";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    // Redirect based on user type
    if (user?.userType === 'recruiter') {
      setLocation("/recruiter-dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show enhanced dashboard for job seekers
  return <EnhancedDashboard />;
}