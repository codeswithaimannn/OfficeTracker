import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// The shape of every error the API returns.
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

// Catches every thrown error and turns it into one consistent JSON shape.
// Unexpected errors are logged in full on the server, but the client only
// gets a generic message (no stack traces or internal details).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    // originalUrl keeps the /api prefix; drop the query string so values
    // like tokens are never echoed back.
    const path = request.originalUrl.split('?')[0];
    const body = this.toErrorBody(exception, path);
    // Nest's "route not found" message contains the full URL; rebuild it
    // without the query string.
    if (body.message === `Cannot ${request.method} ${request.originalUrl}`) {
      body.message = `Cannot ${request.method} ${path}`;
    }
    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }
    response.status(body.statusCode).json(body);
  }

  toErrorBody(exception: unknown, path: string): ErrorResponseBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();
      // Nest's built-in exceptions give either a string or
      // { message, error }; validation errors give a message array.
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ??
            exception.message);
      return {
        statusCode,
        error: HttpStatus[statusCode] ?? 'Error',
        message,
        path,
        timestamp,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
      message: 'Something went wrong',
      path,
      timestamp,
    };
  }
}
