import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Primary interception layer. Catches raw errors and formats them into standardized JSON.
   */
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status = this.extractStatus(exception);
    const message = this.extractMessage(exception);
    
    // Output a clean, structured payload to the frontend
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  /**
   * Safely extracts the HTTP status, falling back to 500.
   */
  private extractStatus(exception: any): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Recursively unboxes validation payloads from NestJS Class-Validator.
   */
  private extractMessage(exception: any): any {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const payload = exception.getResponse();
    return this.parseValidationPayload(payload);
  }

  /**
   * Handles deeply nested object mapping specifically for DTO transform errors.
   */
  // eslint-disable-next-line complexity
  private parseValidationPayload(payload: any): any {
    if (typeof payload !== 'object' || payload === null) {
      return payload;
    }

    if (Array.isArray(payload['message'])) {
      return payload['message'][0]; // Return the first human-readable class-validator error
    }

    return payload['message'] || payload;
  }
}
