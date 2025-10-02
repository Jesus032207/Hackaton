import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  // Error de MongoDB duplicado
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return res.status(400).json({
      message: 'El recurso ya existe',
      error: err.message
    });
  }

  // Error de validación de MongoDB
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Error de validación',
      error: err.message
    });
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  // Error JWT expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};