import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListaCompraService } from '../services/lista-compra.service';

@ApiTags('Lista de compras')
@Controller('api/lista-compra')
export class ListaCompraController {
  constructor(private readonly service: ListaCompraService) {}
}
