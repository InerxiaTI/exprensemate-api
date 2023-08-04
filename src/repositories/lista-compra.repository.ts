import { EntityRepository, Repository } from 'typeorm';
import { ListaCompra } from '../entities/lista-compra';

@EntityRepository(ListaCompra)
export class ListaCompraRepository extends Repository<ListaCompra> {}
