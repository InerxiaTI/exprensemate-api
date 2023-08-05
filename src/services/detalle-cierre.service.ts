import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleCierre } from '../entities/detalle-cierre';

@Injectable()
export class DetalleCierreService {
  constructor(
    @InjectRepository(DetalleCierre)
    private detalleCierreRepository: Repository<DetalleCierre>,
  ) {}
}
