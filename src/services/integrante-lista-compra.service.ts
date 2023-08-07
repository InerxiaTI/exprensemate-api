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
    integranteNew.habilitado = true;
    integranteNew.esCreador = true;

    await entityManager.save(integranteNew);
  }

  public async agregarIntegranteColaborador(
    integranteNew: IntegranteListaCompra,
    listaCompra: ListaCompra,
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

    let isUsuarioCreador = false;
    if (listaCompra.usuarioCreadorFk === integranteNew.usuarioFk) {
      isUsuarioCreador = true;
    }

    const integrantesLista: IntegranteListaCompra[] =
      await this.consultarIntegrantesListaCompras(integranteNew.listaCompraFk);

    //validar si es usuario creador, usuario creador ya esta
    if (isUsuarioCreador) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.DUPLICATE_USER_ON_SHOPPING_LIST,
      );
    }

    const integranteFound = integrantesLista.find(
      (integrante) => integrante.usuarioFk === integranteNew.usuarioFk,
    );

    //validar que el usuario no se repita
    if (integranteFound && integranteFound.id) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.DUPLICATE_USER_ON_SHOPPING_LIST,
      );
    }
    //validar que el porcentaje este entre 1 y 100
    if (integranteNew.porcentaje < 1 || integranteNew.porcentaje >= 100) {
      throw new BusinessException(MESSAGES_EXCEPTION.PERCENT_NOT_ALLOWED);
    }

    //calcular porcentajes, restar al creador
    const integranteCreadorCalculado = this.calcularPorcentajes(
      integrantesLista,
      integranteNew,
    );

    //validar que la suma de porcentajes no suba de 100
    let sumaTotalPorcentajes =
      this.getSumaPorcentajesColaboradores(integrantesLista);
    sumaTotalPorcentajes += integranteCreadorCalculado.porcentaje;
    sumaTotalPorcentajes += integranteNew.porcentaje;
    if (sumaTotalPorcentajes > 100) {
      throw new BusinessException(
        MESSAGES_EXCEPTION.SUM_OF_PERCENTAGES_EXCEEDS_100_PERCENT,
      );
    }

    //poner habilitado en false
  }

  private sumarPorcentajesIntegrantes(integrantes: IntegranteListaCompra[]) {
    return integrantes.reduce(
      (suma, integrante) => suma + integrante.porcentaje,
      0,
    );
  }

  private calcularPorcentajes(
    integrantesLista: IntegranteListaCompra[],
    integranteNew: IntegranteListaCompra,
  ) {
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
  ) {
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
      .addSelect('integrantesListaCompra.habilitado', 'habilitado')
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
