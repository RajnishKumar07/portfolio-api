import { HttpStatus } from '@nestjs/common';

export interface ResponseStructure<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export function createResponse<T>(
  statusCode: HttpStatus,
  message: string,
  data?: T,
): ResponseStructure<T> {
  return { statusCode, message, data };
}
