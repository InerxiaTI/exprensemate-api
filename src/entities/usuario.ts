import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ length: 50, name: 'nombres', type: 'varchar', nullable: false })
  nombres: string;

  @Column({ length: 50, name: 'apellidos', type: 'varchar', nullable: false })
  apellidos: string;

  @Column({ name: 'activo', type: 'boolean', nullable: false })
  activo: boolean;

  @Column({ length: 50, name: 'correo', type: 'varchar', nullable: false })
  correo: string;

  @Column({ length: 50, name: 'contrasena', type: 'varchar', nullable: false })
  contrasena: string;
}
