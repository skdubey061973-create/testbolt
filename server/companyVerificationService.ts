import { db } from "./db.js";
import { companyEmailVerifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from './emailService.js';

export class CompanyVerificationService {
  
  // Send company verification email (separate from regular email verification)
  async sendCompanyVerificationEmail(email: string, companyName: string, companyWebsite?: string) {
    try {
      const verificationToken = `company_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Create company verification record
      await db.insert(companyEmailVerifications).values({
        userId: `temp_${Date.now()}`, // Temporary until we match with user
        email,
        companyName,
        companyWebsite,
        verificationToken,
        isVerified: false,
        expiresAt,
      });

      // Send company-specific verification email
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/auth/verify-company-email?token=${verificationToken}`;
      
      const emailHtml = this.generateCompanyVerificationEmail(verificationUrl, companyName);
      
      const emailSent = await sendEmail({
        to: email,
        subject: `Verify your company email for ${companyName} - AutoJobr Recruiter Access`,
        html: emailHtml,
      });

      return { success: emailSent, token: verificationToken };
    } catch (error) {
      console.error('Error sending company verification email:', error);
      throw error;
    }
  }

  // Generate company-specific verification email template
  private generateCompanyVerificationEmail(verificationUrl: string, companyName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Company Email - AutoJobr</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .company-badge { background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Company Email Verification</h1>
            <p>Activate your AutoJobr Recruiter Account</p>
          </div>
          <div class="content">
            <div class="company-badge">
              <h3>📋 ${companyName}</h3>
              <p><strong>Recruiter Account Verification</strong></p>
            </div>
            
            <h2>Welcome to AutoJobr!</h2>
            <p>You're almost ready to start recruiting top talent. Please verify your company email address to activate your recruiter account.</p>
            
            <h3>What happens after verification:</h3>
            <ul>
              <li>✅ Your account will be upgraded to <strong>Recruiter</strong> status</li>
              <li>🎯 Access to post unlimited job openings</li>
              <li>👥 Candidate management dashboard</li>
              <li>📊 Advanced recruitment analytics</li>
              <li>🤖 AI-powered candidate matching</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                🔗 Verify Company Email
              </a>
            </div>
            
            <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
            
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${verificationUrl}
            </p>
          </div>
          <div class="footer">
            <p>This email was sent by AutoJobr - AI-Powered Recruitment Platform</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Check if company domain suggests it's a business email
  isBusinessEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'icloud.com', 'aol.com', 'protonmail.com', 'mail.com'
    ];
    return domain && !personalDomains.includes(domain);
  }

  // Auto-detect if user should be a recruiter based on email domain
  async autoDetectRecruiterUpgrade(userId: string, email: string): Promise<boolean> {
    if (this.isBusinessEmail(email)) {
      const domain = email.split('@')[1];
      const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      
      // Send company verification email automatically
      try {
        await this.sendCompanyVerificationEmail(email, `${companyName} Company`, `https://${domain}`);
        return true;
      } catch (error) {
        console.error('Auto company verification failed:', error);
        return false;
      }
    }
    return false;
  }
}

export const companyVerificationService = new CompanyVerificationService();