import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../entities/categoria';
import { ValidatorsService } from '../utils/validators.service';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
  ) {}

  public async getCategorias(): Promise<any> {
    const categorias = await this.categoriaRepository.find();
    return categorias;
  }

  public async findById(idCategoria: number): Promise<any> {
    return await this.categoriaRepository.findOne({
      where: {
        id: idCategoria,
      },
    });
  }

  public async categoriaExists(idCategoria: number): Promise<any> {
    ValidatorsService.validateRequired(idCategoria);
    const categoria = await this.findById(idCategoria);
    return !!categoria;
  }
}
