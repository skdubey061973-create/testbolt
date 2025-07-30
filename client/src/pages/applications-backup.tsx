import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PremiumGate from "@/components/PremiumGate";
import { useUsageEnforcement } from "@/hooks/useUsageEnforcement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  Briefcase,
  ExternalLink,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Star,
  Building,
  Users,
  Timer,
  Send,
  Award,
  Activity,
  Grid3X3,
  List,
  Layers,
  SortAsc,
  SortDesc,
  MousePointer,
  Sparkles,
  TrendingDownIcon
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

const listItemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export default function Applications() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "kanban">("cards");
  const [compactView, setCompactView] = useState(false);
  
  // Add saved jobs query
  const { data: savedJobs, isLoading: savedJobsLoading } = useQuery({
    queryKey: ["/api/saved-jobs"],
    enabled: isAuthenticated,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [newApplication, setNewApplication] = useState({
    company: "",
    jobTitle: "",
    jobUrl: "",
    location: "",
    workMode: "",
    salaryRange: "",
    status: "applied",
    appliedDate: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/applications/stats"],
    retry: false,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    retry: false,
  });

  const { data: jobAnalyses } = useQuery({
    queryKey: ["/api/jobs/analyses"],
    retry: false,
  });

  // Add application mutation
  const addApplicationMutation = useMutation({
    mutationFn: async (applicationData: any) => {
      const response = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify(applicationData),
      });
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to add application");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/stats"] });
      setShowAddDialog(false);
      setNewApplication({
        company: "",
        jobTitle: "",
        jobUrl: "",
        location: "",
        workMode: "",
        salaryRange: "",
        status: "applied",
        appliedDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
      toast({
        title: "Application Added",
        description: "Your job application has been tracked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add application",
        variant: "destructive",
      });
    }
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to update application");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/stats"] });
      setShowEditDialog(false);
      setEditingApplication(null);
      toast({
        title: "Application Updated",
        description: "Your application has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    }
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/applications/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to delete application");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/stats"] });
      toast({
        title: "Application Deleted",
        description: "Your application has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive",
      });
    }
  });

  // Combine applications and saved jobs with enhanced data
  const allJobs = [
    ...(applications || []).map((app: any) => ({
      ...app,
      source: app.source || 'platform',
      daysAgo: Math.floor((Date.now() - new Date(app.appliedDate || app.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      priority: app.status === 'interview' ? 'high' : app.status === 'under_review' ? 'medium' : 'normal'
    })),
    ...(savedJobs || []).map((job: any) => ({ 
      ...job, 
      source: 'extension',
      daysAgo: Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      priority: 'normal'
    }))
  ];

  // Enhanced filtering and sorting
  const filteredApplications = allJobs?.filter((app: any) => {
    const matchesSearch = 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSource = sourceFilter === "all" || app.source === sourceFilter;
    
    // Tab filtering
    if (activeTab === "applied") {
      return app.status !== "saved" && matchesSearch && matchesStatus && matchesSource;
    } else if (activeTab === "saved") {
      return app.status === "saved" && matchesSearch && matchesStatus && matchesSource;
    }
    
    return matchesSearch && matchesStatus && matchesSource;
  })?.sort((a: any, b: any) => {
    const direction = sortOrder === "asc" ? 1 : -1;
    switch (sortBy) {
      case "date":
        return direction * (new Date(b.appliedDate || b.createdAt).getTime() - new Date(a.appliedDate || a.createdAt).getTime());
      case "company":
        return direction * a.company.localeCompare(b.company);
      case "status":
        return direction * a.status.localeCompare(b.status);
      case "match":
        return direction * ((b.matchScore || 0) - (a.matchScore || 0));
      case "priority":
        const priorityOrder = { high: 3, medium: 2, normal: 1 };
        return direction * ((priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
      default:
        return 0;
    }
  }) || [];

  // Application statistics
  const applicationStats = {
    total: allJobs?.length || 0,
    applied: allJobs?.filter(app => app.status !== 'saved').length || 0,
    saved: savedJobs?.length || 0,
    interviews: allJobs?.filter(app => app.status === 'interview').length || 0,
    offers: allJobs?.filter(app => app.status === 'offer').length || 0,
    rejected: allJobs?.filter(app => app.status === 'rejected').length || 0,
    pending: allJobs?.filter(app => app.status === 'under_review' || app.status === 'applied').length || 0,
    avgMatchScore: Math.round(allJobs?.reduce((acc, app) => acc + (app.matchScore || 0), 0) / (allJobs?.length || 1)),
    responseRate: Math.round(allJobs?.filter(app => app.status !== 'applied' && app.status !== 'saved').length / Math.max(allJobs?.filter(app => app.status !== 'saved').length, 1) * 100),
    thisWeek: allJobs?.filter(app => app.daysAgo <= 7).length || 0,
    thisMonth: allJobs?.filter(app => app.daysAgo <= 30).length || 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "interview": case "interviewed": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "offered": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied": return <Clock className="h-3 w-3" />;
      case "interview": case "interviewed": return <Users className="h-3 w-3" />;
      case "rejected": return <XCircle className="h-3 w-3" />;
      case "offered": return <Award className="h-3 w-3" />;
      case "pending": return <Timer className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <PremiumGate feature="job_applications" blockOnLimit={true}>
        <motion.div
          className="container mx-auto px-4 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          variants={itemVariants}
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
                queryClient.invalidateQueries({ queryKey: ["/api/applications/stats"] });
                queryClient.invalidateQueries({ queryKey: ["/api/saved-jobs"] });
                toast({
                  title: "Synced",
                  description: "Application data refreshed from both platform and extension.",
                });
              }}
              disabled={applicationsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${applicationsLoading ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Application
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
          variants={itemVariants}
        >
          {[
            {
              title: "Total Applications",
              value: applicationStats.total,
              icon: Briefcase,
              color: "blue",
              trend: `+${applicationStats.thisWeek}`,
              description: "This week"
            },
            {
              title: "Applied Jobs",
              value: applicationStats.applied,
              icon: Send,
              color: "green",
              trend: `${applicationStats.responseRate}%`,
              description: "Response rate"
            },
            {
              title: "Saved Jobs",
              value: applicationStats.saved,
              icon: Star,
              color: "yellow",
              trend: `+${applicationStats.thisMonth}`,
              description: "This month"
            },
            {
              title: "Interviews",
              value: applicationStats.interviews,
              icon: Users,
              color: "purple",
              trend: `${applicationStats.offers}`,
              description: "Offers received"
            },
            {
              title: "Avg Match Score",
              value: `${applicationStats.avgMatchScore}%`,
              icon: Target,
              color: "orange",
              trend: `${applicationStats.pending}`,
              description: "Pending review"
            },
            {
              title: "Success Rate",
              value: `${Math.round((applicationStats.interviews + applicationStats.offers) / Math.max(applicationStats.applied, 1) * 100)}%`,
              icon: Award,
              color: "emerald",
              trend: `${applicationStats.rejected}`,
              description: "Rejected"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="relative"
            >
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div variants={itemVariants}>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  All ({allJobs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="applied" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Applied ({allJobs?.filter(app => app.status !== 'saved').length || 0})
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Saved ({savedJobs?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Enhanced Controls */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "kanban" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                    className="h-8 px-3"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Controls */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="match">Match Score</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="h-8 px-3"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>

                {/* Compact View Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactView(!compactView)}
                  className="h-8 px-3"
                >
                  {compactView ? "Expanded" : "Compact"}
                </Button>
              </div>
            </div>
          </motion.div>

          <TabsContent value="all" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
              variants={itemVariants}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search jobs, companies, or locations..."
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
                      <SelectItem value="saved">Saved</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="workday">Workday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Applications Display */}
            <AnimatePresence mode="wait">
              {filteredApplications.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {searchTerm ? 
                      `No applications match your search "${searchTerm}". Try adjusting your filters or search terms.` :
                      "Start tracking your job applications by adding them manually or saving jobs through our Chrome extension."
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Application
                    </Button>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="applications"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {viewMode === "cards" && (
                    <ApplicationCardsView 
                      applications={filteredApplications}
                      compactView={compactView}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                  {viewMode === "table" && (
                    <ApplicationTableView 
                      applications={filteredApplications}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                  {viewMode === "kanban" && (
                    <ApplicationKanbanView 
                      applications={filteredApplications}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
              {/* Application Pipeline */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                className="lg:col-span-2"
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Application Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { 
                          status: "applied", 
                          label: "Applied", 
                          count: filteredApplications.filter(app => app.status === "applied").length, 
                          color: "blue",
                          bgColor: "bg-blue-500",
                          lightBg: "bg-blue-50 dark:bg-blue-900/20",
                          textColor: "text-blue-600 dark:text-blue-400",
                          icon: <Clock className="h-4 w-4" />
                        },
                        { 
                          status: "interview", 
                          label: "Interview", 
                          count: filteredApplications.filter(app => app.status === "interview" || app.status === "interviewed").length, 
                          color: "green",
                          bgColor: "bg-green-500",
                          lightBg: "bg-green-50 dark:bg-green-900/20",
                          textColor: "text-green-600 dark:text-green-400",
                          icon: <Users className="h-4 w-4" />
                        },
                        { 
                          status: "offered", 
                          label: "Offered", 
                          count: filteredApplications.filter(app => app.status === "offered").length, 
                          color: "purple",
                          bgColor: "bg-purple-500",
                          lightBg: "bg-purple-50 dark:bg-purple-900/20",
                          textColor: "text-purple-600 dark:text-purple-400",
                          icon: <Award className="h-4 w-4" />
                        },
                        { 
                          status: "rejected", 
                          label: "Rejected", 
                          count: filteredApplications.filter(app => app.status === "rejected").length, 
                          color: "red",
                          bgColor: "bg-red-500",
                          lightBg: "bg-red-50 dark:bg-red-900/20",
                          textColor: "text-red-600 dark:text-red-400",
                          icon: <XCircle className="h-4 w-4" />
                        }
                      ].map((stage) => (
                        <motion.div 
                          key={stage.status} 
                          className={`flex items-center justify-between p-4 rounded-xl ${stage.lightBg} border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer`}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setStatusFilter(stage.status)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${stage.bgColor} flex items-center justify-center text-white`}>
                              {stage.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{stage.label}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {stage.count} application{stage.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${stage.textColor}`}>
                              {stage.count}
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Pipeline Progress Bar */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pipeline Progress</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {filteredApplications.length === 0 ? 0 : Math.round((filteredApplications.filter(app => app.status === "interview" || app.status === "interviewed" || app.status === "offered").length / filteredApplications.length) * 100)}% success rate
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${filteredApplications.length === 0 ? 0 : Math.round((filteredApplications.filter(app => app.status === "interview" || app.status === "interviewed" || app.status === "offered").length / filteredApplications.length) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Source Breakdown */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Platform: {filteredApplications.filter(app => app.source === 'platform' || !app.source).length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Extension: {filteredApplications.filter(app => app.source === 'extension').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredApplications.slice(0, 5).map((app: any, index: number) => (
                        <motion.div
                          key={app.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {getStatusIcon(app.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                            <p className="text-xs text-gray-500">{app.company}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(app.appliedDate).toLocaleDateString()}
                          </span>
                        </motion.div>
                      ))}
                      {filteredApplications.length === 0 && (
                        <div className="text-center py-6">
                          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">No applications yet</p>
                          <p className="text-xs text-gray-400">Start tracking your job applications</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            {/* Applied Jobs Tab Content */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
              variants={itemVariants}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search applied jobs..."
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
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {filteredApplications.filter(app => app.status !== 'saved').length === 0 ? (
                <motion.div
                  key="empty-applied"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No applications submitted yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Start applying to jobs and track your progress here. Your submitted applications will appear in this tab.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="applied-jobs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {viewMode === "cards" && (
                    <ApplicationCardsView 
                      applications={filteredApplications.filter(app => app.status !== 'saved')}
                      compactView={compactView}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                  {viewMode === "table" && (
                    <ApplicationTableView 
                      applications={filteredApplications.filter(app => app.status !== 'saved')}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                  {viewMode === "kanban" && (
                    <ApplicationKanbanView 
                      applications={filteredApplications.filter(app => app.status !== 'saved')}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {/* Saved Jobs Tab Content */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
              variants={itemVariants}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search saved jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="workday">Workday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {savedJobs?.length === 0 ? (
                <motion.div
                  key="empty-saved"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No saved jobs yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Use our Chrome extension to save interesting jobs for later. Saved jobs will appear here for easy access and organization.
                  </p>
                  <Button variant="outline" onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Get Chrome Extension
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="saved-jobs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {viewMode === "cards" && (
                    <ApplicationCardsView 
                      applications={filteredApplications.filter(app => app.status === 'saved')}
                      compactView={compactView}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                  {viewMode === "table" && (
                    <ApplicationTableView 
                      applications={filteredApplications.filter(app => app.status === 'saved')}
                      onEdit={setEditingApplication}
                      onDelete={(id) => deleteApplicationMutation.mutate(id)}
                    />
                  )}
                  {viewMode === "kanban" && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Kanban view is not available for saved jobs. Use Cards or Table view instead.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {/* Filters and Controls */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              variants={itemVariants}
            >
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="extension">Extension</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Applied</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="match">Match Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                >
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  Table
                </Button>
              </div>
            </motion.div>

            {/* Applications Display */}
            <motion.div variants={itemVariants}>
              {applicationsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredApplications.map((app: any, index: number) => (
                      <motion.div
                        key={app.id}
                        layout
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="group"
                      >
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {app.jobTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                                  <Building className="h-3 w-3" />
                                  {app.company}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingApplication(app);
                                    setShowEditDialog(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => deleteApplicationMutation.mutate(app.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                              {app.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <MapPin className="h-3 w-3" />
                                  <span>{app.location}</span>
                                </div>
                              )}
                              {app.salaryRange && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <DollarSign className="h-3 w-3" />
                                  <span>{app.salaryRange}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Status and Match Score */}
                            <div className="flex items-center justify-between">
                              <Badge className={`${getStatusColor(app.status)} border-0 flex items-center gap-1`}>
                                {getStatusIcon(app.status)}
                                <span className="capitalize">{app.status}</span>
                              </Badge>
                              
                              {app.matchScore && (
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3 text-gray-400" />
                                  <span className={`text-sm font-medium ${getMatchScoreColor(app.matchScore)}`}>
                                    {app.matchScore}%
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Source Badge */}
                            <div className="mt-3 flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {app.source === "platform" ? (
                                  <><Building className="h-2 w-2 mr-1" /> Platform</>
                                ) : (
                                  <><Globe className="h-2 w-2 mr-1" /> Extension</>
                                )}
                              </Badge>
                              
                              {app.jobUrl && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                // Table View
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Position</th>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Company</th>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Status</th>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Match</th>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Applied</th>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Source</th>
                            <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {filteredApplications.map((app: any, index: number) => (
                              <motion.tr
                                key={app.id}
                                variants={listItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ delay: index * 0.02 }}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <td className="p-4">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{app.jobTitle}</p>
                                    {app.location && (
                                      <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {app.location}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="text-gray-900 dark:text-white">{app.company}</p>
                                </td>
                                <td className="p-4">
                                  <Badge className={`${getStatusColor(app.status)} border-0 flex items-center gap-1 w-fit`}>
                                    {getStatusIcon(app.status)}
                                    <span className="capitalize">{app.status}</span>
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  {app.matchScore ? (
                                    <span className={`font-medium ${getMatchScoreColor(app.matchScore)}`}>
                                      {app.matchScore}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                  {new Date(app.appliedDate).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <Badge variant="outline" className="text-xs">
                                    {app.source === "platform" ? (
                                      <><Building className="h-2 w-2 mr-1" /> Platform</>
                                    ) : (
                                      <><Globe className="h-2 w-2 mr-1" /> Extension</>
                                    )}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => {
                                      setEditingApplication(app);
                                      setShowEditDialog(true);
                                    }}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    {app.jobUrl && (
                                      <Button size="sm" variant="ghost" asChild>
                                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => deleteApplicationMutation.mutate(app.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                      
                      {filteredApplications.length === 0 && (
                        <div className="text-center py-12">
                          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications found</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {searchTerm || statusFilter !== "all" || sourceFilter !== "all" 
                              ? "Try adjusting your filters" 
                              : "Start tracking your job applications"}
                          </p>
                          <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Application
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              variants={itemVariants}
            >
              {/* Application Trends */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Application Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">This Week</span>
                        <span className="font-medium">{filteredApplications.filter(app => {
                          const appDate = new Date(app.appliedDate);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return appDate >= weekAgo;
                        }).length} applications</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">This Month</span>
                        <span className="font-medium">{filteredApplications.filter(app => {
                          const appDate = new Date(app.appliedDate);
                          const monthAgo = new Date();
                          monthAgo.setMonth(monthAgo.getMonth() - 1);
                          return appDate >= monthAgo;
                        }).length} applications</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Average per Week</span>
                        <span className="font-medium">{Math.round((filteredApplications.length / 4) * 10) / 10}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Success Metrics */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Interview Rate</span>
                          <span className="font-medium">{stats?.responseRate || 0}%</span>
                        </div>
                        <Progress value={stats?.responseRate || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Avg Match Score</span>
                          <span className="font-medium">{stats?.avgMatchScore || 0}%</span>
                        </div>
                        <Progress value={stats?.avgMatchScore || 0} className="h-2" />
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Top Performing Company</span>
                          <span className="font-medium text-xs">
                            {applications?.length > 0 
                              ? applications.reduce((acc: any, app: any) => {
                                  acc[app.company] = (acc[app.company] || 0) + 1;
                                  return acc;
                                }, {})?.[Object.keys(applications.reduce((acc: any, app: any) => {
                                  acc[app.company] = (acc[app.company] || 0) + 1;
                                  return acc;
                                }, {})).reduce((a, b) => applications.reduce((acc: any, app: any) => {
                                  acc[app.company] = (acc[app.company] || 0) + 1;
                                  return acc;
                                }, {})[a] > applications.reduce((acc: any, app: any) => {
                                  acc[app.company] = (acc[app.company] || 0) + 1;
                                  return acc;
                                }, {})[b] ? a : b)] || "None yet"
                              : "None yet"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </PremiumGate>

      {/* Add Application Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Add New Application
            </DialogTitle>
            <DialogDescription>
              Track a new job application in your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={newApplication.jobTitle}
                onChange={(e) => setNewApplication({...newApplication, jobTitle: e.target.value})}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={newApplication.company}
                onChange={(e) => setNewApplication({...newApplication, company: e.target.value})}
                placeholder="e.g. TechCorp Inc"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newApplication.location}
                onChange={(e) => setNewApplication({...newApplication, location: e.target.value})}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <Label htmlFor="workMode">Work Mode</Label>
              <Select value={newApplication.workMode} onValueChange={(value) => setNewApplication({...newApplication, workMode: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salaryRange">Salary Range</Label>
              <Input
                id="salaryRange"
                value={newApplication.salaryRange}
                onChange={(e) => setNewApplication({...newApplication, salaryRange: e.target.value})}
                placeholder="e.g. $80k - $120k"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newApplication.status} onValueChange={(value) => setNewApplication({...newApplication, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="jobUrl">Job URL</Label>
              <Input
                id="jobUrl"
                value={newApplication.jobUrl}
                onChange={(e) => setNewApplication({...newApplication, jobUrl: e.target.value})}
                placeholder="https://company.com/careers/position"
              />
            </div>
            <div>
              <Label htmlFor="appliedDate">Applied Date</Label>
              <Input
                id="appliedDate"
                type="date"
                value={newApplication.appliedDate}
                onChange={(e) => setNewApplication({...newApplication, appliedDate: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newApplication.notes}
                onChange={(e) => setNewApplication({...newApplication, notes: e.target.value})}
                placeholder="Any additional notes about this application..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addApplicationMutation.mutate(newApplication)}
              disabled={addApplicationMutation.isPending || !newApplication.jobTitle || !newApplication.company}
            >
              {addApplicationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Edit Application
            </DialogTitle>
            <DialogDescription>
              Update your application details
            </DialogDescription>
          </DialogHeader>
          
          {editingApplication && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editJobTitle">Job Title</Label>
                <Input
                  id="editJobTitle"
                  value={editingApplication.jobTitle}
                  onChange={(e) => setEditingApplication({...editingApplication, jobTitle: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editCompany">Company</Label>
                <Input
                  id="editCompany"
                  value={editingApplication.company}
                  onChange={(e) => setEditingApplication({...editingApplication, company: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editingApplication.status} onValueChange={(value) => setEditingApplication({...editingApplication, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={editingApplication.location || ""}
                  onChange={(e) => setEditingApplication({...editingApplication, location: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editingApplication.notes || ""}
                  onChange={(e) => setEditingApplication({...editingApplication, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingApplication) {
                  updateApplicationMutation.mutate({
                    id: editingApplication.id,
                    data: {
                      jobTitle: editingApplication.jobTitle,
                      company: editingApplication.company,
                      status: editingApplication.status,
                      location: editingApplication.location,
                      notes: editingApplication.notes
                    }
                  });
                }
              }}
              disabled={updateApplicationMutation.isPending}
            >
              {updateApplicationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Enhanced Application Views Components
const ApplicationCardsView = ({ applications, compactView, onEdit, onDelete }: any) => {
  return (
    <div className={`grid gap-6 ${compactView ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {applications.map((app: any, index: number) => (
        <motion.div
          key={app.id}
          variants={listItemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm group-hover:scale-[1.02]">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {app.jobTitle}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {app.company}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(app)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(app.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status and Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(app.status)} variant="secondary">
                    {getStatusIcon(app.status)}
                    <span className="ml-1 capitalize">{app.status}</span>
                  </Badge>
                  {app.matchScore && (
                    <span className={`font-semibold ${getMatchScoreColor(app.matchScore)}`}>
                      {app.matchScore}% match
                    </span>
                  )}
                </div>

                {app.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{app.location}</span>
                  </div>
                )}

                {app.salaryRange && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    <span>{app.salaryRange}</span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{app.daysAgo === 0 ? 'Today' : `${app.daysAgo} days ago`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {app.source || 'platform'}
                  </Badge>
                  {app.jobUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(app.jobUrl, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

const ApplicationTableView = ({ applications, onEdit, onDelete }: any) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Job Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Match
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {applications.map((app: any) => (
              <motion.tr
                key={app.id}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {app.jobTitle}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {app.company}
                    </div>
                    {app.location && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {app.location}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={getStatusColor(app.status)} variant="secondary">
                    {getStatusIcon(app.status)}
                    <span className="ml-1 capitalize">{app.status}</span>
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {app.matchScore ? (
                    <span className={`font-semibold ${getMatchScoreColor(app.matchScore)}`}>
                      {app.matchScore}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {app.daysAgo === 0 ? 'Today' : `${app.daysAgo} days ago`}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="text-xs">
                    {app.source || 'platform'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {app.jobUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(app.jobUrl, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(app)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(app.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ApplicationKanbanView = ({ applications, onEdit, onDelete }: any) => {
  const statusColumns = [
    { id: 'saved', title: 'Saved', color: 'yellow' },
    { id: 'applied', title: 'Applied', color: 'blue' },
    { id: 'under_review', title: 'Under Review', color: 'orange' },
    { id: 'interview', title: 'Interview', color: 'purple' },
    { id: 'offer', title: 'Offer', color: 'green' },
    { id: 'rejected', title: 'Rejected', color: 'red' }
  ];

  const getApplicationsByStatus = (status: string) => {
    return applications.filter((app: any) => app.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 min-h-[600px]">
      {statusColumns.map((column) => (
        <div key={column.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {column.title}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {getApplicationsByStatus(column.id).length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {getApplicationsByStatus(column.id).map((app: any) => (
              <motion.div
                key={app.id}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                    {app.jobTitle}
                  </h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(app)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(app.id)}
                      className="h-6 w-6 p-0 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {app.company}
                </p>
                
                {app.matchScore && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full bg-${column.color}-500`} />
                    <span className={`text-xs font-medium ${getMatchScoreColor(app.matchScore)}`}>
                      {app.matchScore}% match
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{app.daysAgo === 0 ? 'Today' : `${app.daysAgo}d ago`}</span>
                  <Badge variant="outline" className="text-xs">
                    {app.source || 'platform'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};