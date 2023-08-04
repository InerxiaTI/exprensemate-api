import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { StandardResponse } from '../../http-response/standard-response';
import { RequestErrorException } from '../request-error.exception';
import { MESSAGES_EXCEPTION } from '../messages-exception.enum';

@Catch(RequestErrorException)
export class HttpRequestErrorExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: RequestErrorException, host: ArgumentsHost) {
    this.logger.error(
      MESSAGES_EXCEPTION.REQUEST_CLIENT_EXCEPTION,
      exception.stack,
    );

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const customResponse: StandardResponse<any> = {
      status: HttpStatus.BAD_REQUEST,
      message: exception.message,
      devMesssage: process.env.APP_ENV !== 'pdn' ? exception.stack : '',
    };
    response.status(HttpStatus.BAD_REQUEST).json(customResponse);
  }
}
