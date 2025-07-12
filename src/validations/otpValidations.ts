import Joi from 'joi';

export const verifyOtpValidationSchema = Joi.object({
  EmailID: Joi.string().required().label('EmailID'),
  OTP: Joi.string().required().label('OTP'),
  Status: Joi.number().valid(0, 1).required().label('Status'), // 0 for Sign-up, 1 for Forgot Password / Update Password

  // FirstName and Password are optional — only required during Sign-up
  FirstName: Joi.string().optional().allow(null).label('FirstName'),
  Password: Joi.string().optional().allow(null).label('Password'),
});
