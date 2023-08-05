import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListaCompraService } from '../services/lista-compra.service';
import { StandardResponse } from '../utils/http-response/standard-response';

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
}
