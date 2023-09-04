import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuarioService } from '../services/usuario.service';
import { StandardResponse } from '../utils/http-response/standard-response';
import { GetUsuarioRequest } from '../dtos/get-usuario.request.';
import { UsuarioDto } from '../dtos/usuario.dto';

@ApiTags('Usuarios')
@Controller('api/usuario')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}

  @Post('/login')
  public async getUsuario(
    @Body() getUsuarioRequest: GetUsuarioRequest,
  ): Promise<StandardResponse<UsuarioDto>> {
    return {
      status: HttpStatus.OK,
      body: await this.service.getUsuario(getUsuarioRequest),
    };
  }
}
