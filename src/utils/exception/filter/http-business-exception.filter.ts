import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BusinessException } from '../business.exception';
import { StandardResponse } from '../../http-response/standard-response';
import { MESSAGES_EXCEPTION } from '../messages-exception.enum';

@Catch(BusinessException)
export class HttpBusinessExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: BusinessException, host: ArgumentsHost) {
    this.logger.error(MESSAGES_EXCEPTION.BUSINESS_EXCEPTION, exception.stack);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const customResponse: StandardResponse<any> = {
      status: HttpStatus.CONFLICT,
      message: exception.message,
      devMesssage: process.env.APP_ENV !== 'pdn' ? exception.stack : '',
    };
    response.status(HttpStatus.CONFLICT).json(customResponse);
  }
}
