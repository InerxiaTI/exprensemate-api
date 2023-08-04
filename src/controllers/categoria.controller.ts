import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriaService } from '../services/categoria.service';

@ApiTags('Categorias')
@Controller('api/categoria')
export class CategoriaController {
  constructor(private readonly service: CategoriaService) {}
}
