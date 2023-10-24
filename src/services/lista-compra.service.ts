import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ListaCompra } from '../entities/lista-compra';
import { CrearListaCompraRequest } from '../dtos/crear-lista-compra.request.';
import { ESTADOS_LISTA_COMPRAS } from '../utils/enums/estados-lista-compras.enum';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';
import { ESTADOS_COLABORADORES } from '../utils/enums/estados-colaboradores.enum';
import { ListaCompraDto } from '../dtos/lista-compra.dto';
import { plainToClass } from 'class-transformer';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { ValidatorsService } from '../utils/validators.service';

@Injectable()
export class ListaCompraService {
  constructor(
    @InjectRepository(ListaCompra)
    private listaCompraRepository: Repository<ListaCompra>,
  ) {}

  public async consultarMisListaComprasConFiltro(
    usuarioCreador: number,
    estado: string,
    nombre: string,
  ): Promise<ListaCompraDto[]> {
    const sqlQuery = this.listaCompraRepository
      .createQueryBuilder('listaCompras')
      .select('listaCompras.id', 'id')
      .addSelect('listaCompras.nombre', 'nombre')
      .addSelect('listaCompras.fecha_creacion', 'fechaCreacion')
      .addSelect('listaCompras.estado', 'estado')
      .addSelect('listaCompras.fecha_finalizado', 'fechaFinalizado')
      .addSelect('listaCompras.total_compras', 'totalCompras')
      .addSelect('listaCompras.usuario_creador_fk', 'idUsuarioCreador')
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
      .getRawMany()
      .then((item) => plainToClass(ListaCompraDto, item));
  }

  public async findById(idListaCompra: number): Promise<any> {
    return await this.listaCompraRepository.findOne({
      where: {
        id: idListaCompra,
      },
    });
  }

  /*Transactional*/
  public async crearListaCompras(
    listaCompra: CrearListaCompraRequest,
    codigoGenerado: string,
  ): Promise<ListaCompra> {
    const listaCompraNew: ListaCompra = new ListaCompra();
    listaCompraNew.nombre = listaCompra.nombre;
    listaCompraNew.usuarioCreadorFk = listaCompra.usuarioCreador;
    listaCompraNew.fechaCreacion = new Date();
    listaCompraNew.estado = ESTADOS_LISTA_COMPRAS.CONFIGURANDO;
    listaCompraNew.totalCompras = 0;

    const listaCompraSaved =
      await this.listaCompraRepository.manager.transaction(
        async (entityManager) => {
          let listaCompraSaved = await entityManager.save(listaCompraNew);

          listaCompraSaved.codigoGenerado = listaCompraSaved.id
            .toString()
            .concat(codigoGenerado);
          listaCompraSaved = await entityManager.save(listaCompraSaved);

          const integrante: IntegranteListaCompra = new IntegranteListaCompra();
          integrante.listaCompraFk = listaCompraSaved.id;
          integrante.usuarioFk = listaCompraSaved.usuarioCreadorFk;
          integrante.porcentaje = 100;

          await this.agregarIntegranteCreador(integrante, entityManager);
          return listaCompraSaved;
        },
      );
    return listaCompraSaved;
  }

  /*Transactional*/
  private async agregarIntegranteCreador(
    integranteNew: IntegranteListaCompra,
    entityManager: EntityManager,
  ) {
    integranteNew.porcentaje = 100;
    integranteNew.estado = ESTADOS_COLABORADORES.APROBADO;
    integranteNew.esCreador = true;

    await entityManager.save(integranteNew);
  }

  public async findByCodigoGenerado(codigoGenerado: string): Promise<any> {
    return await this.listaCompraRepository.findOne({
      where: {
        codigoGenerado: codigoGenerado,
      },
    });
  }

  public async cambiarEstadoListaCompras(
    idListaCompras: number,
    estado: ESTADOS_LISTA_COMPRAS,
  ): Promise<any> {
    const listaCompras = await this.findById(idListaCompras);
    listaCompras.estado = estado;
    return await this.listaCompraRepository.save(listaCompras);
  }

  public async listaCompraExists(idListaCompra: number): Promise<any> {
    ValidatorsService.validateRequired(idListaCompra);
    const listaCompra = await this.findById(idListaCompra);
    return !!listaCompra;
  }

  public async validateListaCompras(idListaCompras: number) {
    const listaCompraExist = await this.listaCompraExists(idListaCompras);
    if (!listaCompraExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.LIST_NOT_FOUND);
    }
  }
}
