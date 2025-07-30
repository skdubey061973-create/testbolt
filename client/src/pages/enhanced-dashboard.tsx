import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Clock, 
  Target,
  Briefcase,
  Zap,
  Crown,
  Plus,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Building,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3,
  MessageCircle,
  Code,
  Brain,
  Trophy,
  ChevronRight,
  PlayCircle,
  Award,
  Rocket,
  Lightbulb,
  BookOpen,
  Mic,
  Video,
  PenTool,
  Globe,
  Flame,
  TrendingDown,
  Copy
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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
      stiffness: 100
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
      stiffness: 400,
      damping: 10
    }
  }
};

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState("");

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth";
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

  const { data: resumes } = useQuery({
    queryKey: ["/api/resumes"],
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: jobPostings } = useQuery({
    queryKey: ["/api/jobs/postings"],
    retry: false,
  });

  const { data: testAssignments } = useQuery({
    queryKey: ["/api/jobseeker/test-assignments"],
    retry: false,
  });

  const { data: rankingTestHistory } = useQuery({
    queryKey: ["/api/ranking-tests/history"],
    retry: false,
  });

  const { data: mockInterviewStats } = useQuery({
    queryKey: ["/api/mock-interview/stats"],
    retry: false,
  });

  const { data: recentJobs } = useQuery({
    queryKey: ["/api/jobs/postings"],
    retry: false,
  });

  const userName = user?.firstName || user?.name || "Job Seeker";
  const isPremium = user?.planType === 'premium';
  const profileCompletion = profile?.profileCompletion || 0;
  const resumeScore = resumes?.[0]?.atsScore || 0;
  const totalApplications = applications?.length || 0;
  const pendingTests = testAssignments?.length || 0;
  const interviewsPending = mockInterviewStats?.totalSessions || 0;

  // Feature cards data
  const featureCards = [
    {
      title: "Smart Job Matching",
      description: "Find perfect jobs with AI matching algorithm that analyzes your skills and preferences",
      icon: Target,
      route: "/jobs",
      stats: `${jobPostings?.length || 0} Jobs Available`,
      gradient: "from-purple-500 to-pink-500",
      action: "Browse Jobs",
      helpText: "AI matches you with jobs based on skills, experience, and career goals - increasing your success rate by 3x"
    },
    {
      title: "Virtual Interviews",
      description: "Practice with AI-powered interviews that adapt to your responses and provide real-time feedback",
      icon: Video,
      route: "/virtual-interview/new",
      stats: `${interviewsPending} Completed`,
      gradient: "from-green-500 to-emerald-500",
      action: "Start Interview",
      helpText: "Practice realistic interviews with AI that simulates real hiring managers - 85% of users improve within 3 sessions"
    },
    {
      title: "Ranking Tests",
      description: "Compete with other candidates in skill-based challenges and showcase your abilities",
      icon: Trophy,
      route: "/ranking-tests",
      stats: `${rankingTestHistory?.length || 0} Completed`,
      gradient: "from-yellow-500 to-orange-500",
      action: "Join Ranking",
      helpText: "Stand out by ranking in top 10% - recruiters actively seek high-performing candidates from our leaderboards"
    },
    {
      title: "Mock Interviews",
      description: "Practice behavioral interviews with personalized feedback and improvement suggestions",
      icon: Mic,
      route: "/mock-interview",
      stats: `${mockInterviewStats?.averageScore || 0}% Avg Score`,
      gradient: "from-indigo-500 to-purple-500",
      action: "Practice Now",
      helpText: "Master behavioral questions with AI feedback - users report 40% better performance in real interviews"
    }
  ];

  const quickActions = [
    {
      title: "Upload Resume",
      description: "Get instant AI analysis",
      icon: Upload,
      action: () => setLocation("/profile"),
      color: "blue"
    },
    {
      title: "Apply to Jobs",
      description: "Browse and apply instantly",
      icon: Briefcase,
      action: () => setLocation("/jobs"),
      color: "green"
    },
    {
      title: "Start Interview",
      description: "Practice with AI interviewer",
      icon: PlayCircle,
      action: () => setLocation("/virtual-interview/new"),
      color: "purple"
    },
    {
      title: "Take Test",
      description: "Complete technical assessment",
      icon: PenTool,
      action: () => setLocation("/job-seeker-tests"),
      color: "orange"
    }
  ];

  const recentApplications = applications?.slice(0, 3) || [];

  // Resume upload handler
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
        
        toast({
          title: "Resume Uploaded Successfully",
          description: `ATS Score: ${result.resume?.atsScore || 'Analyzing...'}% - Your resume has been analyzed and optimized.`,
        });
      } else {
        let errorMessage = "Failed to upload resume";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Cover letter generation handler
  const generateCoverLetter = async (jobDescription: string) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription,
          jobTitle: 'Software Engineer', // Default title
          companyName: 'Target Company', // Default company
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCoverLetterResult(result.coverLetter);
        
        toast({
          title: "Cover Letter Generated",
          description: "Your personalized cover letter is ready",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Generation failed");
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome back, {userName}!
              </h1>
              {isPremium && <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />}
            </div>
            <p className="text-md text-muted-foreground max-w-xl mx-auto">
              Your AI-powered career platform
            </p>
            
            {!isPremium && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto max-w-md"
              >
                <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-full">
                        <Rocket className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                          Unlock Premium Features
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Get unlimited applications, AI interviews & more
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => setLocation("/job-seeker-premium")}
                      >
                        Upgrade
                        <Sparkles className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                    <p className="text-3xl font-bold">{totalApplications}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Profile Score</p>
                    <p className="text-3xl font-bold">{profileCompletion}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">ATS Score</p>
                    <p className="text-3xl font-bold">{resumeScore}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Pending Tests</p>
                    <p className="text-3xl font-bold">{pendingTests}</p>
                  </div>
                  <Code className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="cursor-pointer"
                  onClick={action.action}
                >
                  <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all duration-200">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-${action.color}-100 dark:bg-${action.color}-900 flex items-center justify-center`}>
                        <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                      </div>
                      <h3 className="font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resume Analysis Card */}
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 overflow-hidden relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-5" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    {resumes && resumes.length > 0 && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">AI Resume Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant ATS compatibility scores and personalized improvement suggestions to increase your job application success rate
                  </p>
                  
                  {resumes && resumes.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">ATS Score</span>
                        <span className="text-lg font-bold text-blue-600">{resumeScore}%</span>
                      </div>
                      <Progress value={resumeScore} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Your resume is optimized for Applicant Tracking Systems. 94% of recruiters use ATS to filter candidates.
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setLocation("/profile")}
                      >
                        View Analysis
                        <Eye className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Upload your resume to get instant AI analysis</p>
                      <Button 
                        className="w-full"
                        onClick={() => setLocation("/profile")}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Resume
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Assigned Tests Card */}
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 overflow-hidden relative bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-5" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                      <Code className="w-6 h-6 text-white" />
                    </div>
                    {pendingTests > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        {pendingTests} Pending
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">Assigned Tests</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete technical assessments assigned by recruiters to showcase your skills and advance in the hiring process
                  </p>
                  
                  {pendingTests > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending Tests</span>
                        <span className="text-lg font-bold text-orange-600">{pendingTests}</span>
                      </div>
                      <div className="space-y-2">
                        {testAssignments?.slice(0, 2).map((test: any, index: number) => (
                          <div key={index} className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                            <p className="text-sm font-medium">{test.testType || 'Technical Assessment'}</p>
                            <p className="text-xs text-muted-foreground">{test.jobTitle || 'Job Position'}</p>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setLocation("/job-seeker-tests")}
                      >
                        Take Tests
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Code className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">No assigned tests at the moment</p>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation("/ranking-tests")}
                      >
                        Try Practice Tests
                        <Trophy className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Advanced Features */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Advanced Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="cursor-pointer"
                  onClick={() => setLocation(feature.route)}
                >
                  <Card className="h-full border-0 overflow-hidden relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`} />
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4 italic">{feature.helpText}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">{feature.stats}</span>
                        <Button 
                          size="sm" 
                          className="group"
                        >
                          {feature.action}
                          <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Jobs Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Recent Platform Jobs</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/jobs")}
                  >
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {recentJobs && recentJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentJobs.slice(0, 6).map((job: any) => (
                      <div 
                        key={job.id} 
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border/50 hover:border-purple-200 dark:hover:border-purple-800 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/jobs/${job.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Building className="w-8 h-8 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {job.jobType || 'Full-time'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">{job.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{job.companyName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{job.location || 'Remote'}</span>
                        </div>
                        {job.salaryRange && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <DollarSign className="w-3 h-3" />
                            <span>{job.salaryRange}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs available at the moment</p>
                    <Button onClick={() => setLocation("/jobs")}>
                      Browse All Jobs
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Resume Analysis & AI Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resume Analysis Tab */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Resume Analysis
                  </CardTitle>
                  <p className="text-sm text-green-100">
                    Upload and optimize your resumes with AI-powered ATS scoring
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Resumes uploaded:</span>
                    <span className="font-medium">
                      {resumes?.length || 0}/{user?.planType === 'premium' ? '∞' : '2'}
                    </span>
                  </div>
                  
                  {(resumes?.length || 0) < (user?.planType === 'premium' ? 999 : 2) ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleResumeUpload(file);
                          }
                        }}
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder:text-white/70 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/30 file:text-white"
                        disabled={isUploadingResume}
                      />
                      {isUploadingResume && (
                        <div className="mt-2 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white mx-auto"></div>
                          <p className="text-xs mt-1 text-green-100">Analyzing resume...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-green-100 mb-2">
                        {user?.planType === 'premium' ? 'Unlimited uploads available' : 'Upload limit reached'}
                      </p>
                      {user?.planType !== 'premium' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => setLocation("/job-seeker-premium")}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade for Unlimited
                        </Button>
                      )}
                    </div>
                  )}

                  {resumes && resumes.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Latest Resume Analysis:</div>
                      <div className="bg-white/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate">{resumes[0]?.name || 'Resume'}</span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              (resumes[0]?.atsScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                              (resumes[0]?.atsScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            ATS: {resumes[0]?.atsScore || 'N/A'}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-green-200">
                              {resumes[0]?.analysis?.content?.strengthsFound?.length || 0}
                            </div>
                            <div>Strengths</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-200">
                              {resumes[0]?.analysis?.recommendations?.length || 0}
                            </div>
                            <div>Tips</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-200">
                              {resumes[0]?.analysis?.keywordOptimization?.missingKeywords?.length || 0}
                            </div>
                            <div>Missing</div>
                          </div>
                        </div>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => setLocation("/resumes")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Analysis
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Cover Letter Generator */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cover Letter Generator
                  </CardTitle>
                  <p className="text-sm text-blue-100">
                    Generate personalized cover letters with AI
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <textarea
                      placeholder="Paste the job description here..."
                      className="w-full p-3 rounded bg-white/20 border border-white/30 text-white placeholder:text-white/70 min-h-[100px] resize-none"
                      id="job-description-input"
                    />
                    <Button
                      variant="secondary"
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => {
                        const jobDesc = (document.getElementById('job-description-input') as HTMLTextAreaElement)?.value;
                        if (jobDesc.trim()) {
                          generateCoverLetter(jobDesc);
                        } else {
                          toast({
                            title: "Job Description Required",
                            description: "Please paste a job description first",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Cover Letter
                        </>
                      )}
                    </Button>
                  </div>

                  {coverLetterResult && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Generated Cover Letter:</div>
                      <div className="bg-white/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans">
                          {coverLetterResult}
                        </pre>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={() => {
                          navigator.clipboard.writeText(coverLetterResult);
                          toast({
                            title: "Copied to Clipboard",
                            description: "Cover letter copied successfully",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Premium CTA (if not premium) */}
          {!isPremium && (
            <motion.div variants={itemVariants}>
              <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-950 dark:via-orange-950 dark:to-pink-950">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      Unlock Your Full Potential
                    </h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Join thousands of successful job seekers who landed their dream jobs with our premium features.
                    Get unlimited applications, AI interviews, and priority support.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                        <Flame className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h4 className="font-semibold">Unlimited Applications</h4>
                      <p className="text-sm text-muted-foreground">Apply to as many jobs as you want</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Video className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold">AI Virtual Interviews</h4>
                      <p className="text-sm text-muted-foreground">Practice with advanced AI interviewer</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold">Priority Rankings</h4>
                      <p className="text-sm text-muted-foreground">Get featured in ranking tests</p>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8"
                    onClick={() => setLocation("/job-seeker-premium")}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}