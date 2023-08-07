import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from '../entities/compra';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';
import { ValidatorsService } from '../utils/validators.service';
import { ListaCompraService } from './lista-compra.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    private listaCompraService: ListaCompraService,
  ) {}

  public async consultarComprasConFiltro(
    filtroComprasRequest: FiltroComprasRequest,
  ): Promise<any> {
    ValidatorsService.validateRequired(filtroComprasRequest);
    ValidatorsService.validateRequired(filtroComprasRequest.idListaCompras);
    ValidatorsService.validateRequired(filtroComprasRequest.idUsuarioCreador);

    const listaCompraExist = await this.listaCompraService.listaCompraExists(
      filtroComprasRequest.idListaCompras,
    );
    if (!listaCompraExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }

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
      .andWhere('compras.usuario_compra_fk = :idUsuarioCreador', {
        idUsuarioCreador: filtroComprasRequest.idUsuarioCreador,
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
    return await sqlQuery.orderBy('compras.fecha_compra', 'DESC').getRawMany();
  }
}
