import Joi from 'joi';

export const verifyOtpValidationSchema = Joi.object({
  EmailID: Joi.string().required().label('EmailID').messages({
    'string.base': 'EmailID must be a string.',
    'string.empty': 'EmailID is required.',
    'any.required': 'EmailID is required.',
  }),

  OTP: Joi.string().required().label('OTP').messages({
    'string.base': 'OTP must be a string.',
    'string.empty': 'OTP is required.',
    'any.required': 'OTP is required.',
  }),

  Status: Joi.number().valid(0, 1).required().label('Status').messages({
    'number.base': 'Status must be a number.',
    'any.only': 'Status must be either 0 (Sign-up) or 1 (Forgot/Update Password).',
    'any.required': 'Status is required.',
  }),

  FirstName: Joi.string().optional().allow(null).label('FirstName').messages({
    'string.base': 'FirstName must be a string.',
  }),

  Password: Joi.string().optional().allow(null).label('Password').messages({
    'string.base': 'Password must be a string.',
  }),
});
