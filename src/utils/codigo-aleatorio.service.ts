import { Injectable } from '@nestjs/common';

@Injectable()
export class CodigoAleatorioService {
  generarCodigoAleatorio(): string {
    //TODO Parametrizar caracteres
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const cantidadCaracteres = 6;
    let codigo = '';
    const caracteresUtilizados = new Set<string>();

    for (let i = 0; i < cantidadCaracteres; ) {
      const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
      const caracterAleatorio = caracteres.charAt(indiceAleatorio);

      if (!caracteresUtilizados.has(caracterAleatorio)) {
        caracteresUtilizados.add(caracterAleatorio);
        codigo += caracterAleatorio;
        i++;
      }
    }
    return codigo;
  }
}
