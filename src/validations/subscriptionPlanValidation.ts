import Joi from 'joi';

export const AddSubscriptionValidationSchema = Joi.object({
  SubscriptionTitle: Joi.string()
    .required()
    .messages({
      'string.base': 'Subscription title must be a string.',
      'string.empty': 'Subscription title cannot be empty.',
      'any.required': 'Subscription title is required.',
    }),
    IsFree: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'IsFree must be a boolean value.',
      'any.required': 'IsFree is required.',
    }),
    Price: Joi.number()
    .required()
    .messages({
      'number.base': 'Price must be a number.',
      'any.required': 'Price is required.',
    }),
    Duration: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Duration must be a number.',
      'number.integer': 'Duration must be an integer.',
      'any.required': 'Duration is required.',
    }),
    NumOfDocuments: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Number of documents must be a number.',
      'number.integer': 'Number of documents must be an integer.',
      'any.required': 'Number of documents is required.',
    }),
    NoOfPages: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Number of pages must be a number.',
      'number.integer': 'Number of pages must be an integer.',
      'any.required': 'Number of pages is required.',
    }),
    NumOfQuiz: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Number of quizzes must be a number.',
      'number.integer': 'Number of quizzes must be an integer.',
      'any.required': 'Number of quizzes is required.',
    }),
    AllowedFormats: Joi.string()
    .required()
    .messages({
      'string.base': 'Allowed formats must be a string.',
      'string.empty': 'Allowed formats cannot be empty.',
      'any.required': 'Allowed formats are required.',
    }),
    NumberOfQuest: Joi.string()
    .required()
    .messages({
      'string.base': 'Number of questions must be a string (CSV).',
      'string.empty': 'Number of questions cannot be empty.',
      'any.required': 'Number of questions is required.',
    }),
    DifficultyLevels: Joi.string()
    .required()
    .messages({
      'string.base': 'Difficulty levels must be a string (CSV).',
      'string.empty': 'Difficulty levels cannot be empty.',
      'any.required': 'Difficulty levels are required.',
    }),
    IsActive: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'IsActive must be a boolean value.',
      'any.required': 'IsActive is required.',
    }),
    IsDefault: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'IsDefault must be a boolean value.',
      'any.required': 'IsDefault is required.',
    }),
});
