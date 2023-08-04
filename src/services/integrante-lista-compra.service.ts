import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegranteListaCompraRepository } from '../repositories/integrante-lista-compra.repository';
import { IntegranteListaCompra } from '../entities/integrante-lista-compra';

@Injectable()
export class IntegranteListaCompraService {
  constructor(
    @InjectRepository(IntegranteListaCompraRepository)
    private integranteListaCompraRepository: Repository<IntegranteListaCompra>,
  ) {}
}
