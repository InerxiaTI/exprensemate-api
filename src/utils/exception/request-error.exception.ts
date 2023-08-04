import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

export class RequestErrorException extends RuntimeException {
  constructor(message: string) {
    super(message);
  }
}
