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

    const integrantesLista: any[] = await this.consultarIntegrantesListaCompras(
      listaCompra.id,
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

  habilitar() {
    // //validar que el porcentaje este entre 1 y 100
    // if (integranteNew.porcentaje < 1 || integranteNew.porcentaje >= 100) {
    //   throw new BusinessException(MESSAGES_EXCEPTION.PERCENT_NOT_ALLOWED);
    // }
    //
    // //calcular porcentajes, restar al creador
    // const integranteCreadorCalculado = this.calcularPorcentajes(
    //   integrantesLista,
    //   integranteNew,
    // );
    //
    // //validar que la suma de porcentajes no suba de 100
    // let sumaTotalPorcentajes =
    //   this.getSumaPorcentajesColaboradores(integrantesLista);
    // sumaTotalPorcentajes += integranteCreadorCalculado.porcentaje;
    // sumaTotalPorcentajes += integranteNew.porcentaje;
    // if (sumaTotalPorcentajes > 100) {
    //   throw new BusinessException(
    //     MESSAGES_EXCEPTION.SUM_OF_PERCENTAGES_EXCEEDS_100_PERCENT,
    //   );
    // }
  }

  private sumarPorcentajesIntegrantes(
    integrantes: IntegranteListaCompra[],
  ): number {
    return integrantes.reduce(
      (suma, integrante) => Number(suma) + Number(integrante.porcentaje),
      0,
    );
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
    integranteCreador.porcentaje = Number(100) - sumaPorcentajesColaboradores;
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

  //servicio para habilitar integrante

  public async consultarIntegrantesListaCompras(
    idListaCompras: number,
  ): Promise<any> {
    ValidatorsService.validateRequired(idListaCompras);

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
      .leftJoin('integrantesListaCompra.usuario', 'usuario')
      .where('integrantesListaCompra.lista_compra_fk = :idListaCompras', {
        idListaCompras: idListaCompras,
      });

    return await sqlQuery
      .orderBy('integrantesListaCompra.porcentaje', 'DESC')
      .getRawMany();
  }
}
