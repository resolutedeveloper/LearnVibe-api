import Joi from 'joi';

export const addAdminUser = Joi.object({
  FirstName: Joi.string().required(),
  LastName: Joi.string().allow(null, ''),
  EmailID: Joi.string().required(),
  Password: Joi.string().min(6).required(),
  ContactNumber: Joi.string().allow(null, ''),
  Birthdate: Joi.string().allow(null, ''),
  Address: Joi.string().allow(null, ''),
  Grade: Joi.string().allow(null, ''),
  Role: Joi.string().valid('sub-admin').allow(null, ''),
});
