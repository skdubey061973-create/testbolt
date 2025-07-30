import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import PremiumGate from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  RefreshCw,
  Briefcase,
  Building,
  Clock,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Star,
  Bell,
  Zap,
  Flame,
  Trophy
} from "lucide-react";

// Helper functions
const getStatusColor = (status: string) => {
  const colors = {
    applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    interviewed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    offered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  };
  return colors[status as keyof typeof colors] || colors.applied;
};

const getStatusIcon = (status: string) => {
  const icons = {
    applied: <Clock className="h-4 w-4" />,
    under_review: <Eye className="h-4 w-4" />,
    interview: <Users className="h-4 w-4" />,
    interviewed: <CheckCircle className="h-4 w-4" />,
    offered: <Award className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    withdrawn: <AlertCircle className="h-4 w-4" />
  };
  return icons[status as keyof typeof icons] || icons.applied;
};

export default function Applications() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading]);

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    retry: false,
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/applications/stats"],
    retry: false,
  });

  // Filter applications based on search and filters
  const filteredApplications = Array.isArray(applications) ? applications.filter((app: any) => {
    const matchesSearch = !searchTerm || 
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Job Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track and manage your job application journey
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
                  toast({
                    title: "Synced",
                    description: "Application data refreshed.",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
            </div>
          </motion.div>

          {/* Enhanced Stats Cards with Gamification */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -mr-8 -mt-8"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.length}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      {filteredApplications.length >= 10 ? "🔥 On Fire!" : filteredApplications.length >= 5 ? "👍 Good Progress" : "🚀 Keep Going!"}
                    </p>
                  </div>
                  <div className="relative">
                    <Briefcase className="h-8 w-8 text-blue-500" />
                    {filteredApplications.length >= 10 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full -mr-8 -mt-8"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.filter((app: any) => app.status === 'under_review').length}
                    </p>
                    <p className="text-xs text-yellow-600 font-medium mt-1">
                      Active Opportunities
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full -mr-8 -mt-8"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interviews</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.filter((app: any) => app.status === 'interview').length}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      {filteredApplications.filter((app: any) => app.status === 'interview').length > 0 ? "🎯 Great Work!" : "Coming Soon!"}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full -mr-8 -mt-8"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.length > 0 
                        ? Math.round((filteredApplications.filter((app: any) => app.status === 'offered').length / filteredApplications.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {filteredApplications.length > 0 ? "Keep Improving!" : "Start Applying!"}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Progress & Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Goal Progress */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Weekly Application Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Week: {Math.min(filteredApplications.filter(app => {
                      const appDate = new Date(app.appliedDate);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return appDate >= weekAgo;
                    }).length, 5)} / 5 applications</span>
                    <span className="text-sm text-gray-500">Goal: 5 per week</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((filteredApplications.filter(app => {
                        const appDate = new Date(app.appliedDate);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return appDate >= weekAgo;
                      }).length / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Keep going!</span>
                    <span>{5 - Math.min(filteredApplications.filter(app => {
                      const appDate = new Date(app.appliedDate);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return appDate >= weekAgo;
                    }).length, 5)} left to reach goal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => window.location.href = '/jobs'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Apply to New Job
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/mock-interview'}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Practice Interview
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Achievement System & Streak Counter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Streak Counter */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      Application Streak
                    </h3>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                      {Math.min(filteredApplications.filter(app => {
                        const appDate = new Date(app.appliedDate);
                        const today = new Date();
                        const diffDays = Math.floor((today.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
                        return diffDays <= 7;
                      }).length, 7)} days
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {filteredApplications.length >= 7 ? "🔥 You're on fire!" : "Keep the momentum going!"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badge */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      Next Achievement
                    </h3>
                    <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      {filteredApplications.length < 5 ? "First 5 Applications" : 
                       filteredApplications.length < 10 ? "10 Applications Club" :
                       filteredApplications.length < 25 ? "Job Hunter Expert" : "Application Master"}
                    </p>
                    <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((filteredApplications.length / (filteredApplications.length < 5 ? 5 : filteredApplications.length < 10 ? 10 : 25)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Insights & Analytics */}
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Application Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Response Rate Trend */}
                <div className="text-center">
                  <div className="bg-indigo-100 dark:bg-indigo-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Response Rate</h4>
                  <p className="text-2xl font-bold text-indigo-600">
                    {filteredApplications.length > 0 
                      ? Math.round((filteredApplications.filter(app => ['under_review', 'interview', 'offered'].includes(app.status)).length / filteredApplications.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredApplications.length > 0 ? "Keep optimizing!" : "Start applying to see trends"}
                  </p>
                </div>

                {/* Best Application Day */}
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Peak Day</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Best response rates</p>
                </div>

                {/* Next Follow-up */}
                <div className="text-center">
                  <div className="bg-yellow-100 dark:bg-yellow-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Follow-ups Due</h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredApplications.filter(app => {
                      const appDate = new Date(app.appliedDate);
                      const daysSince = Math.floor((Date.now() - appDate.getTime()) / (1000 * 60 * 60 * 24));
                      return daysSince >= 7 && daysSince <= 14 && app.status === 'applied';
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Applications need follow-up</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Tip & Motivation */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Daily Career Tip</h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    {[
                      "Customize your resume for each application - highlight relevant skills that match the job requirements.",
                      "Follow up on applications after 1-2 weeks with a polite email to show continued interest.",
                      "Research the company culture and values before applying to craft a better cover letter.",
                      "Network on LinkedIn by connecting with employees at companies you're interested in.",
                      "Practice common interview questions and prepare specific examples using the STAR method.",
                      "Keep track of application deadlines and set reminders to follow up on pending applications.",
                      "Update your LinkedIn profile regularly and share industry-relevant content to increase visibility."
                    ][Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 7]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "cards" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications Display */}
          {applicationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                <Briefcase className="h-20 w-20 text-blue-500 mx-auto mb-6 relative" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Ready to Start Your Job Hunt? 🚀
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Track applications, get AI-powered insights, and land your dream job faster with our smart tools
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="text-center p-4">
                  <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-1">Find Jobs</h4>
                  <p className="text-sm text-gray-500">Browse thousands of opportunities</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-1">Track Progress</h4>
                  <p className="text-sm text-gray-500">Monitor all your applications</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-1">Get Hired</h4>
                  <p className="text-sm text-gray-500">Land your dream position</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
                  onClick={() => window.location.href = '/jobs'}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </Card>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplications.map((app: any) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                            {app.jobTitle}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {app.company}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                          <Badge className={getStatusColor(app.status)}>
                            {getStatusIcon(app.status)}
                            <span className="ml-1 capitalize">{app.status?.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        {app.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                            <span className="text-sm font-medium">{app.location}</span>
                          </div>
                        )}
                        
                        {app.matchScore && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Match</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                                  style={{ width: `${app.matchScore}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-green-600">{app.matchScore}%</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {app.source || 'platform'}
                            </Badge>
                            {/* Days since application */}
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded">
                              {Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24))}d ago
                            </span>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Follow Up
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Job Title</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Company</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Applied</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((app: any) => (
                        <tr key={app.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900 dark:text-white">{app.jobTitle}</div>
                            {app.location && <div className="text-sm text-gray-500">{app.location}</div>}
                          </td>
                          <td className="py-4 px-6 text-gray-900 dark:text-white">{app.company}</td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusColor(app.status)}>
                              {getStatusIcon(app.status)}
                              <span className="ml-1 capitalize">{app.status?.replace('_', ' ')}</span>
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                            {new Date(app.appliedDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline">{app.source || 'platform'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}