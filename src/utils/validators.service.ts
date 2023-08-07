import { Injectable } from '@nestjs/common';
import { RequestErrorException } from './exception/request-error.exception';
import { MESSAGES_EXCEPTION } from './exception/messages-exception.enum';

@Injectable()
export class ValidatorsService {
  public static validateRequired(field: any) {
    if (!field) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.REQUIRED_FIELD);
    }
  }

  public static listIsEmpty(list: any[]): boolean {
    return list.length === 0;
  }
}
