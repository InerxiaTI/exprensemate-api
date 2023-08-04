import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ length: 50, name: 'nombre', type: 'varchar', nullable: false })
  nombre: string;

  @Column({
    name: 'usuario_creador_fk',
    type: 'int',
    nullable: false,
  })
  usuarioCreadorFk: number;

  @ManyToOne(() => Usuario, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_creador_fk' })
  usuarioCreador: Usuario;
}
