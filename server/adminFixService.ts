import { db } from "./db.js";
import { users, companyEmailVerifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage.js";

export class AdminFixService {
  
  // Fix user type issues for current user
  async fixCurrentUserToRecruiter(userEmail: string): Promise<boolean> {
    try {
      // Get user from database
      const existingUser = await storage.getUserByEmail(userEmail);
      if (!existingUser) {
        console.error('User not found:', userEmail);
        return false;
      }

      // Update user to recruiter
      await storage.upsertUser({
        ...existingUser,
        userType: "recruiter",
        emailVerified: true,
        companyName: existingUser.companyName || "Cyclelove Company",
        availableRoles: "job_seeker,recruiter",
        // currentRole will be automatically set to match userType
      });

      // Create company verification record if not exists
      try {
        await db.insert(companyEmailVerifications).values({
          userId: existingUser.id,
          email: existingUser.email,
          companyName: existingUser.companyName || "Cyclelove Company",
          companyWebsite: `https://${existingUser.email.split('@')[1]}`,
          verificationToken: `admin-fix-${Date.now()}`,
          isVerified: true,
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      } catch (insertError) {
        // Record might exist, that's okay
        console.log('Company verification record already exists');
      }

      console.log(`✅ Successfully upgraded ${userEmail} to recruiter status`);
      return true;
    } catch (error) {
      console.error('Error fixing user type:', error);
      return false;
    }
  }

  // Emergency endpoint to fix session issues
  async refreshUserSession(req: any, userEmail: string): Promise<boolean> {
    try {
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return false;
      }

      // Update session
      req.session.user = {
        id: user.id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName
      };

      // Save session
      return new Promise((resolve) => {
        req.session.save((err: any) => {
          if (err) {
            console.error('Session save error:', err);
            resolve(false);
          } else {
            console.log('✅ Session refreshed successfully');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }
}

export const adminFixService = new AdminFixService();