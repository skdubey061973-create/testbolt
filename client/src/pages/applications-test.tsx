import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";

export default function ApplicationsTest() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-blue-600">Applications Test Page</h1>
        <p>User: {user?.name}</p>
        <p>This is a test to verify basic functionality</p>
      </div>
    </div>
  );
}