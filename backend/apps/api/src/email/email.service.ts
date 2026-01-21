import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    // Configure nodemailer transporter
    // For local dev, uses Supabase's Inbucket (localhost:54325)
    // For production, uses configured SMTP credentials
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 54325),
      secure: false, // Inbucket doesn't use TLS
      // Skip auth for local Inbucket
      ...(this.configService.get<string>('SMTP_USER')
        ? {
            auth: {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            },
          }
        : {}),
    });
  }

  /**
   * Send a group invite email to a recipient
   */
  async sendInviteEmail(params: {
    to: string;
    groupName: string;
    inviterName: string;
    inviteLink: string;
  }): Promise<void> {
    const { to, groupName, inviterName, inviteLink } = params;
    const fromAddress = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@broseph.local',
    );

    await this.transporter.sendMail({
      from: `"Broseph" <${fromAddress}>`,
      to,
      subject: `You're invited to join ${groupName}!`,
      html: this.buildInviteEmailHtml({ groupName, inviterName, inviteLink }),
      text: this.buildInviteEmailText({ groupName, inviterName, inviteLink }),
    });
  }

  private buildInviteEmailHtml(params: {
    groupName: string;
    inviterName: string;
    inviteLink: string;
  }): string {
    const { groupName, inviterName, inviteLink } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0;">Broseph</h1>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
    <h2 style="margin-top: 0; color: #1e293b;">You're invited to join ${groupName}!</h2>

    <p style="color: #64748b; margin-bottom: 25px;">
      ${inviterName} has invited you to join their group on Broseph.
    </p>

    <a href="${inviteLink}"
       style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
      Join ${groupName}
    </a>

    <p style="color: #94a3b8; font-size: 14px; margin-top: 25px;">
      This invite expires in 7 days.
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
    <p>If you didn't expect this invite, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  private buildInviteEmailText(params: {
    groupName: string;
    inviterName: string;
    inviteLink: string;
  }): string {
    const { groupName, inviterName, inviteLink } = params;

    return `
You're invited to join ${groupName}!

${inviterName} has invited you to join their group on Broseph.

Click here to join: ${inviteLink}

This invite expires in 7 days.

If you didn't expect this invite, you can safely ignore this email.
    `.trim();
  }

  /**
   * Send a signup confirmation email with magic link
   */
  async sendSignupEmail(params: {
    to: string;
    magicLink: string;
  }): Promise<void> {
    const { to, magicLink } = params;
    const fromAddress = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@broseph.local',
    );

    await this.transporter.sendMail({
      from: `"Broseph" <${fromAddress}>`,
      to,
      subject: 'Finish creating your Broseph account',
      html: this.buildSignupEmailHtml({ magicLink }),
      text: this.buildSignupEmailText({ magicLink }),
    });
  }

  private buildSignupEmailHtml(params: { magicLink: string }): string {
    const { magicLink } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0;">Broseph</h1>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
    <h2 style="margin-top: 0; color: #1e293b;">Almost there!</h2>

    <p style="color: #64748b; margin-bottom: 25px;">
      Click the button below to finish creating your account and start connecting with your friends.
    </p>

    <a href="${magicLink}"
       style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
      Finish Creating Account
    </a>

    <p style="color: #94a3b8; font-size: 14px; margin-top: 25px;">
      This link expires in 1 hour.
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
    <p>If you didn't sign up for Broseph, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  private buildSignupEmailText(params: { magicLink: string }): string {
    const { magicLink } = params;

    return `
Almost there!

Click here to finish creating your Broseph account: ${magicLink}

This link expires in 1 hour.

If you didn't sign up for Broseph, you can safely ignore this email.
    `.trim();
  }
}
