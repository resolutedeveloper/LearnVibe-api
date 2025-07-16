import Joi from 'joi';
export const QuizPauseCompleteValidationSchema = Joi.object({
  QuizID: Joi.string()
    .required()
    .messages({
      'any.required': 'Quiz ID is required.',
      'string.empty': 'Quiz ID cannot be empty.',
    }),

  QuizResponseJSON: Joi.alternatives()
    .try(Joi.object(), Joi.array(), Joi.string())
    .optional()
    .allow('', null)
    .messages({
      'alternatives.match': 'Quiz response must be a valid object, array, or JSON string.',
    }),

  StartTime: Joi.date()
    .iso()
    .optional()
    .allow('', null)
    .messages({
      'date.format': 'Start time must be in yyyy-mm-dd format.',
      'date.base': 'Start time must be a valid date.',
    }),

  EndTime: Joi.date()
    .iso()
    .optional()
    .allow('', null)
    .messages({
      'date.format': 'End time must be in yyyy-mm-dd format.',
      'date.base': 'End time must be a valid date.',
    }),

  Status: Joi.number()
    .valid(0, 1, 2)
    .required()
    .messages({
      'any.required': 'Status is required.',
      'any.only': 'Status must be either 0 (Paused), 1 (Completed), or 2 (Resumed).',
      'number.base': 'Status must be a numeric value.',
    }),
});

export const uploadValidationSchema = Joi.object({
  SubscriptionID: Joi.string()
    .required()
    .messages({
      'any.required': 'Please select a subscription plan before proceeding.',
      'string.empty': 'Subscription plan cannot be empty. Kindly choose a valid option.',
    }),
  DocumentName: Joi.string()
    .required()
    .messages({
      'any.required': 'Please enter the document name.',
      'string.empty': 'Document name cannot be empty.',
    })
});