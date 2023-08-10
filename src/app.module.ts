import { Logger, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpGeneralExceptionFilter } from './utils/exception/filter/http-general-exception.filter';
import { HttpBusinessExceptionFilter } from './utils/exception/filter/http-business-exception.filter';
import { HttpRequestErrorExceptionFilter } from './utils/exception/filter/request-error-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { Categoria } from './entities/categoria';
import { Compra } from './entities/compra';
import { DetalleCierre } from './entities/detalle-cierre';
import { IntegranteListaCompra } from './entities/integrante-lista-compra';
import { ListaCompra } from './entities/lista-compra';
import { Usuario } from './entities/usuario';
import { CategoriaService } from './services/categoria.service';
import { CompraService } from './services/compra.service';
import { DetalleCierreService } from './services/detalle-cierre.service';
import { IntegranteListaCompraService } from './services/integrante-lista-compra.service';
import { ListaCompraService } from './services/lista-compra.service';
import { UsuarioService } from './services/usuario.service';
import { CategoriaController } from './controllers/categoria.controller';
import { CompraController } from './controllers/compra.controller';
import { DetalleCierreController } from './controllers/detalle-cierre.controller';
import { ListaCompraController } from './controllers/lista-compra.controller';
import { UsuarioController } from './controllers/usuario.controller';
import { DataSource } from 'typeorm';
import { CodigoAleatorioService } from './utils/codigo-aleatorio.service';
import { ValidatorsService } from './utils/validators.service';

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
      entities: [
        Categoria,
        Compra,
        DetalleCierre,
        IntegranteListaCompra,
        ListaCompra,
        Usuario,
      ],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([
      Categoria,
      Compra,
      DetalleCierre,
      IntegranteListaCompra,
      ListaCompra,
      Usuario,
    ]),
  ],
  controllers: [
    CategoriaController,
    CompraController,
    DetalleCierreController,
    ListaCompraController,
    UsuarioController,
  ],
  providers: [
    CategoriaService,
    CompraService,
    DetalleCierreService,
    IntegranteListaCompraService,
    ListaCompraService,
    UsuarioService,
    { provide: APP_FILTER, useClass: HttpGeneralExceptionFilter },
    { provide: APP_FILTER, useClass: HttpBusinessExceptionFilter },
    { provide: APP_FILTER, useClass: HttpRequestErrorExceptionFilter },
    Logger,
    CodigoAleatorioService,
    ValidatorsService,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
