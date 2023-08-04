import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario';
import { ListaCompra } from './lista-compra';

@Entity('detalles_cierres')
export class DetalleCierre {
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
    name: 'usuario_deudor_fk',
    type: 'int',
    nullable: false,
  })
  usuarioDeudorFk: number;

  @ManyToOne(() => Usuario, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_deudor_fk' })
  usuarioDeudor: Usuario;

  @Column({
    name: 'usuario_acreedor_fk',
    type: 'int',
    nullable: false,
  })
  usuarioAcreedorFk: number;

  @ManyToOne(() => Usuario, (entity) => entity.id, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_acreedor_fk' })
  usuarioAcreedor: Usuario;

  @Column({
    name: 'total_deuda',
    type: 'numeric',
    nullable: false,
  })
  totalDeuda: number;

  @Column({
    name: 'aprobado',
    type: 'boolean',
    nullable: false,
  })
  aprobado: boolean;

  @Column({
    name: 'fecha_aprobacion',
    type: 'timestamp',
    nullable: false,
  })
  fechaAprobacion: Date;
}
