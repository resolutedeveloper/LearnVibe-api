import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  otp: string;
}

const otpTemplate = (otp: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
      <h2 style="color: #333;">LearnVibe - Your OTP Code</h2>
      <p style="font-size: 16px;">Use the code below to verify your email:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #2d89ef;">${otp}</div>
      <p style="font-size: 14px; color: #555;">This OTP will expire in 5 minutes.</p>
      <p style="font-size: 13px; color: #aaa;">LearnVibe Team</p>
    </div>
  `;
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.in',
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true',
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
    console.log('✅ OTP email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
