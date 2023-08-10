import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';
import { ValidatorsService } from '../utils/validators.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { UsuarioService } from './usuario.service';
import { ListaCompra } from '../entities/lista-compra';
import { BusinessException } from '../utils/exception/business.exception';
import { ESTADOS_COLABORADORES } from '../utils/enums/estados-colaboradores.enum';
import { AprobarRechazarColaboradorRequest } from '../dtos/aprobar-rechazar-colaborador.request.';
import { AsignarPorcentajeColaboradorRequest } from '../dtos/asignar-porcentaje-colaborador.request.';
import { ConsultaIntegrantesFilter } from '../dtos/consulta-integrantes.filter.';

@Injectable()
export class IntegranteListaCompraService {
  constructor(
    @InjectRepository(IntegranteListaCompra)
    private integranteListaCompraRepository: Repository<IntegranteListaCompra>,
    private usuarioService: UsuarioService,
  ) {}

  /*Transactional*/
  public async agregarIntegranteCreador(
    integranteNew: IntegranteListaCompra,
    entityManager: EntityManager,
  ) {
    ValidatorsService.validateRequired(integranteNew.usuarioFk);
    ValidatorsService.validateRequired(integranteNew.listaCompraFk);

    const usuarioExist = await this.usuarioService.usuarioExists(
      integranteNew.usuarioFk,
    );
    if (!usuarioExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }

    const usuario = await this.usuarioService.findById(integranteNew.usuarioFk);
    if (!usuario.activo) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_ACTIVE);
    }

    integranteNew.porcentaje = 100;
    integranteNew.estado = ESTADOS_COLABORADORES.APROBADO;
    integranteNew.esCreador = true;

    await entityManager.save(integranteNew);
  }

  public async agregarIntegranteColaborador(
    idUsuarioColaborador: number,
    listaCompra: ListaCompra,
  ): Promise<any> {
    ValidatorsService.validateRequired(idUsuarioColaborador);

    if (listaCompra.usuarioCreadorFk === idUsuarioColaborador) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.DUPLICATE_USER_ON_PURCHASE_LIST,
      );
    }

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
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
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
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
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

  public async consultarIntegrantesListaCompras(
    filtro: ConsultaIntegrantesFilter,
  ): Promise<any> {
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

  public async findByListaCompraAndUsuario(
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
