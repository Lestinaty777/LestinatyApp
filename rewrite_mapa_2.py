import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/algoritmo/mapaProcedural.ts', 'r') as f:
    content = f.read()

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

  // Función de colisión ajustada: sin márgenes excesivos para permitir cercanía
  function hayColision(caja: CajaColision): boolean {
    for (const c of cajasColision) {
      if (caja.x < c.x + c.w && caja.x + caja.w > c.x && caja.y < c.y + c.h && caja.y + caja.h > c.y) {
        return true;
      }
    }
    return false;
  }

  // Base gigante arriba (dejamos que las cosas se sobrepongan un poco visualmente si es necesario)
  cajasColision.push({ x: 0, y: -80, w: ancho, h: 60 });

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
    cajasColision.push({ x: lamparaX, y: lamparaY, w: 34, h: 40 });

    // GENERACIÓN DE CLÚSTERS DE BIOMA EN AMBOS COSTADOS
    const costados: LadoMapa[] = ['izquierda', 'derecha'];
    
    costados.forEach(lado => {
      // 85% de probabilidad de generar un árbol en cada costado
      if (aleatorio() < 0.85 && arboles.length > 0) {
        const arbol = arboles[Math.floor(aleatorio() * arboles.length)];
        const escalaArbol = 0.5 + aleatorio() * 0.4; // 50% a 90%
        const anchoArbol = 172 * escalaArbol;
        const altoArbol = 172 * escalaArbol;
        
        // Empujamos los árboles a los bordes
        let xArbol = lado === 'izquierda' 
          ? -anchoArbol * (0.1 + aleatorio() * 0.3) 
          : ancho - anchoArbol * (0.9 - aleatorio() * 0.3);
          
        // Ruido vertical
        const yArbol = y - 90 + (aleatorio() * 60 - 30);
        
        // Caja de colisión reducida para el árbol (permitiendo que las ramas se solapen, pero el tronco no)
        const cajaArbol = { x: xArbol + anchoArbol*0.2, y: yArbol + altoArbol*0.2, w: anchoArbol*0.6, h: altoArbol*0.8 };

        if (!hayColision(cajaArbol)) {
          decoraciones.push({
            assetId: arbol.id,
            escala: escalaArbol,
            lado: lado,
            x: xArbol,
            y: yArbol,
            volteado: aleatorio() > 0.5
          });
          cajasColision.push(cajaArbol);

          // Agregar 1 o 2 arbustos cerca del árbol
          if (aleatorio() < 0.75 && arbustos.length > 0) {
            const numArbustos = aleatorio() > 0.5 ? 2 : 1;
            for (let i = 0; i < numArbustos; i++) {
              const arbusto = arbustos[Math.floor(aleatorio() * arbustos.length)];
              const escalaArbusto = escalaArbol * (0.4 + aleatorio() * 0.2); 
              const anchoArbusto = 172 * escalaArbusto;
              const altoArbusto = 172 * escalaArbusto;
              
              // Posicionar hacia adentro del mapa
              const xArbusto = lado === 'izquierda' 
                ? xArbol + anchoArbol * (0.5 + aleatorio() * 0.4) 
                : xArbol - anchoArbusto + anchoArbol * (0.5 - aleatorio() * 0.4);
                
              const yArbusto = yArbol + altoArbol - altoArbusto + (aleatorio() * 30 - 15);
              
              const cajaArbusto = { x: xArbusto, y: yArbusto, w: anchoArbusto, h: altoArbusto };
              
              if (!hayColision(cajaArbusto)) {
                decoraciones.push({
                  assetId: arbusto.id,
                  escala: escalaArbusto,
                  lado: lado,
                  x: xArbusto,
                  y: yArbusto,
                  volteado: aleatorio() > 0.5
                });
                cajasColision.push(cajaArbusto);
              }
            }
          }
        }
      }
    });

    // FLORES raras cerca del nodo o lámpara
    if (aleatorio() < 0.6 && flores.length > 0) {
      const flor = flores[Math.floor(aleatorio() * flores.length)];
      const escalaFlor = 0.15 + aleatorio() * 0.1;
      const anchoFlor = 172 * escalaFlor;
      const altoFlor = 172 * escalaFlor;
      
      const posFlorAleatoria = aleatorio();
      let xFlor, yFlor;
      
      if (posFlorAleatoria < 0.5) {
         // Cerca del nodo
         xFlor = x + (aleatorio() > 0.5 ? 40 + aleatorio()*10 : -40 - anchoFlor - aleatorio()*10);
         yFlor = y + (aleatorio() > 0.5 ? 20 + aleatorio()*10 : -20 - aleatorio()*10);
      } else {
         // Cerca de la lámpara
         xFlor = lamparaX + (ladoLampara === 'derecha' ? -15 - anchoFlor : 35);
         yFlor = lamparaY + 20 + (aleatorio() * 10 - 5);
      }

      const cajaFlor = { x: xFlor, y: yFlor, w: anchoFlor, h: altoFlor };
      
      if (!hayColision(cajaFlor)) {
        decoraciones.push({
          assetId: flor.id,
          escala: escalaFlor,
          lado: ladoLampara,
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
