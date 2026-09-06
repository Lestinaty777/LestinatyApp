import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/algoritmo/mapaProcedural.ts', 'r') as f:
    content = f.read()

# Update DecoracionProcedural to include volteado
content = content.replace("export type DecoracionProcedural = { assetId: string; escala: number; lado: LadoMapa; x: number; y: number };",
                          "export type DecoracionProcedural = { assetId: string; escala: number; lado: LadoMapa; x: number; y: number; volteado?: boolean };")

# Rewrite generarMapaProcedural
new_generar = """
export function generarMapaProcedural({ ancho, cantidadNodos, tema }: { ancho: number; cantidadNodos: number; tema: TemaMapaProcedural }): MapaProcedural {
  const aleatorio = crearAleatorio(`${tema.categoriaId}:${tema.id}`);
  const centro = ancho / 2;
  const nodos: NodoProcedural[] = [];
  const lamparas: LamparaProcedural[] = [];
  const hojas: HojasProcedurales[] = [];
  const decoraciones: DecoracionProcedural[] = [];
  const assetsBioma = registroBiomas[tema.categoriaId].assets.filter(a => a.id !== 'base');

  const arboles = assetsBioma.filter(a => a.id.endsWith('-01') || a.id.endsWith('-02'));
  const arbustos = assetsBioma.filter(a => a.id.endsWith('-04') || a.id.endsWith('-05') || a.id.endsWith('-06'));
  const flores = assetsBioma.filter(a => a.id.endsWith('-07'));

  type CajaColision = { x: number; y: number; w: number; h: number };
  const cajasColision: CajaColision[] = [];

  function hayColision(caja: CajaColision): boolean {
    for (const c of cajasColision) {
      // Un margen de 10px para evitar que queden pegados
      if (caja.x < c.x + c.w + 10 && caja.x + caja.w > c.x - 10 && caja.y < c.y + c.h + 10 && caja.y + caja.h > c.y - 10) {
        return true;
      }
    }
    return false;
  }

  // Reservamos una caja gigante en el inicio para la base estructural (-03) que está en ContenedorMapaSenderos
  cajasColision.push({ x: 0, y: -80, w: ancho, h: 100 });

  for (let indice = 0; indice < cantidadNodos; indice += 1) {
    const signo = indice === 0 ? 0 : indice % 2 === 0 ? 1 : -1;
    const amplitud = indice === 0 ? 0 : 34 + Math.round(aleatorio() * 12);
    const x = centro + signo * amplitud;
    const y = 54 + indice * 112;
    nodos.push({ id: `nodo-${indice}`, x, y });
    
    // El nodo es aprox 72x72
    cajasColision.push({ x: x - 36, y: y - 36, w: 72, h: 72 });

    if (indice === 0) continue;

    const nodoEstaIzquierda = x < centro;
    const ladoLampara: LadoMapa = nodoEstaIzquierda ? 'derecha' : 'izquierda';
    const ladoDecoracion: LadoMapa = nodoEstaIzquierda ? 'izquierda' : 'derecha';
    const tamanoHojas = 30 + Math.round(aleatorio() * 5);
    const altoHojas = tamanoHojas * (35 / 26);
    const margenNodo = 33;

    hojas.push({
      lado: ladoLampara,
      tamano: tamanoHojas,
      x: ladoLampara === 'derecha' ? x + margenNodo : x - tamanoHojas - margenNodo,
      y: y - altoHojas / 2,
    });

    const lamparaX = ladoLampara === 'derecha' ? ancho - 128 : 84;
    const lamparaY = y - 16;
    const tamanoLampara = 23 + Math.round(aleatorio() * 3);
    lamparas.push({
      lado: ladoLampara,
      tamano: tamanoLampara,
      x: lamparaX,
      y: lamparaY,
    });
    // La lámpara es aprox 34x40 visualmente
    cajasColision.push({ x: lamparaX, y: lamparaY, w: 34, h: 40 });

    // GENERACIÓN DE CLÚSTERS DE BIOMA (Árbol -> Arbustos)
    if (aleatorio() < tema.densidadDecoracion && arboles.length > 0) {
      const arbol = arboles[Math.floor(aleatorio() * arboles.length)];
      const escalaArbol = 0.6 + aleatorio() * 0.35; // Mediano-pequeño
      const anchoArbol = 172 * escalaArbol;
      const altoArbol = 172 * escalaArbol;
      const volteado = aleatorio() > 0.5;
      
      // Strictamente en los costados
      const xArbol = ladoDecoracion === 'izquierda' ? -anchoArbol * (0.3 + aleatorio() * 0.2) : ancho - anchoArbol * (0.7 - aleatorio() * 0.2);
      const yArbol = y - 86 - aleatorio() * 22;

      const cajaArbol = { x: xArbol, y: yArbol, w: anchoArbol, h: altoArbol };

      if (!hayColision(cajaArbol)) {
        decoraciones.push({
          assetId: arbol.id,
          escala: escalaArbol,
          lado: ladoDecoracion,
          x: xArbol,
          y: yArbol,
          volteado
        });
        cajasColision.push(cajaArbol);

        // Intentar agregar Arbusto al lado del árbol (hacia adentro)
        if (aleatorio() < 0.6 && arbustos.length > 0) {
          const arbusto = arbustos[Math.floor(aleatorio() * arbustos.length)];
          const escalaArbusto = escalaArbol * (0.4 + aleatorio() * 0.2); // Pequeño
          const anchoArbusto = 172 * escalaArbusto;
          
          const xArbusto = ladoDecoracion === 'izquierda' ? xArbol + anchoArbol * 0.7 : xArbol - anchoArbusto + anchoArbol * 0.3;
          const yArbusto = yArbol + altoArbol - (172 * escalaArbusto) + (aleatorio() * 20 - 10);
          
          const cajaArbusto = { x: xArbusto, y: yArbusto, w: anchoArbusto, h: 172 * escalaArbusto };
          
          if (!hayColision(cajaArbusto)) {
            decoraciones.push({
              assetId: arbusto.id,
              escala: escalaArbusto,
              lado: ladoDecoracion,
              x: xArbusto,
              y: yArbusto,
              volteado: aleatorio() > 0.5
            });
            cajasColision.push(cajaArbusto);
          }
        }
      }
    }

    // FLORES raras cerca del nodo
    if (aleatorio() < 0.35 && flores.length > 0) {
      const flor = flores[Math.floor(aleatorio() * flores.length)];
      const escalaFlor = 0.15 + aleatorio() * 0.1;
      const anchoFlor = 172 * escalaFlor;
      
      const posFlorAleatoria = aleatorio();
      let xFlor, yFlor;
      if (posFlorAleatoria < 0.5) {
         // Cerca del nodo
         xFlor = x + (aleatorio() > 0.5 ? 45 : -45 - anchoFlor);
         yFlor = y + (aleatorio() > 0.5 ? 30 : -30);
      } else {
         // Cerca de la lámpara
         xFlor = lamparaX + (ladoLampara === 'derecha' ? -30 - anchoFlor : 45);
         yFlor = lamparaY + 10;
      }

      const cajaFlor = { x: xFlor, y: yFlor, w: anchoFlor, h: 172 * escalaFlor };
      
      if (!hayColision(cajaFlor)) {
        decoraciones.push({
          assetId: flor.id,
          escala: escalaFlor,
          lado: ladoDecoracion,
          x: xFlor,
          y: yFlor,
          volteado: aleatorio() > 0.5
        });
        cajasColision.push(cajaFlor);
      }
    }
  }

  return { decoraciones, hojas, lamparas, nodos };
}
"""

old_generar_pattern = r"export function generarMapaProcedural.*?return \{ decoraciones, hojas, lamparas, nodos \};\n\}"
content = re.sub(old_generar_pattern, new_generar, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/algoritmo/mapaProcedural.ts', 'w') as f:
    f.write(content)
