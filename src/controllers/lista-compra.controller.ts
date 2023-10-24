import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StandardResponse } from '../utils/http-response/standard-response';
import { CrearListaCompraRequest } from '../dtos/crear-lista-compra.request.';
import { MESSAGES_RESPONSE } from '../utils/enums/messages-response.enum';
import { AgregarColaboradorRequest } from '../dtos/agregar-colaborador.request.';
import { AprobarRechazarColaboradorRequest } from '../dtos/aprobar-rechazar-colaborador.request.';
import { AsignarPorcentajeColaboradorRequest } from '../dtos/asignar-porcentaje-colaborador.request.';
import { ConsultaIntegrantesFilter } from '../dtos/consulta-integrantes.filter.';
import { ResultPage } from '../utils/result-page';
import { FilterListasComprasRequest } from '../dtos/filter-listas-compras.request';
import { ListaCompraDto } from '../dtos/lista-compra.dto';
import { IntegranteListaCompraDto } from '../dtos/integrante-lista-compra.dto';
import { ListaCompraFacade } from '../facades/lista-compra.facade';

@ApiTags('Lista de compras')
@Controller('api/lista-compra')
export class ListaCompraController {
  constructor(private readonly facade: ListaCompraFacade) {}

  @Post('/filter')
  public async consultarListaComprasConFiltroConPaginacion(
    @Body() filter: FilterListasComprasRequest,
    @Query() query,
  ): Promise<StandardResponse<ResultPage<ListaCompraDto>>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.consultarListaComprasConFiltroConPaginacion(
        filter,
        query['page'],
        query['size'],
        query['sort'],
      ),
    };
  }

  @Get('/filter-mis-listas')
  public async consultarMisListaComprasConFiltro(
    @Query() query,
  ): Promise<StandardResponse<ListaCompraDto[]>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.consultarMisListaComprasConFiltro(
        query['usuarioCreador'],
        query['estado'],
        query['nombre'],
      ),
    };
  }

  @Post('/crear-lista-compra')
  public async crearListaCompras(
    @Body() crearListaCompraRequest: CrearListaCompraRequest,
  ): Promise<StandardResponse<ListaCompraDto>> {
    return {
      status: HttpStatus.OK,
      message: MESSAGES_RESPONSE.CREATED,
      body: await this.facade.crearListaCompras(crearListaCompraRequest),
    };
  }

  @Post('/solicitud-agregar-colaborador')
  public async agregarIntegranteColaborador(
    @Body() colaboradorRequest: AgregarColaboradorRequest,
  ): Promise<StandardResponse<IntegranteListaCompraDto>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.agregarIntegranteColaborador(colaboradorRequest),
    };
  }

  @Post('/aprobar-rechazar-colaborador')
  public async aprobarRechazarColaborador(
    @Body()
    aprobarRechazarColaboradorRequest: AprobarRechazarColaboradorRequest,
  ): Promise<StandardResponse<IntegranteListaCompraDto>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.aprobarRechazarColaborador(
        aprobarRechazarColaboradorRequest,
      ),
    };
  }

  @Post('/asignar-porcentaje-colaborador')
  public async asignarPorcentajeColaborador(
    @Body()
    asignarPorcentajeColaboradorRequest: AsignarPorcentajeColaboradorRequest,
  ): Promise<StandardResponse<IntegranteListaCompraDto>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.asignarPorcentajeColaborador(
        asignarPorcentajeColaboradorRequest,
      ),
    };
  }

  @Post('/filter-integrantes-total-compras')
  public async consultarIntegrantesWithTotalCompras(
    @Body()
    filtro: ConsultaIntegrantesFilter,
  ): Promise<StandardResponse<any[]>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.consultarIntegrantesWithTotalCompras(filtro),
    };
  }

  @Put('/inicializar-lista-compras')
  public async inicializarListaCompras(
    @Query() query,
  ): Promise<StandardResponse<ListaCompraDto>> {
    return {
      status: HttpStatus.OK,
      body: await this.facade.inicializarListaCompras(query['idListaCompras']),
    };
  }
}
