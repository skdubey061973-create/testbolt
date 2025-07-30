import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/profile-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Rocket, Moon, Sun, User, Settings, LogOut, BarChart3, FileText, Briefcase, Crown, Menu, X, Plus, MessageCircle, Target, Brain, Users, Trophy, Code, Bell, Upload, Zap, HelpCircle, ChevronDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Redirect to landing page after successful logout
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: still redirect to landing page
      window.location.href = '/';
    }
  };

  // Define navigation items based on user type
  const getNavItems = () => {
    if (!user) {
      // For non-authenticated users
      return [
        { href: "/recruiter-features", label: "For Recruiters", icon: Users },
      ];
    } else if (user?.userType === 'recruiter' || user?.userType === 'company') {
      return [
        { href: "/", label: "Dashboard", icon: BarChart3 },
        { href: "/post-job", label: "Post Job", icon: Plus },
        { href: "/test-assignments", label: "Test Assignments", icon: FileText },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/chat", label: "Messages", icon: MessageCircle },
        { href: "/job-seeker-view", label: "View as Job Seeker", icon: Users },
        { href: "/recruiter-premium", label: "🚀 Upgrade", icon: Crown, premium: true },
      ];
    } else {
      return [
        { href: "/", label: "Dashboard", icon: BarChart3 },
        { href: "/applications", label: "Applications", icon: FileText },
        { href: "/jobs", label: "Jobs", icon: Briefcase },
        { href: "/post-job", label: "Post Job", icon: Plus },
        { href: "/job-seeker-tests", label: "Tests", icon: FileText },
        { href: "/ranking-tests", label: "Rankings", icon: Trophy },
        { href: "/mock-interview", label: "Practice", icon: Code },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/job-seeker-premium", label: "🚀 Upgrade", icon: Crown, premium: true },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 w-full shadow-sm">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoJobr
              </span>
              {user?.planType === 'premium' && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </Link>
            <div className="hidden md:flex space-x-2 lg:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "flex items-center space-x-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105",
                        item.premium 
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl" 
                          : isActive
                          ? "text-primary bg-primary/15 shadow-sm border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", item.premium && "text-yellow-200")} />
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications Bell - only for authenticated users */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex h-9 w-9 rounded-full hover:bg-muted/80 transition-all duration-200 relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
                <span className="sr-only">Notifications</span>
              </Button>
            )}

            {/* Theme toggle with improved styling */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:flex h-9 w-9 rounded-full hover:bg-muted/80 transition-all duration-200"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
            
            {/* Login button for non-authenticated users */}
            {!user && (
              <Button 
                onClick={() => window.location.href = "/auth"} 
                className="bg-primary hover:bg-primary/90"
              >
                Sign In
              </Button>
            )}

            {/* User dropdown for authenticated users */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:flex">
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted/80 transition-all duration-200 ring-2 ring-transparent hover:ring-primary/20">
                    <UserAvatar 
                      user={{
                        id: user?.id || '',
                        email: user?.email || '',
                        firstName: user?.firstName,
                        lastName: user?.lastName,
                        profileImageUrl: user?.profileImageUrl
                      }} 
                      size="sm" 
                    />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.name || user?.email?.split('@')[0] || 'User'
                      }
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/subscription">
                  <DropdownMenuItem>
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/98 backdrop-blur-md shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-2 max-h-screen overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
                        item.premium
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md"
                          : isActive
                          ? "text-primary bg-primary/15 shadow-sm border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
              
              {/* Mobile theme toggle */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                <span>Toggle {theme === "light" ? "Dark" : "Light"} Mode</span>
              </button>
              
              {/* Mobile login button for non-authenticated users */}
              {!user && (
                <div className="border-t border-border pt-4 mt-4">
                  <Button 
                    onClick={() => window.location.href = "/auth"} 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Sign In
                  </Button>
                </div>
              )}

              {/* Mobile user section */}
              {user && (
                <>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center px-3 py-2">
                      <UserAvatar 
                        user={{
                          id: user?.id || '',
                          email: user?.email || '',
                          firstName: user?.firstName,
                          lastName: user?.lastName,
                          profileImageUrl: user?.profileImageUrl
                        }} 
                        size="sm" 
                        className="mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.name || user?.email?.split('@')[0] || 'User'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
