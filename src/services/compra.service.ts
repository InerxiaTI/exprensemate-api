import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Compra } from '../entities/compra';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';
import { CrearCompraRequest } from '../dtos/crear-compra.request.';
import { plainToClass } from 'class-transformer';
import { ConsultaComprasResponse } from '../dtos/consulta-compras.response';
import { ListaCompra } from '../entities/lista-compra';
import { EditarCompraRequest } from '../dtos/editar-compra.request.';

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
      .select('compras.id', 'id')
      .addSelect('compras.lista_compra_fk', 'listaCompraFk')
      .addSelect('compras.categoria_fk', 'categoriaFk')
      .addSelect('compras.usuario_compra_fk', 'usuarioCompraFk')
      .addSelect('compras.usuario_registro_fk', 'usuarioRegistroFk')
      .addSelect('compras.fecha_compra', 'fechaCompra')
      .addSelect('compras.descripcion', 'descripcion')
      .addSelect('compras.valor', 'valor')
      .addSelect('compras.fecha_creacion', 'fechaCreacion')
      .where('compras.lista_compra_fk = :idListaCompras', {
        idListaCompras: idListaCompras,
      });

    return await sqlQuery
      .orderBy('compras.fecha_compra', 'DESC')
      .getRawMany()
      .then((item) => plainToClass(Compra, item));
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

  /*Transactional*/
  public async editarCompra(
    compraRequest: EditarCompraRequest,
    listaCompras: ListaCompra,
  ): Promise<Compra> {
    const compraOld = await this.findById(compraRequest.idCompra);

    compraOld.categoriaFk = compraRequest.idCategoria;
    compraOld.usuarioCompraFk = compraRequest.idUsuarioCompra;
    compraOld.usuarioRegistroFk = compraRequest.idUsuarioRegistro;
    compraOld.fechaCompra = compraRequest.fechaCompra;
    compraOld.descripcion = compraRequest.descripcion;
    compraOld.valor = compraRequest.valor;

    const compraSaved = await this.compraRepository.manager.transaction(
      async (entityManager) => {
        const compraSaved = await entityManager.save(compraOld);

        const compras: Compra[] = await this.consultarComprasDeListaCompras(
          compraSaved.listaCompraFk,
        );

        const indice = compras.findIndex((c) => c.id === compraSaved.id);
        if (indice !== -1) {
          compras[indice] = compraSaved;
        }
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

  /*Transactional*/
  public async eliminarCompra(idCompra: number, listaCompras: ListaCompra) {
    const compra = await this.findById(idCompra);

    await this.compraRepository.manager.transaction(async (entityManager) => {
      await entityManager.delete(Compra, compra);

      const compras: Compra[] = await this.consultarComprasDeListaCompras(
        compra.listaCompraFk,
      );

      const indice = compras.findIndex((c) => c.id === compra.id);
      if (indice !== -1) {
        compras.splice(indice, 1);
      }
      await this.calcularAndSaveTotalCompras(
        compras,
        listaCompras,
        entityManager,
      );
    });
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

  public async findById(idCompra: number): Promise<Compra> {
    return await this.compraRepository.findOne({
      where: {
        id: idCompra,
      },
    });
  }
}
