import { EntityRepository, Repository } from 'typeorm';
import { Compra } from '../entities/compra';

@EntityRepository(Compra)
export class CompraRepository extends Repository<Compra> {}
