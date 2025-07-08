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
