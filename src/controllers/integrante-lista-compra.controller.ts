import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegranteListaCompraService } from '../services/integrante-lista-compra.service';

@ApiTags('Integrantes de lista de compras')
@Controller('api/integrantes-lista-compra')
export class IntegranteListaCompraController {
  constructor(private readonly service: IntegranteListaCompraService) {}
}
