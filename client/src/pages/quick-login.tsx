import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function QuickLogin() {
  const [email, setEmail] = useState('xeminety@forexzig.com');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleQuickLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Login successful",
          description: `Logged in as ${data.user.userType}`,
        });
        
        // Invalidate auth cache to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        // Redirect based on user type
        if (data.user.userType === 'recruiter') {
          setLocation('/recruiter-dashboard');
        } else {
          setLocation('/');
        }
      } else {
        toast({
          title: "Login failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quick Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <Button 
            onClick={handleQuickLogin} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Quick Login'}
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            <p>This is a temporary login for testing purposes</p>
            <p className="mt-2">Your user type: <strong>Recruiter</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}