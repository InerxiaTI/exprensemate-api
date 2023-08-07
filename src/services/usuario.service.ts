import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario';
import { ValidatorsService } from '../utils/validators.service';

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
}
