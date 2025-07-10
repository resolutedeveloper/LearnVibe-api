export const otpTemplate = (otp: string): string => {
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

export function generateOtp() {
  let length = 6;
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Length must be a positive integer');
  }

  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }

  return otp;
}
