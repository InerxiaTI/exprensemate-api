import { EntityRepository, Repository } from 'typeorm';
import { DetalleCierre } from '../entities/detalle-cierre';

@EntityRepository(DetalleCierre)
export class DetalleCierreRepository extends Repository<DetalleCierre> {}
