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
}
