import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[Error] ${req.method} ${req.url} -`, err?.message || err);
    }
  } catch {}

  if (err instanceof ZodError || err?.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: Array.isArray(err?.errors)
          ? err.errors.map((e: any) => ({
              field: Array.isArray(e?.path) ? e.path.join('.') : '',
              message: e?.message || 'Invalid input'
            }))
          : []
      }
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Handle Prisma Known Errors
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists.'
      }
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Record could not be found.'
      }
    });
    return;
  }

  // Fallback internal error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
    }
  });
}
