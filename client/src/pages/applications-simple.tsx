import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PremiumGate from "@/components/PremiumGate";
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
  BarChart3
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
      
      <PremiumGate feature="job_applications" blockOnLimit={true}>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.length}
                    </p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.filter((app: any) => app.status === 'under_review').length}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interviews</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.filter((app: any) => app.status === 'interview').length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.length > 0 
                        ? Math.round((filteredApplications.filter((app: any) => app.status === 'offered').length / filteredApplications.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

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
            <Card className="p-12 text-center">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Applications Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start tracking your job applications to see them here
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Add First Application
              </Button>
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
                            <span className="text-sm font-medium text-green-600">{app.matchScore}%</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {app.source || 'platform'}
                          </Badge>
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
      </PremiumGate>
    </div>
  );
}