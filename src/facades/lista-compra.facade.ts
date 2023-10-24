import { Injectable } from '@nestjs/common';
import { ListaCompraService } from '../services/lista-compra.service';
import { IntegranteListaCompraService } from '../services/integrante-lista-compra.service';
import { UsuarioService } from '../services/usuario.service';
import { CodigoAleatorioService } from '../utils/codigo-aleatorio.service';
import { FilterListasComprasRequest } from '../dtos/filter-listas-compras.request';
import { ResultPage } from '../utils/result-page';
import { ListaCompraDto } from '../dtos/lista-compra.dto';
import { ValidatorsService } from '../utils/validators.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { ESTADOS_COLABORADORES } from '../utils/enums/estados-colaboradores.enum';
import { CrearListaCompraRequest } from '../dtos/crear-lista-compra.request.';
import { ListaCompra } from '../entities/lista-compra';
import { ESTADOS_LISTA_COMPRAS } from '../utils/enums/estados-lista-compras.enum';
import { AgregarColaboradorRequest } from '../dtos/agregar-colaborador.request.';
import { IntegranteListaCompraDto } from '../dtos/integrante-lista-compra.dto';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';
import { AprobarRechazarColaboradorRequest } from '../dtos/aprobar-rechazar-colaborador.request.';
import { BusinessException } from '../utils/exception/business.exception';
import { AsignarPorcentajeColaboradorRequest } from '../dtos/asignar-porcentaje-colaborador.request.';
import { ConsultaIntegrantesFilter } from '../dtos/consulta-integrantes.filter.';

@Injectable()
export class ListaCompraFacade {
  constructor(
    private listaCompraService: ListaCompraService,
    private usuarioService: UsuarioService,
    private integranteListaCompraService: IntegranteListaCompraService,
    private codigoAleatorioService: CodigoAleatorioService,
  ) {}

  public async consultarListaComprasConFiltroConPaginacion(
    filter: FilterListasComprasRequest,
    page: number,
    size: number,
    sort: string,
  ): Promise<ResultPage<ListaCompraDto>> {
    ValidatorsService.validateRequired(filter.usuario);

    const usuarioExist = await this.usuarioService.usuarioExists(
      filter.usuario,
    );
    if (!usuarioExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_FOUND);
    }

    const usuarioActivo = await this.usuarioService.findById(filter.usuario);
    if (!usuarioActivo.activo) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_ACTIVE);
    }

    return await this.integranteListaCompraService.consultarListaComprasConFiltroConPaginacion(
      filter,
      ESTADOS_COLABORADORES.APROBADO,
      page,
      size,
      sort,
    );
  }

  public async consultarMisListaComprasConFiltro(
    usuarioCreador: number,
    estado: string,
    nombre: string,
  ): Promise<ListaCompraDto[]> {
    ValidatorsService.validateRequired(usuarioCreador);

    await this.usuarioService.validateUser(usuarioCreador);

    return await this.listaCompraService.consultarMisListaComprasConFiltro(
      usuarioCreador,
      estado,
      nombre,
    );
  }

  private async findById(idListaCompra: number): Promise<any> {
    return await this.listaCompraService.findById(idListaCompra);
  }

  /*Transactional*/
  public async crearListaCompras(
    listaCompra: CrearListaCompraRequest,
  ): Promise<ListaCompraDto> {
    ValidatorsService.validateRequired(listaCompra.nombre);
    ValidatorsService.validateRequired(listaCompra.usuarioCreador);

    await this.usuarioService.validateUser(listaCompra.usuarioCreador);

    const listaCompraNew: ListaCompra = new ListaCompra();
    listaCompraNew.nombre = listaCompra.nombre;
    listaCompraNew.usuarioCreadorFk = listaCompra.usuarioCreador;
    listaCompraNew.fechaCreacion = new Date();
    listaCompraNew.estado = ESTADOS_LISTA_COMPRAS.CONFIGURANDO;
    listaCompraNew.totalCompras = 0;

    const codigoGenerado = this.codigoAleatorioService.generarCodigoAleatorio();

    const listaCompraSaved = await this.listaCompraService.crearListaCompras(
      listaCompra,
      codigoGenerado,
    );
    return {
      codigoGenerado: listaCompraSaved.codigoGenerado,
      estado: listaCompraSaved.estado,
      fechaCreacion: listaCompraSaved.fechaCreacion,
      fechaFinalizado: listaCompraSaved.fechaFinalizado,
      id: listaCompraSaved.id,
      idUsuarioCreador: listaCompraSaved.usuarioCreadorFk,
      nombre: listaCompraSaved.nombre,
      totalCompras: listaCompraSaved.totalCompras,
    };
  }

  private async findByCodigoGenerado(codigoGenerado: string): Promise<any> {
    return await this.listaCompraService.findByCodigoGenerado(codigoGenerado);
  }

  public async agregarIntegranteColaborador(
    colaboradorRequest: AgregarColaboradorRequest,
  ): Promise<IntegranteListaCompraDto> {
    ValidatorsService.validateRequired(colaboradorRequest);
    ValidatorsService.validateRequired(colaboradorRequest.codigoGenerado);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioColaborador);

    const listaCompra = await this.findByCodigoGenerado(
      colaboradorRequest.codigoGenerado,
    );
    if (!listaCompra) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.LIST_NOT_FOUND);
    }

    if (listaCompra.estado !== ESTADOS_LISTA_COMPRAS.CONFIGURANDO) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ADD_COLLABORATOR_NOT_ALLOWED,
      );
    }

    await this.usuarioService.validateUser(
      colaboradorRequest.idUsuarioColaborador,
    );

    if (
      listaCompra.usuarioCreadorFk === colaboradorRequest.idUsuarioColaborador
    ) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.DUPLICATE_USER_ON_PURCHASE_LIST,
      );
    }

    const integranteSaved: IntegranteListaCompra =
      await this.integranteListaCompraService.agregarIntegranteColaborador(
        colaboradorRequest.idUsuarioColaborador,
        listaCompra,
      );
    return {
      esCreador: integranteSaved.esCreador,
      estado: integranteSaved.estado,
      id: integranteSaved.id,
      idListaCompra: integranteSaved.listaCompraFk,
      porcentaje: integranteSaved.porcentaje,
      idUsuario: integranteSaved.usuarioFk,
    };
  }

  public async aprobarRechazarColaborador(
    colaboradorRequest: AprobarRechazarColaboradorRequest,
  ): Promise<IntegranteListaCompraDto> {
    ValidatorsService.validateRequired(colaboradorRequest);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioCreador);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioColaborador);
    ValidatorsService.validateRequired(colaboradorRequest.idListaCompras);

    await this.usuarioService.validateUser(colaboradorRequest.idUsuarioCreador);
    await this.usuarioService.validateUser(
      colaboradorRequest.idUsuarioColaborador,
    );

    await this.listaCompraService.validateListaCompras(
      colaboradorRequest.idListaCompras,
    );

    const listaCompras = await this.findById(colaboradorRequest.idListaCompras);
    if (listaCompras.usuarioCreadorFk !== colaboradorRequest.idUsuarioCreador) {
      throw new BusinessException(MESSAGES_EXCEPTION.NOT_ALLOWED_ENABLE);
    }

    if (listaCompras.estado !== ESTADOS_LISTA_COMPRAS.CONFIGURANDO) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ENABLE_COLLABORATOR_NOT_ALLOWED,
      );
    }

    if (
      listaCompras.usuarioCreadorFk === colaboradorRequest.idUsuarioColaborador
    ) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.CHANGE_REQUEST_STATUS_TO_CREATOR_NOT_ALLOWED,
      );
    }

    const integranteSaved =
      await this.integranteListaCompraService.aprobarRechazarColaborador(
        colaboradorRequest,
      );
    return {
      esCreador: integranteSaved.esCreador,
      estado: integranteSaved.estado,
      id: integranteSaved.id,
      idListaCompra: integranteSaved.listaCompraFk,
      porcentaje: integranteSaved.porcentaje,
      idUsuario: integranteSaved.usuarioFk,
    };
  }

  public async asignarPorcentajeColaborador(
    colaboradorRequest: AsignarPorcentajeColaboradorRequest,
  ): Promise<IntegranteListaCompraDto> {
    ValidatorsService.validateRequired(colaboradorRequest);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioCreador);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioColaborador);
    ValidatorsService.validateRequired(colaboradorRequest.idListaCompras);
    ValidatorsService.validateRequired(colaboradorRequest.porcentaje);

    await this.usuarioService.validateUser(colaboradorRequest.idUsuarioCreador);
    await this.usuarioService.validateUser(
      colaboradorRequest.idUsuarioColaborador,
    );

    await this.listaCompraService.validateListaCompras(
      colaboradorRequest.idListaCompras,
    );

    const listaCompras = await this.findById(colaboradorRequest.idListaCompras);
    if (listaCompras.usuarioCreadorFk !== colaboradorRequest.idUsuarioCreador) {
      throw new BusinessException(MESSAGES_EXCEPTION.NOT_ALLOWED_ENABLE);
    }

    if (listaCompras.estado !== ESTADOS_LISTA_COMPRAS.CONFIGURANDO) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ENABLE_COLLABORATOR_NOT_ALLOWED,
      );
    }

    if (
      colaboradorRequest.porcentaje < 1 ||
      colaboradorRequest.porcentaje > 100
    ) {
      throw new BusinessException(MESSAGES_EXCEPTION.PERCENT_NOT_ALLOWED);
    }

    const integranteSaved =
      await this.integranteListaCompraService.asignarPorcentajeColaborador(
        colaboradorRequest,
      );
    return {
      esCreador: integranteSaved.esCreador,
      estado: integranteSaved.estado,
      id: integranteSaved.id,
      idListaCompra: integranteSaved.listaCompraFk,
      porcentaje: integranteSaved.porcentaje,
      idUsuario: integranteSaved.usuarioFk,
    };
  }

  public async consultarIntegrantesWithTotalCompras(
    filtro: ConsultaIntegrantesFilter,
  ): Promise<any[]> {
    ValidatorsService.validateRequired(filtro);
    ValidatorsService.validateRequired(filtro.idListaCompras);

    await this.listaCompraService.validateListaCompras(filtro.idListaCompras);

    const integrantes =
      await this.integranteListaCompraService.consultarIntegrantesWithTotalCompras(
        filtro,
      );
    return integrantes;
  }

  public async inicializarListaCompras(
    idListaCompras: number,
  ): Promise<ListaCompraDto> {
    ValidatorsService.validateRequired(idListaCompras);
    await this.listaCompraService.validateListaCompras(idListaCompras);

    const integrantesPendientes: any[] = await this.getIntegrantesPorEstado(
      idListaCompras,
      ESTADOS_COLABORADORES.PENDIENTE,
    );
    if (integrantesPendientes && integrantesPendientes.length > 0) {
      throw new BusinessException(MESSAGES_EXCEPTION.HAS_PENDING_REQUESTS);
    }

    const integrantesAprobados = await this.getIntegrantesPorEstado(
      idListaCompras,
      ESTADOS_COLABORADORES.APROBADO,
    );
    const totalPorcentajes =
      this.integranteListaCompraService.sumarPorcentajesIntegrantes(
        integrantesAprobados,
      );

    if (totalPorcentajes !== Number(100)) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.TOTAL_PERCENTAGES_MUST_BE_100_PERCENT,
      );
    }

    const listaCompras: ListaCompra = await this.cambiarEstadoListaCompras(
      idListaCompras,
      ESTADOS_LISTA_COMPRAS.PENDIENTE,
    );
    return {
      codigoGenerado: listaCompras.codigoGenerado,
      estado: listaCompras.estado,
      fechaCreacion: listaCompras.fechaCreacion,
      fechaFinalizado: listaCompras.fechaFinalizado,
      id: listaCompras.id,
      idUsuarioCreador: 0,
      nombre: listaCompras.nombre,
      totalCompras: listaCompras.totalCompras,
    };
  }

  private async getIntegrantesPorEstado(
    idListaCompras: number,
    estado: ESTADOS_COLABORADORES,
  ) {
    const filtro: ConsultaIntegrantesFilter = new ConsultaIntegrantesFilter();
    const estados = [estado];
    filtro.idListaCompras = idListaCompras;
    filtro.estados = estados;

    return await this.integranteListaCompraService.consultarIntegrantesListaCompras(
      filtro,
    );
  }

  private async cambiarEstadoListaCompras(
    idListaCompras: number,
    estado: ESTADOS_LISTA_COMPRAS,
  ): Promise<any> {
    return await this.listaCompraService.cambiarEstadoListaCompras(
      idListaCompras,
      estado,
    );
  }
}
