import { EntityRepository, Repository } from 'typeorm';
import { Usuario } from '../entities/usuario';

@EntityRepository(Usuario)
export class UsuarioRepository extends Repository<Usuario> {}
