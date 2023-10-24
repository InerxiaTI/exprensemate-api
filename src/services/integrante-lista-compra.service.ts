import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';
import { ValidatorsService } from '../utils/validators.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { ListaCompra } from '../entities/lista-compra';
import { BusinessException } from '../utils/exception/business.exception';
import { ESTADOS_COLABORADORES } from '../utils/enums/estados-colaboradores.enum';
import { AprobarRechazarColaboradorRequest } from '../dtos/aprobar-rechazar-colaborador.request.';
import { AsignarPorcentajeColaboradorRequest } from '../dtos/asignar-porcentaje-colaborador.request.';
import { ConsultaIntegrantesFilter } from '../dtos/consulta-integrantes.filter.';
import { ResultPage } from '../utils/result-page';
import { FilterListasComprasRequest } from '../dtos/filter-listas-compras.request';
import { plainToClass } from 'class-transformer';
import { ListaCompraDto } from '../dtos/lista-compra.dto';
import { ConsultaIntegrantesResponse } from '../dtos/consulta-integrantes.response';

@Injectable()
export class IntegranteListaCompraService {
  constructor(
    @InjectRepository(IntegranteListaCompra)
    private integranteListaCompraRepository: Repository<IntegranteListaCompra>,
  ) {}

  async consultarListaComprasConFiltroConPaginacion(
    filter: FilterListasComprasRequest,
    estadoIntegrante: string,
    page = 1,
    size = 10,
    sort = 'id,ASC',
  ): Promise<ResultPage<ListaCompraDto>> {
    const sqlQuery = this.integranteListaCompraRepository
      .createQueryBuilder('integrantes')
      .select('listaCompras.id', 'id')
      .addSelect('listaCompras.nombre', 'nombre')
      .addSelect('listaCompras.fecha_creacion', 'fechaCreacion')
      .addSelect('listaCompras.estado', 'estado')
      .addSelect('listaCompras.fecha_finalizado', 'fechaFinalizado')
      .addSelect('listaCompras.total_compras', 'totalCompras')
      .addSelect('listaCompras.usuario_creador_fk', 'idUsuarioCreador')
      .addSelect('listaCompras.codigo_generado', 'codigoGenerado')
      .innerJoin('integrantes.listaCompra', 'listaCompras')
      .where('integrantes.usuario_fk = :usuario', {
        usuario: filter.usuario,
      })
      .andWhere('integrantes.estado = :estado', {
        estado: estadoIntegrante,
      });

    if (filter.estado || filter.estado === '') {
      sqlQuery.andWhere('listaCompras.estado = :estado', {
        estado: filter.estado,
      });
    }

    if (filter.nombre || filter.nombre === '') {
      sqlQuery.andWhere('listaCompras.nombre like :nombre', {
        nombre: `%${filter.nombre}%`,
      });
    }

    const count = await sqlQuery.getCount();
    const totalPages = Math.ceil(count / size);

    sqlQuery.limit(size).offset((page - 1) * size);

    const sortParts = sort.split(',');
    const sortField = sortParts[0];
    const sortOrder = sortParts[1] === 'DESC' ? 'DESC' : 'ASC';

    const result = await sqlQuery
      .orderBy(`listaCompras.${sortField}`, sortOrder)
      .getRawMany()
      .then((item) => plainToClass(ListaCompraDto, item));

    return {
      page: page,
      size: size,
      content: result,
      totalElements: count,
      totalPages: totalPages,
      totalContent: result.length,
    };
  }

  public async agregarIntegranteColaborador(
    idUsuarioColaborador: number,
    listaCompra: ListaCompra,
  ): Promise<any> {
    const estados = [
      ESTADOS_COLABORADORES.APROBADO,
      ESTADOS_COLABORADORES.PENDIENTE,
      ESTADOS_COLABORADORES.RECHAZADO,
    ];
    const filtro: ConsultaIntegrantesFilter = new ConsultaIntegrantesFilter();
    filtro.idListaCompras = listaCompra.id;
    filtro.estados = estados;
    const integrantesLista: any[] = await this.consultarIntegrantesListaCompras(
      filtro,
    );

    const integranteFound = integrantesLista.find(
      (integrante) => integrante.idUsuario === idUsuarioColaborador,
    );
    if (integranteFound && integranteFound.id) {
      if (integranteFound.estado === ESTADOS_COLABORADORES.RECHAZADO) {
        throw new BusinessException(
          MESSAGES_EXCEPTION.PARTNER_REQUEST_REJECTED,
        );
      }
      throw new BusinessException(
        MESSAGES_EXCEPTION.DUPLICATE_USER_ON_PURCHASE_LIST,
      );
    }

    const integranteNew: IntegranteListaCompra = new IntegranteListaCompra();
    integranteNew.listaCompraFk = listaCompra.id;
    integranteNew.usuarioFk = idUsuarioColaborador;
    integranteNew.estado = ESTADOS_COLABORADORES.PENDIENTE;
    integranteNew.esCreador = false;
    return await this.integranteListaCompraRepository.save(integranteNew);
  }

  public async aprobarRechazarColaborador(
    colaboradorRequest: AprobarRechazarColaboradorRequest,
  ): Promise<any> {
    const integrante = await this.findByListaCompraAndUsuario(
      colaboradorRequest.idListaCompras,
      colaboradorRequest.idUsuarioColaborador,
    );

    if (!integrante) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.MEMBER_NOT_FOUND);
    }

    if (colaboradorRequest.aprobar) {
      integrante.estado = ESTADOS_COLABORADORES.APROBADO;
    } else {
      integrante.estado = ESTADOS_COLABORADORES.RECHAZADO;
    }

    const integranteSaved = await this.integranteListaCompraRepository.save(
      integrante,
    );
    return integranteSaved;
  }

  public async asignarPorcentajeColaborador(
    colaboradorRequest: AsignarPorcentajeColaboradorRequest,
  ): Promise<any> {
    const integrante = await this.findByListaCompraAndUsuario(
      colaboradorRequest.idListaCompras,
      colaboradorRequest.idUsuarioColaborador,
    );

    if (!integrante) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.MEMBER_NOT_FOUND);
    }

    if (integrante.estado === ESTADOS_COLABORADORES.RECHAZADO) {
      throw new BusinessException(MESSAGES_EXCEPTION.PARTNER_REQUEST_REJECTED);
    }

    if (integrante.estado === ESTADOS_COLABORADORES.PENDIENTE) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.REQUEST_HAS_NOT_BEEN_APPROVED,
      );
    }

    integrante.porcentaje = colaboradorRequest.porcentaje;
    const integranteSaved = await this.integranteListaCompraRepository.save(
      integrante,
    );
    return integranteSaved;
  }

  private calcularPorcentajes(
    integrantesLista: IntegranteListaCompra[],
    integranteNew: IntegranteListaCompra,
  ): IntegranteListaCompra {
    const integranteCreador = integrantesLista.find(
      (integrante) => integrante.esCreador,
    );

    let sumaPorcentajesColaboradores =
      this.getSumaPorcentajesColaboradores(integrantesLista);
    sumaPorcentajesColaboradores += integranteNew.porcentaje;

    integranteCreador.porcentaje =
      Number(100) - Number(sumaPorcentajesColaboradores);
    return integranteCreador;
  }

  private getSumaPorcentajesColaboradores(
    integrantesLista: IntegranteListaCompra[],
  ): number {
    const integrantesColaboradores = integrantesLista.filter(
      (integrante) => !integrante.esCreador,
    );
    return this.sumarPorcentajesIntegrantes(integrantesColaboradores);
  }

  public sumarPorcentajesIntegrantes(
    integrantes: IntegranteListaCompra[],
  ): number {
    return integrantes.reduce(
      (suma, integrante) => Number(suma) + Number(integrante.porcentaje),
      0,
    );
  }

  public async consultarIntegrantesWithTotalCompras(
    filtro: ConsultaIntegrantesFilter,
  ): Promise<ConsultaIntegrantesResponse[]> {
    const sqlQuery = this.integranteListaCompraRepository
      .createQueryBuilder('ilc')
      .select('ilc.id', 'id')
      .addSelect('ilc.lista_compra_fk', 'idListaCompra')
      .addSelect('ilc.usuario_fk', 'idUsuario')
      .addSelect('ilc.porcentaje', 'porcentaje')
      .addSelect('ilc.estado', 'estado')
      .addSelect('ilc.es_creador', 'esCreador')
      .addSelect('SUM(c.valor)', 'total_compras')
      .addSelect('usuario.nombres', 'nombres')
      .addSelect('usuario.apellidos', 'apellidos')
      .innerJoin('ilc.usuario', 'usuario')
      .leftJoin(
        'compras',
        'c',
        'ilc.listaCompraFk = c.listaCompraFk AND ilc.usuarioFk = c.usuarioCompraFk',
      )
      .where('ilc.listaCompraFk = :idListaCompras', {
        idListaCompras: filtro.idListaCompras,
      })
      .groupBy(
        'ilc.id, ilc.listaCompraFk, ilc.usuarioFk, ilc.porcentaje, ilc.estado, ilc.esCreador, usuario.nombres, usuario.apellidos',
      );

    if (filtro.estados && filtro.estados.length > 0) {
      sqlQuery.andWhere('ilc.estado IN (:...estados)', {
        estados: filtro.estados,
      });
    }

    return await sqlQuery.getRawMany();
  }

  public async consultarIntegrantesListaCompras(
    filtro: ConsultaIntegrantesFilter,
  ): Promise<IntegranteListaCompra[]> {
    ValidatorsService.validateRequired(filtro.idListaCompras);

    const sqlQuery = this.integranteListaCompraRepository
      .createQueryBuilder('integrantesListaCompra')
      .select('integrantesListaCompra.id', 'id')
      .addSelect('integrantesListaCompra.lista_compra_fk', 'idListaCompra')
      .addSelect('integrantesListaCompra.usuario_fk', 'idUsuario')
      .addSelect('integrantesListaCompra.porcentaje', 'porcentaje')
      .addSelect('integrantesListaCompra.estado', 'estado')
      .addSelect('integrantesListaCompra.es_creador', 'esCreador')
      .addSelect('usuario.nombres', 'nombresUsuario')
      .addSelect('usuario.apellidos', 'apellidosUsuario')
      .innerJoin('integrantesListaCompra.usuario', 'usuario')
      .where('integrantesListaCompra.lista_compra_fk = :idListaCompras', {
        idListaCompras: filtro.idListaCompras,
      });

    if (filtro.estados && filtro.estados.length > 0) {
      sqlQuery.andWhere('integrantesListaCompra.estado IN (:...estados)', {
        estados: filtro.estados,
      });
    }

    if (filtro.nombres) {
      sqlQuery.andWhere(
        '(usuario.nombres like :nombres OR usuario.apellidos like :nombres)',
        {
          nombres: `%${filtro.nombres}%`,
        },
      );
    }

    return await sqlQuery
      .orderBy('integrantesListaCompra.porcentaje', 'DESC')
      .getRawMany();
  }

  private async findByListaCompraAndUsuario(
    idListaCompra: number,
    idUsuario,
  ): Promise<any> {
    return await this.integranteListaCompraRepository.findOne({
      where: {
        listaCompraFk: idListaCompra,
        usuarioFk: idUsuario,
      },
    });
  }
}
