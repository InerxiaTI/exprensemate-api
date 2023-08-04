import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { StandardResponse } from '../../http-response/standard-response';
import { MESSAGES_EXCEPTION } from '../messages-exception.enum';

@Catch()
export class HttpGeneralExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown | string | any, host: ArgumentsHost) {
    this.logger.error(MESSAGES_EXCEPTION.SERVER_EXCEPTION, exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const customResponse: StandardResponse<any> = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: MESSAGES_EXCEPTION.SERVER_EXCEPTION_MESSAGE,
      devMesssage: process.env.APP_ENV !== 'pdn' ? exception.message : '',
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(customResponse);
  }
}
