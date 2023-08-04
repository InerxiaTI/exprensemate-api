import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario';
import { ListaCompra } from './lista-compra';
import { Categoria } from './categoria';

@Entity('compras')
export class Compra {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({
    name: 'lista_compra_fk',
    type: 'int',
    nullable: false,
  })
  listaCompraFk: number;

  @ManyToOne(() => ListaCompra, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'lista_compra_fk' })
  listaCompra: ListaCompra;

  @Column({
    name: 'categoria_fk',
    type: 'int',
    nullable: false,
  })
  categoriaFk: number;

  @ManyToOne(() => Categoria, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'categoria_fk' })
  categoria: Categoria;

  @Column({
    name: 'usuario_compra_fk',
    type: 'int',
    nullable: false,
  })
  usuarioCompraFk: number;

  @ManyToOne(() => Usuario, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_compra_fk' })
  usuarioCompra: Usuario;

  @Column({
    name: 'usuario_registro_fk',
    type: 'int',
    nullable: false,
  })
  usuarioRegistroFk: number;

  @ManyToOne(() => Usuario, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_registro_fk' })
  usuarioRegistro: Usuario;

  @Column({
    name: 'fecha_compra',
    type: 'timestamp',
    nullable: false,
  })
  fechaCompra: Date;

  @Column({
    length: 50,
    name: 'descripcion',
    type: 'varchar',
    nullable: false,
  })
  descripcion: string;

  @Column({
    name: 'valor',
    type: 'numeric',
    nullable: false,
  })
  valor: number;

  @Column({
    name: 'fecha_creacion',
    type: 'timestamp',
    nullable: false,
  })
  fechaCreacion: Date;
}
