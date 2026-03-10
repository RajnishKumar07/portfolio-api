import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Custom parameter decorator designed to elegantly extract the `user` object 
 * that was injected into the Express request pipeline by the `AuthGuard` or `OptionalAuthGuard`.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user']; 

    if (!user) return undefined; 

    return data ? user[data as keyof typeof user] : user;
  },
);
