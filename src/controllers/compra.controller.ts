import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompraService } from '../services/compra.service';
import { StandardResponse } from '../utils/http-response/standard-response';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';

@ApiTags('Compras')
@Controller('api/compra')
export class CompraController {
  constructor(private readonly service: CompraService) {}

  @Post('/filter')
  public async listarComprasConFiltro(
    @Body() filtroComprasRequest: FiltroComprasRequest,
  ): Promise<StandardResponse<any[]>> {
    return {
      status: HttpStatus.OK,
      body: await this.service.consultarComprasConFiltro(filtroComprasRequest),
    };
  }
}
