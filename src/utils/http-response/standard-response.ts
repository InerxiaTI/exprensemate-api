import { HttpStatus } from '@nestjs/common';

export interface StandardResponse<T> {
  status: HttpStatus;
  message?: string;
  devMesssage?: string;
  body?: T;
}
