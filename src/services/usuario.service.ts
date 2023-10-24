import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario';
import { ValidatorsService } from '../utils/validators.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';
import { GetUsuarioRequest } from '../dtos/get-usuario.request.';
import { UsuarioDto } from '../dtos/usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  public async findById(idUsuario: number): Promise<any> {
    return await this.usuarioRepository.findOne({
      where: {
        id: idUsuario,
      },
    });
  }

  public async usuarioExists(idUsuario: number): Promise<any> {
    ValidatorsService.validateRequired(idUsuario);
    const usuario = await this.findById(idUsuario);
    return !!usuario;
  }

  public async validateUser(idUsuario: number) {
    const usuarioExist = await this.usuarioExists(idUsuario);
    if (!usuarioExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_FOUND);
    }

    const usuario = await this.findById(idUsuario);
    if (!usuario.activo) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_ACTIVE);
    }
  }

  public async getUsuario(
    getUsuarioRequest: GetUsuarioRequest,
  ): Promise<UsuarioDto> {
    ValidatorsService.validateRequired(getUsuarioRequest.correo);
    ValidatorsService.validateRequired(getUsuarioRequest.pass);

    const usuario = await this.usuarioRepository.findOne({
      where: {
        correo: getUsuarioRequest.correo,
      },
    });

    if (!usuario || usuario.contrasena !== getUsuarioRequest.pass) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_FOUND);
    }
    if (!usuario.activo) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_ACTIVE);
    }
    return {
      activo: usuario.activo,
      apellidos: usuario.apellidos,
      contrasena: usuario.contrasena,
      correo: usuario.correo,
      id: usuario.id,
      nombres: usuario.nombres,
    };
  }
}
