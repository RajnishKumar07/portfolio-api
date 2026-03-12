import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASSWORD');

    if (emailUser && emailPass) {
      // Use Production / Real Gmail SMTP
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
      this.logger.log(`Gmail SMTP configured for user: ${emailUser}`);
    } else {
      // Fallback: Use Ethereal for local testing if no env variables are provided
      // Ethereal creates a free SMTP service that captures emails and gives a link to view them.
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      this.logger.log(`Ethereal Mock SMTP configured. User: ${testAccount.user}`);
      this.logger.warn('To send real emails, add EMAIL_USER and EMAIL_PASSWORD to your .env file.');
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    const info = await this.transporter.sendMail({
      from: '"Portfolio App" <no-reply@portfolio.com>',
      to,
      subject: 'Your Portfolio Verification Code (OTP)',
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Portfolio Verification</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    this.logger.log(`OTP Email sent! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }

  async sendContactEmail(ownerEmail: string, visitorEmail: string, message: string) {
    // 1. Send the email to the specific Portfolio Owner
    const ownerInfo = await this.transporter.sendMail({
      from: '"Portfolio Contact" <contact@portfolio.com>',
      to: ownerEmail,
      replyTo: visitorEmail,
      subject: `New Message from ${visitorEmail} via your Portfolio`,
      text: `You have a new message from ${visitorEmail}:\n\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Message from your Portfolio</h2>
          <p><strong>From:</strong> ${visitorEmail}</p>
          <div style="padding: 15px; border-left: 4px solid #4CAF50; background: #f9f9f9;">
            <p>${message}</p>
          </div>
          <p><em>Reply directly to this email to respond to the sender.</em></p>
        </div>
      `,
    });
    this.logger.log(`Owner Contact Email sent! Preview URL: ${nodemailer.getTestMessageUrl(ownerInfo)}`);

    // 2. Send confirmation to the Visitor
    const visitorInfo = await this.transporter.sendMail({
      from: '"Portfolio Contact" <contact@portfolio.com>',
      to: visitorEmail,
      subject: `Confirmation: We received your message!`,
      text: `Thank you for reaching out. Your message has been sent to the portfolio owner.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Message Received</h2>
          <p>Thank you for reaching out! Your message has been successfully delivered to the portfolio owner.</p>
          <p>A copy of your message:</p>
          <div style="padding: 15px; border-left: 4px solid #ccc; color: #555;">
            <p>${message}</p>
          </div>
        </div>
      `,
    });
    this.logger.log(`Visitor Confirmation Email sent! Preview URL: ${nodemailer.getTestMessageUrl(visitorInfo)}`);

    return { ownerInfo, visitorInfo };
  }
}
