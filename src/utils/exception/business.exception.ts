import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

export class BusinessException extends RuntimeException {
  constructor(message: string) {
    super(message);
  }
}
