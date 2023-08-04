import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListaCompraRepository } from '../repositories/lista-compra.repository';
import { ListaCompra } from '../entities/lista-compra';

@Injectable()
export class ListaCompraService {
  constructor(
    @InjectRepository(ListaCompraRepository)
    private listaCompraRepository: Repository<ListaCompra>,
  ) {}
}
