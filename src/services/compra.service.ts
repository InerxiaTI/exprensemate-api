import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompraRepository } from '../repositories/compra.repository';
import { Compra } from '../entities/compra';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(CompraRepository)
    private compraRepository: Repository<Compra>,
  ) {}
}
