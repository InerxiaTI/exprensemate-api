import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListaCompraService } from '../services/lista-compra.service';
import { StandardResponse } from '../utils/http-response/standard-response';
import { CrearListaCompraRequest } from '../dtos/crear-lista-compra.request.';
import { MESSAGES_RESPONSE } from '../utils/enums/messages-response.enum';

@ApiTags('Lista de compras')
@Controller('api/lista-compra')
export class ListaCompraController {
  constructor(private readonly service: ListaCompraService) {}

  @Get('/filter')
  public async listarComprasConFiltro(
    @Query() query,
  ): Promise<StandardResponse<any[]>> {
    return {
      status: HttpStatus.OK,
      body: await this.service.listarComprasConFiltro(
        query['usuarioCreador'],
        query['estado'],
        query['nombre'],
      ),
    };
  }

  @Post('/guardar-lista-compra')
  public async crearListaCompras(
    @Body() crearListaCompraRequest: CrearListaCompraRequest,
  ): Promise<StandardResponse<any>> {
    return {
      status: HttpStatus.OK,
      message: MESSAGES_RESPONSE.CREATED,
      body: await this.service.crearListaCompras(crearListaCompraRequest),
    };
  }
}
