import Joi from 'joi';

export const userValidationSchema = Joi.object({
  FirstName: Joi.string().required(),
  EmailID: Joi.string().required(),
  Password: Joi.string().min(6).required(),
});

export const userUpdateValidationSchema = Joi.object({
  UserID: Joi.string().required(),
  FirstName: Joi.string().required(),
  EmailID: Joi.string().required(),
  LastName: Joi.string().optional().allow('', null),
  ContactNumber: Joi.string().optional().allow('', null),
  BirthDate: Joi.string().optional().allow('', null),
  Grade: Joi.string().optional().allow('', null),
});

export const signinValidationSchema = Joi.object({
  EmailID: Joi.string()
    .required()
    .messages({
      'any.required': 'Email field is required. Please provide your email address.',
      'string.empty': 'Email field cannot be empty. Please provide your email address.',
    }),
  Password: Joi.string()
    .min(6)
    .required()
    .messages({
      'any.required': 'Password field is required. Please provide your email address.',
      'string.empty': 'Password field cannot be empty. Please provide your email address.',
      'string.min': 'Password must be at least 6 characters',
    }),
});