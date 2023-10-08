import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StandardResponse } from '../utils/http-response/standard-response';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';
import { CrearCompraRequest } from '../dtos/crear-compra.request.';
import { MESSAGES_RESPONSE } from '../utils/enums/messages-response.enum';
import { ConsultaComprasResponse } from '../dtos/consulta-compras.response';
import { CompraDto } from '../dtos/compra.dto';
import { CompraFacade } from '../facades/compra.facade';

@ApiTags('Compras')
@Controller('api/compra')
export class CompraController {
  constructor(private readonly facade: CompraFacade) {}

  @Post('/filter')
  public async listarComprasConFiltro(
    @Body() filtroComprasRequest: FiltroComprasRequest,
  ): Promise<StandardResponse<ConsultaComprasResponse[]>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.consultarComprasConFiltro(filtroComprasRequest),
    };
  }

  @Post('/crear-compra')
  public async crearCompra(
    @Body() compraRequest: CrearCompraRequest,
  ): Promise<StandardResponse<CompraDto>> {
    return {
      status: HttpStatus.OK,
      message: MESSAGES_RESPONSE.CREATED,
      body: await this.facade.crearCompra(compraRequest),
    };
  }
}
