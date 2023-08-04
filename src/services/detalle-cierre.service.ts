import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleCierreRepository } from '../repositories/detalle-cierre.repository';
import { DetalleCierre } from '../entities/detalle-cierre';

@Injectable()
export class DetalleCierreService {
  constructor(
    @InjectRepository(DetalleCierreRepository)
    private detalleCierreRepository: Repository<DetalleCierre>,
  ) {}
}
