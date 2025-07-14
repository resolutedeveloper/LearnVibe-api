import nodemailer from 'nodemailer';
import { otpTemplate } from './otp.util';
import EmailLog from '../models/emailLog.model';
import dotenv from 'dotenv';
import { EncryptBE } from './encrypt';
dotenv.config();

interface EmailOptions {
  to: string;
  otp: string;
}

let transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async ({ to, otp }: EmailOptions): Promise<void> => {
  const html = otpTemplate(otp);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'LearnVibe - Email Verification OTP',
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    await EmailLog.create({
      EmailID: EncryptBE(to),
      Subject: EncryptBE('LearnVibe - Email Verification OTP'),
      Body: EncryptBE(html),
    });

    console.log('✅ OTP email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
