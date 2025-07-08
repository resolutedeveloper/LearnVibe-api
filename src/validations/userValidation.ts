import Joi from 'joi';
export const userValidationSchema = Joi.object({
  FirstName: Joi.string().required(),
  EmailID: Joi.string().required(),
  Password: Joi.string().min(6).required(),
});
