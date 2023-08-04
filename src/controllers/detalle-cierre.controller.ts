import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DetalleCierreService } from '../services/detalle-cierre.service';

@ApiTags('Detalles Cierre')
@Controller('api/detalle-cierre')
export class DetalleCierreController {
  constructor(private readonly service: DetalleCierreService) {}
}
