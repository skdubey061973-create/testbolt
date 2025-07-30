import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Building, ArrowRight } from "lucide-react";

export default function RecruiterAutoLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("manycuvy@cyclelove.cc");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAutoLogin = async () => {
    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/auto-login-recruiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setMessage(data.message);
        
        // Wait a moment then redirect to recruiter dashboard
        setTimeout(() => {
          window.location.href = '/recruiter/dashboard';
        }, 1500);
      } else {
        setMessage(data.message || 'Auto-login failed');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      setMessage('Connection error. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger login on page load for pre-filled email
  useEffect(() => {
    if (email === "manycuvy@cyclelove.cc") {
      handleAutoLogin();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Recruiter Access
            </CardTitle>
            <CardDescription className="text-gray-600">
              Auto-login for verified company email addresses
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Company Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {message && (
              <Alert className={isSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {isSuccess && <CheckCircle className="w-4 h-4 text-green-600" />}
                  <AlertDescription className={isSuccess ? "text-green-800" : "text-red-800"}>
                    {message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Button 
              onClick={handleAutoLogin}
              disabled={isLoading || isSuccess}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Redirecting to Dashboard...
                </>
              ) : (
                <>
                  Login as Recruiter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                For verified company emails only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}