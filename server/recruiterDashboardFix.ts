import { storage } from "./storage.js";

// Fix recruiter dashboard data loading issues
export class RecruiterDashboardFix {
  
  // Ensure recruiter has sample data to show in dashboard
  async ensureRecruiterHasBasicData(recruiterId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(recruiterId);
      if (!user || user.userType !== 'recruiter') {
        return false;
      }

      // Check if recruiter has any job postings
      const jobPostings = await storage.getJobPostings(recruiterId);
      console.log(`Recruiter ${recruiterId} has ${jobPostings.length} job postings`);

      // Check if recruiter has any applications  
      const applications = await storage.getApplicationsForRecruiter(recruiterId);
      console.log(`Recruiter ${recruiterId} has ${applications.length} applications`);

      return true;
    } catch (error) {
      console.error('Error checking recruiter data:', error);
      return false;
    }
  }

  // Create sample job posting for new recruiter
  async createSampleJobPosting(recruiterId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(recruiterId);
      if (!user || user.userType !== 'recruiter') {
        return false;
      }

      const sampleJob = {
        title: "Senior Software Engineer",
        companyName: user.companyName || "Your Company",
        location: "Remote",
        description: "We are looking for a talented Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software solutions.",
        requirements: "- 5+ years of software development experience\n- Proficiency in JavaScript/TypeScript\n- Experience with React and Node.js\n- Strong problem-solving skills",
        benefits: "- Competitive salary\n- Remote work flexibility\n- Health insurance\n- Professional development opportunities",
        salaryMin: 80000,
        salaryMax: 120000,
        jobType: "full-time",
        workMode: "remote",
        recruiterId: recruiterId,
        isActive: true,
        applicationsCount: 0,
        viewsCount: 0
      };

      const createdJob = await storage.createJobPosting(sampleJob);
      console.log(`Created sample job posting for recruiter ${recruiterId}:`, createdJob.id);
      return true;
    } catch (error) {
      console.error('Error creating sample job posting:', error);
      return false;
    }
  }
}

export const recruiterDashboardFix = new RecruiterDashboardFix();