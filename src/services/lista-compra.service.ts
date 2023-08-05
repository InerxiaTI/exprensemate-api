import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListaCompra } from '../entities/lista-compra';

@Injectable()
export class ListaCompraService {
  constructor(
    @InjectRepository(ListaCompra)
    private listaCompraRepository: Repository<ListaCompra>,
  ) {}
}
