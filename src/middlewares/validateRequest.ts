import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

function formatErrorMessages(errors: Joi.ValidationErrorItem[]): string {
  return errors.map((error) => error.message.replace(/"/g, '')).join(', ');
}

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      res.status(400).json({
        status: 'error',
        message: formatErrorMessages(error.details),
      });
      return;
    }

    next();
  };
};
