import { Injectable } from '@nestjs/common';
import { CompraService } from '../services/compra.service';
import { ListaCompraService } from '../services/lista-compra.service';
import { UsuarioService } from '../services/usuario.service';
import { CategoriaService } from '../services/categoria.service';
import { FiltroComprasRequest } from '../dtos/filtro-compras.request.';
import { ConsultaComprasResponse } from '../dtos/consulta-compras.response';
import { ValidatorsService } from '../utils/validators.service';
import { CrearCompraRequest } from '../dtos/crear-compra.request.';
import { CompraDto } from '../dtos/compra.dto';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { ESTADOS_LISTA_COMPRAS } from '../utils/enums/estados-lista-compras.enum';
import { EditarCompraRequest } from '../dtos/editar-compra.request.';
import { BusinessException } from '../utils/exception/business.exception';

@Injectable()
export class CompraFacade {
  constructor(
    private compraService: CompraService,
    private listaCompraService: ListaCompraService,
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService,
  ) {}

  public async consultarComprasConFiltro(
    filtroComprasRequest: FiltroComprasRequest,
  ): Promise<ConsultaComprasResponse[]> {
    ValidatorsService.validateRequired(filtroComprasRequest);
    ValidatorsService.validateRequired(filtroComprasRequest.idListaCompras);
    ValidatorsService.validateRequired(filtroComprasRequest.idUsuarioCompra);

    await this.listaCompraService.validateListaCompras(
      filtroComprasRequest.idListaCompras,
    );

    await this.usuarioService.validateUser(
      filtroComprasRequest.idUsuarioCompra,
    );

    return await this.compraService.consultarComprasConFiltro(
      filtroComprasRequest,
    );
  }

  private async validateCategoria(idCategoria: number) {
    const categoria = await this.categoriaService.categoriaExists(idCategoria);
    if (!categoria) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }
  }

  /*Transactional*/
  public async crearCompra(
    compraRequest: CrearCompraRequest,
  ): Promise<CompraDto> {
    ValidatorsService.validateRequired(compraRequest);
    ValidatorsService.validateRequired(compraRequest.idListaCompras);
    ValidatorsService.validateRequired(compraRequest.idCategoria);
    ValidatorsService.validateRequired(compraRequest.idUsuarioCompra);
    ValidatorsService.validateRequired(compraRequest.idUsuarioRegistro);
    ValidatorsService.validateRequired(compraRequest.fechaCompra);
    ValidatorsService.validateRequired(compraRequest.valor);

    await this.usuarioService.validateUser(compraRequest.idUsuarioCompra);
    await this.usuarioService.validateUser(compraRequest.idUsuarioRegistro);
    await this.validateCategoria(compraRequest.idCategoria);

    if (compraRequest.valor <= 0) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.AMOUNT_NOT_ALLOWED);
    }

    const listaCompra = await this.listaCompraService.findById(
      compraRequest.idListaCompras,
    );

    await this.listaCompraService.validateListaCompras(
      compraRequest.idListaCompras,
    );

    if (listaCompra.estado !== ESTADOS_LISTA_COMPRAS.PENDIENTE) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ADD_PURCHASE_NOT_ALLOWED,
      );
    }

    const compraSaved = await this.compraService.crearCompra(
      compraRequest,
      listaCompra,
    );

    return {
      id: compraSaved.id,
      descripcion: compraSaved.descripcion,
      fechaCompra: compraSaved.fechaCompra,
      fechaCreacion: compraSaved.fechaCreacion,
      idCategoria: compraSaved.categoriaFk,
      idListaCompra: compraSaved.listaCompraFk,
      idUsuarioCompra: compraSaved.usuarioCompraFk,
      idUsuarioRegistro: compraSaved.usuarioRegistroFk,
      valor: compraSaved.valor,
    };
  }

  /*Transactional*/
  public async editarCompra(
    compraRequest: EditarCompraRequest,
  ): Promise<CompraDto> {
    ValidatorsService.validateRequired(compraRequest);
    ValidatorsService.validateRequired(compraRequest.idCompra);
    ValidatorsService.validateRequired(compraRequest.idUsuarioRegistro);

    const compra = await this.compraService.findById(compraRequest.idCompra);
    if (!compra) {
      throw new BusinessException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }

    if (compraRequest.idUsuarioCompra) {
      await this.usuarioService.validateUser(compraRequest.idUsuarioCompra);
    }
    if (compraRequest.idUsuarioRegistro) {
      await this.usuarioService.validateUser(compraRequest.idUsuarioRegistro);
    }
    if (compraRequest.idCategoria) {
      await this.validateCategoria(compraRequest.idCategoria);
    }

    if (compraRequest.valor <= 0) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.AMOUNT_NOT_ALLOWED);
    }

    const listaCompra = await this.listaCompraService.findById(
      compra.listaCompraFk,
    );

    await this.listaCompraService.validateListaCompras(listaCompra.id);

    if (listaCompra.estado !== ESTADOS_LISTA_COMPRAS.PENDIENTE) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ADD_PURCHASE_NOT_ALLOWED,
      );
    }

    const compraSaved = await this.compraService.editarCompra(
      compraRequest,
      listaCompra,
    );

    return {
      id: compraSaved.id,
      descripcion: compraSaved.descripcion,
      fechaCompra: compraSaved.fechaCompra,
      fechaCreacion: compraSaved.fechaCreacion,
      idCategoria: compraSaved.categoriaFk,
      idListaCompra: compraSaved.listaCompraFk,
      idUsuarioCompra: compraSaved.usuarioCompraFk,
      idUsuarioRegistro: compraSaved.usuarioRegistroFk,
      valor: compraSaved.valor,
    };
  }

  /*Transactional*/
  public async eliminarCompra(idCompra: number) {
    ValidatorsService.validateRequired(idCompra);

    const compra = await this.compraService.findById(idCompra);
    if (!compra) {
      throw new BusinessException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }

    await this.listaCompraService.validateListaCompras(compra.listaCompraFk);

    const listaCompra = await this.listaCompraService.findById(
      compra.listaCompraFk,
    );

    if (listaCompra.estado !== ESTADOS_LISTA_COMPRAS.PENDIENTE) {
      throw new RequestErrorException(
        MESSAGES_EXCEPTION.ADD_PURCHASE_NOT_ALLOWED,
      );
    }

    await this.compraService.eliminarCompra(idCompra, listaCompra);
  }
}
