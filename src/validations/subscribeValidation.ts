import Joi from 'joi';
export const subscriptionValidationSchema = Joi.object({
  SubscriptionID: Joi.string().required(),                     // UUID or ID string
  PaymentAmount: Joi.number().required(),                       // Should be a number, not string
  PaymentCurrency: Joi.string().required(),                     // e.g., 'usd'
  PaymentDuration: Joi.number().optional().allow('', null),      // Number or empty
  TransactionID: Joi.string().optional().allow('', null),        // Optional string
  PaymentGatewayData: Joi.alternatives()                         // Could be object, array, or stringified JSON
    .try(Joi.object(), Joi.array(), Joi.string())
    .optional()
    .allow('', null),
  StartDate: Joi.date().iso().optional().allow('', null),        // Date in ISO format or empty
  EndDate: Joi.date().iso().optional().allow('', null),          // Date in ISO format or empty
});
