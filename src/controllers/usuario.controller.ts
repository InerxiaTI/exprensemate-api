import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuarioService } from '../services/usuario.service';

@ApiTags('Usuarios')
@Controller('api/usuario')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}
}
