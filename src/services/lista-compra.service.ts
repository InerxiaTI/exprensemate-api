import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ListaCompra } from '../entities/lista-compra';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { CrearListaCompraRequest } from '../dtos/crear-lista-compra.request.';
import { UsuarioService } from './usuario.service';
import { ESTADOS_LISTA_COMPRAS } from '../utils/enums/estados-lista-compras.enum';
import { CodigoAleatorioService } from '../utils/codigo-aleatorio.service';
import { ValidatorsService } from '../utils/validators.service';
import { IntegranteListaCompraService } from './integrante-lista-compra.service';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';
import { Compra } from '../entities/compra';
import { AgregarColaboradorRequest } from '../dtos/agregar-colaborador.request.';
import { AprobarRechazarColaboradorRequest } from '../dtos/aprobar-rechazar-colaborador.request.';
import { BusinessException } from '../utils/exception/business.exception';

@Injectable()
export class ListaCompraService {
  constructor(
    @InjectRepository(ListaCompra)
    private listaCompraRepository: Repository<ListaCompra>,
    private usuarioService: UsuarioService,
    private integranteListaCompraService: IntegranteListaCompraService,
    private codigoAleatorioService: CodigoAleatorioService,
  ) {}

  public async consultarListaComprasConFiltro(
    usuarioCreador: number,
    estado: string,
    nombre: string,
  ): Promise<any> {
    ValidatorsService.validateRequired(usuarioCreador);

    await this.usuarioService.validateUser(usuarioCreador);

    const sqlQuery = this.listaCompraRepository
      .createQueryBuilder('listaCompras')
      .select('listaCompras.id', 'id')
      .addSelect('listaCompras.nombre', 'nombre')
      .addSelect('listaCompras.fecha_creacion', 'fechaCreacion')
      .addSelect('listaCompras.estado', 'estado')
      .addSelect('listaCompras.fecha_finalizado', 'fechaFinalizado')
      .addSelect('listaCompras.total_compras', 'totalCompras')
      .addSelect('listaCompras.usuario_creador_fk', 'usuarioCreador')
      .addSelect('listaCompras.codigo_generado', 'codigoGenerado')
      .where('listaCompras.usuario_creador_fk = :usuarioCreador', {
        usuarioCreador: usuarioCreador,
      });

    if (estado || estado === '') {
      sqlQuery.andWhere('listaCompras.estado = :estado', {
        estado: estado,
      });
    }

    if (nombre || nombre === '') {
      sqlQuery.andWhere('listaCompras.nombre like :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    return await sqlQuery
      .orderBy('listaCompras.fecha_creacion', 'DESC')
      .getRawMany();
  }

  public async findById(idListaCompra: number): Promise<any> {
    return await this.listaCompraRepository.findOne({
      where: {
        id: idListaCompra,
      },
    });
  }

  public async listaCompraExists(idListaCompra: number): Promise<any> {
    ValidatorsService.validateRequired(idListaCompra);
    const listaCompra = await this.findById(idListaCompra);
    return !!listaCompra;
  }

  /*Transactional*/
  public async crearListaCompras(
    listaCompra: CrearListaCompraRequest,
  ): Promise<any> {
    ValidatorsService.validateRequired(listaCompra.nombre);
    ValidatorsService.validateRequired(listaCompra.usuarioCreador);

    await this.usuarioService.validateUser(listaCompra.usuarioCreador);

    const listaCompraNew: ListaCompra = new ListaCompra();
    listaCompraNew.nombre = listaCompra.nombre;
    listaCompraNew.usuarioCreadorFk = listaCompra.usuarioCreador;
    listaCompraNew.fechaCreacion = new Date();
    listaCompraNew.estado = ESTADOS_LISTA_COMPRAS.CONFIGURANDO;

    const listaCompraSaved =
      await this.listaCompraRepository.manager.transaction(
        async (entityManager) => {
          let listaCompraSaved = await entityManager.save(listaCompraNew);

          const codigoGenerado =
            this.codigoAleatorioService.generarCodigoAleatorio();
          listaCompraSaved.codigoGenerado = listaCompraSaved.id
            .toString()
            .concat(codigoGenerado);
          listaCompraSaved = await entityManager.save(listaCompraSaved);

          const integrante: IntegranteListaCompra = new IntegranteListaCompra();
          integrante.listaCompraFk = listaCompraSaved.id;
          integrante.usuarioFk = listaCompraSaved.usuarioCreadorFk;
          integrante.porcentaje = 100;

          await this.integranteListaCompraService.agregarIntegranteCreador(
            integrante,
            entityManager,
          );
          return listaCompraSaved;
        },
      );
    return listaCompraSaved;
  }

  /*Transactional*/
  public async saveTotalCompras(
    compras: Compra[],
    idListaCompras: number,
    entityManager: EntityManager,
  ) {
    const totalCompras = compras.reduce(
      (suma, compra) => Number(suma) + Number(compra.valor),
      0,
    );
    const listaCompras = await this.findById(idListaCompras);
    listaCompras.totalCompras = totalCompras;
    await entityManager.save(listaCompras);
  }

  public async findByCodigoGenerado(codigoGenerado: string): Promise<any> {
    return await this.listaCompraRepository.findOne({
      where: {
        codigoGenerado: codigoGenerado,
      },
    });
  }

  public async agregarIntegranteColaborador(
    colaboradorRequest: AgregarColaboradorRequest,
  ): Promise<any> {
    ValidatorsService.validateRequired(colaboradorRequest);
    ValidatorsService.validateRequired(colaboradorRequest.codigoGenerado);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioColaborador);

    const listaCompra = await this.findByCodigoGenerado(
      colaboradorRequest.codigoGenerado,
    );
    if (!listaCompra) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }

    if (listaCompra.estado !== ESTADOS_LISTA_COMPRAS.CONFIGURANDO) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ADD_COLLABORATOR_NOT_ALLOWED,
      );
    }

    await this.usuarioService.validateUser(
      colaboradorRequest.idUsuarioColaborador,
    );

    const integranteSaved =
      await this.integranteListaCompraService.agregarIntegranteColaborador(
        colaboradorRequest.idUsuarioColaborador,
        listaCompra,
      );
    return integranteSaved;
  }

  public async aprobarRechazarColaborador(
    colaboradorRequest: AprobarRechazarColaboradorRequest,
  ): Promise<any> {
    ValidatorsService.validateRequired(colaboradorRequest);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioCreador);
    ValidatorsService.validateRequired(colaboradorRequest.idUsuarioColaborador);
    ValidatorsService.validateRequired(colaboradorRequest.idListaCompras);

    await this.usuarioService.validateUser(colaboradorRequest.idUsuarioCreador);
    await this.usuarioService.validateUser(
      colaboradorRequest.idUsuarioColaborador,
    );

    await this.validateListaCompras(colaboradorRequest.idListaCompras);

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
    return integranteSaved;
  }

  //habilitar

  //calcular porcentaje

  //validar el porcentaje
  // if (
  //   colaboradorRequest.porcentaje < 1 ||
  //   colaboradorRequest.porcentaje >= 100
  // ) {
  //   throw new BusinessException(MESSAGES_EXCEPTION.PERCENT_NOT_ALLOWED);
  // }

  public async validateListaCompras(idListaCompras: number) {
    const listaCompraExist = await this.listaCompraExists(idListaCompras);
    if (!listaCompraExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }
  }
}
