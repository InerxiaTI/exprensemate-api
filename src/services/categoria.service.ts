import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriaRepository } from '../repositories/categoria.repository';
import { Repository } from 'typeorm';
import { Categoria } from '../entities/categoria';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(CategoriaRepository)
    private categoriaRepository: Repository<Categoria>,
  ) {}
}
