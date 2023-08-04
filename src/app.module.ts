import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpGeneralExceptionFilter } from './utils/exception/filter/http-general-exception.filter';
import { HttpBusinessExceptionFilter } from './utils/exception/filter/http-business-exception.filter';
import { HttpRequestErrorExceptionFilter } from './utils/exception/filter/request-error-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: configuration().database.host,
      port: configuration().database.port,
      username: configuration().database.username,
      password: configuration().database.password,
      database: configuration().database.dbname,
      entities: [],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpGeneralExceptionFilter },
    { provide: APP_FILTER, useClass: HttpBusinessExceptionFilter },
    { provide: APP_FILTER, useClass: HttpRequestErrorExceptionFilter },
    Logger,
  ],
})
export class AppModule {}
