import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Compra } from '../entities/compra';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';
import { CrearCompraRequest } from '../dtos/crear-compra.request.';
import { plainToClass } from 'class-transformer';
import { ConsultaComprasResponse } from '../dtos/consulta-compras.response';
import { ListaCompra } from '../entities/lista-compra';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
  ) {}

  public async consultarComprasConFiltro(
    filtroComprasRequest: FiltroComprasRequest,
  ): Promise<ConsultaComprasResponse[]> {
    const sqlQuery = this.compraRepository
      .createQueryBuilder('compras')
      .select('compras.id', 'id')
      .addSelect('compras.lista_compra_fk', 'idListaCompra')
      .addSelect('compras.categoria_fk', 'idCategoria')
      .addSelect('compras.usuario_compra_fk', 'idUsuarioCompra')
      .addSelect('compras.usuario_registro_fk', 'idUsuarioRegistro')
      .addSelect('compras.fecha_compra', 'fechaCompra')
      .addSelect('compras.descripcion', 'descripcion')
      .addSelect('compras.valor', 'valor')
      .addSelect('compras.fecha_creacion', 'fechaCreacion')
      .addSelect('categoria.nombre', 'nombreCategoria')
      .addSelect('usuarioCompra.nombres', 'nombresUsuarioCompra')
      .addSelect('usuarioCompra.apellidos', 'apellidosUsuarioCompra')
      .addSelect('usuarioRegistro.nombres', 'nombresUsuarioRegistro')
      .addSelect('usuarioRegistro.apellidos', 'apellidosUsuarioRegistro')
      .addSelect('categoria.nombre', 'nombreCategoria')
      .innerJoin('compras.categoria', 'categoria')
      .innerJoin('compras.usuarioCompra', 'usuarioCompra')
      .innerJoin('compras.usuarioRegistro', 'usuarioRegistro')
      .where('compras.lista_compra_fk = :idListaCompras', {
        idListaCompras: filtroComprasRequest.idListaCompras,
      })
      .andWhere('compras.usuario_compra_fk = :idUsuarioCompra', {
        idUsuarioCompra: filtroComprasRequest.idUsuarioCompra,
      });

    if (
      filtroComprasRequest.categoria ||
      filtroComprasRequest.categoria === ''
    ) {
      sqlQuery.andWhere('categoria.nombre like :categoria', {
        categoria: `%${filtroComprasRequest.categoria}%`,
      });
    }

    if (
      filtroComprasRequest.descripcion ||
      filtroComprasRequest.descripcion === ''
    ) {
      sqlQuery.andWhere('compras.descripcion like :descripcion', {
        descripcion: `%${filtroComprasRequest.descripcion}%`,
      });
    }
    return await sqlQuery
      .orderBy('compras.fecha_compra', 'DESC')
      .getRawMany()
      .then((item) => plainToClass(ConsultaComprasResponse, item));
  }

  private async consultarComprasDeListaCompras(
    idListaCompras: number,
  ): Promise<Compra[]> {
    const sqlQuery = this.compraRepository
      .createQueryBuilder('compras')
      .select('compras.id')
      .addSelect('compras.lista_compra_fk')
      .addSelect('compras.categoria_fk')
      .addSelect('compras.usuario_compra_fk')
      .addSelect('compras.usuario_registro_fk')
      .addSelect('compras.fecha_compra')
      .addSelect('compras.descripcion')
      .addSelect('compras.valor')
      .addSelect('compras.fecha_creacion')
      .where('compras.lista_compra_fk = :idListaCompras', {
        idListaCompras: idListaCompras,
      });

    return await sqlQuery.orderBy('compras.fecha_compra', 'DESC').getRawMany();
  }

  /*Transactional*/
  public async crearCompra(
    compraRequest: CrearCompraRequest,
    listaCompras: ListaCompra,
  ): Promise<Compra> {
    const compra: Compra = new Compra();
    compra.listaCompraFk = compraRequest.idListaCompras;
    compra.categoriaFk = compraRequest.idCategoria;
    compra.usuarioCompraFk = compraRequest.idUsuarioCompra;
    compra.usuarioRegistroFk = compraRequest.idUsuarioRegistro;
    compra.fechaCompra = compraRequest.fechaCompra;
    compra.descripcion = compraRequest.descripcion;
    compra.valor = compraRequest.valor;
    compra.fechaCreacion = new Date();

    const compraSaved = await this.compraRepository.manager.transaction(
      async (entityManager) => {
        const compraSaved = await entityManager.save(compra);

        const compras: Compra[] = await this.consultarComprasDeListaCompras(
          compraSaved.listaCompraFk,
        );
        compras.push(compraSaved);
        await this.calcularAndSaveTotalCompras(
          compras,
          listaCompras,
          entityManager,
        );

        return compraSaved;
      },
    );
    return compraSaved;
  }

  private async calcularAndSaveTotalCompras(
    compras: Compra[],
    listaCompras: ListaCompra,
    entityManager: EntityManager,
  ) {
    const totalCompras = compras.reduce(
      (suma, compra) => Number(suma) + Number(compra.valor),
      0,
    );
    listaCompras.totalCompras = totalCompras;
    await entityManager.save(listaCompras);
  }
}
