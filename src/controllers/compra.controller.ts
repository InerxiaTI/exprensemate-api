import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompraService } from '../services/compra.service';

@ApiTags('Compras')
@Controller('api/compra')
export class CompraController {
  constructor(private readonly service: CompraService) {}
}
