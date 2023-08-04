import { EntityRepository, Repository } from 'typeorm';
import { Categoria } from '../entities/categoria';

@EntityRepository(Categoria)
export class CategoriaRepository extends Repository<Categoria> {}
