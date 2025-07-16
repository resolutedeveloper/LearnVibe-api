import Joi from 'joi';
export const subscriptionValidationSchema = Joi.object({
  SubscriptionID: Joi.string()
    .required()
    .messages({
      'any.required': 'Please select a subscription plan before proceeding.',
      'string.empty': 'Subscription plan cannot be empty. Kindly choose a valid option.',
    }),

  PaymentAmount: Joi.number()
    .required()
    .messages({
      'any.required': 'Payment amount is required.',
      'number.base': 'Payment amount must be a number.',
    }),

  PaymentCurrency: Joi.string()
    .required()
    .messages({
      'any.required': 'Payment currency is required.',
      'string.empty': 'Payment currency cannot be empty.',
    }),

  PaymentDuration: Joi.number()
    .optional()
    .allow('', null)
    .messages({
      'number.base': 'Payment duration must be a number if provided.',
    }),

  TransactionID: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Transaction ID must be a string.',
    }),

  PaymentGatewayData: Joi.alternatives()
    .try(Joi.object(), Joi.array(), Joi.string())
    .optional()
    .allow('', null)
    .messages({
      'alternatives.match': 'Payment gateway data must be an object, array, or valid JSON string.',
    }),

  StartDate: Joi.date()
    .iso()
    .optional()
    .allow('', null)
    .messages({
      'date.format': 'Start date must be in yyyy-mm-dd format.',
      'date.base': 'Start date must be a valid date.',
    }),

  EndDate: Joi.date()
    .iso()
    .optional()
    .allow('', null)
    .messages({
      'date.format': 'End date must be in yyyy-mm-dd format.',
      'date.base': 'End date must be a valid date.',
    }),
});