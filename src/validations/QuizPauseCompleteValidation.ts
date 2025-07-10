import Joi from 'joi';
export const QuizPauseCompleteValidationSchema = Joi.object({
  QuizID: Joi.string().required(),                     
  QuizResponseJSON: Joi.alternatives()                        
    .try(Joi.object(), Joi.array(), Joi.string())
    .optional()
    .allow('', null),
    StartTime: Joi.date().iso().optional().allow('', null),
    EndTime: Joi.date().iso().optional().allow('', null),
 Status: Joi.number().valid(0, 1, 2).required(),  // Only allows 0, 1, or 2       
});
