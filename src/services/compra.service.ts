import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from '../entities/compra';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';
import { ValidatorsService } from '../utils/validators.service';
import { ListaCompraService } from './lista-compra.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { CrearCompraRequest } from '../dtos/crear-compra.request.';
import { UsuarioService } from './usuario.service';
import { CategoriaService } from './categoria.service';
import { ESTADOS_LISTA_COMPRAS } from '../utils/enums/estados-lista-compras.enum';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    private listaCompraService: ListaCompraService,
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService,
  ) {}

  public async consultarComprasConFiltro(
    filtroComprasRequest: FiltroComprasRequest,
  ): Promise<any> {
    ValidatorsService.validateRequired(filtroComprasRequest);
    ValidatorsService.validateRequired(filtroComprasRequest.idListaCompras);
    ValidatorsService.validateRequired(filtroComprasRequest.idUsuarioCompra);

    await this.validateListaCompras(filtroComprasRequest.idListaCompras);

    await this.usuarioService.validateUser(
      filtroComprasRequest.idUsuarioCompra,
    );

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
    return await sqlQuery.orderBy('compras.fecha_compra', 'DESC').getRawMany();
  }

  public async consultarComprasDeListaCompras(
    idListaCompras: number,
  ): Promise<any> {
    ValidatorsService.validateRequired(idListaCompras);
    await this.validateListaCompras(idListaCompras);

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
      .where('compras.lista_compra_fk = :idListaCompras', {
        idListaCompras: idListaCompras,
      });

    return await sqlQuery.orderBy('compras.fecha_compra', 'DESC').getRawMany();
  }

  private async validateListaCompras(idListaCompras: number) {
    const listaCompraExist = await this.listaCompraService.listaCompraExists(
      idListaCompras,
    );
    if (!listaCompraExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }
  }

  private async validateCategoria(idCategoria: number) {
    const categoria = await this.categoriaService.categoriaExists(idCategoria);
    if (!categoria) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }
  }

  /*Transactional*/
  public async crearCompra(compraRequest: CrearCompraRequest): Promise<any> {
    ValidatorsService.validateRequired(compraRequest);
    ValidatorsService.validateRequired(compraRequest.idListaCompras);
    ValidatorsService.validateRequired(compraRequest.idCategoria);
    ValidatorsService.validateRequired(compraRequest.idUsuarioCompra);
    ValidatorsService.validateRequired(compraRequest.idUsuarioRegistro);
    ValidatorsService.validateRequired(compraRequest.fechaCompra);
    ValidatorsService.validateRequired(compraRequest.valor);

    await this.validateListaCompras(compraRequest.idListaCompras);
    await this.usuarioService.validateUser(compraRequest.idUsuarioCompra);
    await this.usuarioService.validateUser(compraRequest.idUsuarioRegistro);
    await this.validateCategoria(compraRequest.idCategoria);

    if (compraRequest.valor <= 0) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.AMOUNT_NOT_ALLOWED);
    }

    const listaCompra = await this.listaCompraService.findById(
      compraRequest.idListaCompras,
    );
    if (listaCompra.estado !== ESTADOS_LISTA_COMPRAS.PENDIENTE) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ADD_PURCHASE_NOT_ALLOWED,
      );
    }

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
        await this.listaCompraService.saveTotalCompras(
          compras,
          compraSaved.listaCompraFk,
          entityManager,
        );

        return compraSaved;
      },
    );
    return compraSaved;
  }
}
