import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext } from 'typeorm-transactional-cls-hooked';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  console.log(process.env.APP_ENV);
  if (process.env.APP_ENV !== 'pdn') {
    const options = new DocumentBuilder()
      .setTitle('Expense Mate API')
      .setVersion('1.0')
      .addSecurity('basic', {
        type: 'http',
        scheme: 'basic',
      })
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);
  }

  // Global Middlewares
  app.use(await compression());
  app.use(helmet());
  app.enableCors();

  initializeTransactionalContext();

  await app.listen(3000);
}
bootstrap();
