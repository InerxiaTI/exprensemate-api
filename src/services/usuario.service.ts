import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { Usuario } from '../entities/usuario';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(UsuarioRepository)
    private usuarioRepository: Repository<Usuario>,
  ) {}
}
