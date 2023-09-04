export class ListaCompraDto {
  id: number;
  nombre: string;
  fechaCreacion: Date;
  estado: string;
  fechaFinalizado: Date;
  totalCompras: number;
  idUsuarioCreador: number;
  codigoGenerado: string;
}
