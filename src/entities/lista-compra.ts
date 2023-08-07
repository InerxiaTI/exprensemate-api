import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario';

@Entity('listas_compras')
export class ListaCompra {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ length: 50, name: 'nombre', type: 'varchar', nullable: false })
  nombre: string;

  @Column({
    name: 'fecha_creacion',
    type: 'timestamp',
    nullable: false,
  })
  fechaCreacion: Date;

  @Column({ length: 50, name: 'estado', type: 'varchar', nullable: false })
  estado: string;

  @Column({
    name: 'fecha_finalizado',
    type: 'timestamp',
    nullable: false,
  })
  fechaFinalizado: Date;

  @Column({
    name: 'total_compras',
    type: 'numeric',
    nullable: false,
  })
  totalCompras: number;

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

  @Column({
    length: 50,
    name: 'codigo_generado',
    type: 'varchar',
    nullable: true,
  })
  codigoGenerado: string;
}
