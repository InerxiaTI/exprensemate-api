import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario';
import { ValidatorsService } from '../utils/validators.service';
import { RequestErrorException } from '../utils/exception/request-error.exception';
import { MESSAGES_EXCEPTION } from '../utils/exception/messages-exception.enum';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  public async findById(idUsuario: number) {
    return await this.usuarioRepository.findOne({
      where: {
        id: idUsuario,
      },
    });
  }

  public async usuarioExists(idUsuario: number) {
    ValidatorsService.validateRequired(idUsuario);
    const usuario = await this.findById(idUsuario);
    return !!usuario;
  }

  public async validateUser(idUsuario: number) {
    const usuarioExist = await this.usuarioExists(idUsuario);
    if (!usuarioExist) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.DATA_NOT_FOUND);
    }

    const usuario = await this.findById(idUsuario);
    if (!usuario.activo) {
      throw new RequestErrorException(MESSAGES_EXCEPTION.USER_NOT_ACTIVE);
    }
  }
}
