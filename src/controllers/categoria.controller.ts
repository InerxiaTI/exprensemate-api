import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriaService } from '../services/categoria.service';
import { StandardResponse } from '../utils/http-response/standard-response';

@ApiTags('Categorias')
@Controller('api/categoria')
export class CategoriaController {
  constructor(private readonly service: CategoriaService) {}

  @Get('/filter')
  public async filter(): Promise<StandardResponse<any[]>> {
    return {
      status: HttpStatus.OK,
      body: await this.service.getCategorias(),
    };
  }
}
