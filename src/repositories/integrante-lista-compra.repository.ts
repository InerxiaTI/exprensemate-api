import { EntityRepository, Repository } from 'typeorm';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';

@EntityRepository(IntegranteListaCompra)
export class IntegranteListaCompraRepository extends Repository<IntegranteListaCompra> {}
