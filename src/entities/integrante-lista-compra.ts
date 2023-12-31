import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario';
import { ListaCompra } from './lista-compra';

@Entity('integrantes_listas_compras')
export class IntegranteListaCompra {
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
    name: 'usuario_fk',
    type: 'int',
    nullable: false,
  })
  usuarioFk: number;

  @ManyToOne(() => Usuario, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_fk' })
  usuario: Usuario;

  @Column({
    name: 'porcentaje',
    type: 'numeric',
    nullable: false,
  })
  porcentaje: number;

  @Column({
    name: 'habilitado',
    type: 'boolean',
    nullable: false,
  })
  habilitado: boolean;
}
