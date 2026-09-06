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

  function hayColision(caja: CajaColision): boolean {
    for (const c of cajasColision) {
      if (caja.x < c.x + c.w && caja.x + caja.w > c.x && caja.y < c.y + c.h && caja.y + caja.h > c.y) {
        return true;
      }
    }
    return false;
  }

  cajasColision.push({ x: 0, y: -80, w: ancho, h: 60 });

  for (let indice = 0; indice < cantidadNodos; indice += 1) {
    const signo = indice === 0 ? 0 : indice % 2 === 0 ? 1 : -1;
    const amplitud = indice === 0 ? 0 : 34 + Math.round(aleatorio() * 12);
    const x = centro + signo * amplitud;
    const y = 54 + indice * 112;
    nodos.push({ id: `nodo-${indice}`, x, y });
    
    // Nodo reducido para colision (el centro es seguro)
    cajasColision.push({ x: x - 26, y: y - 26, w: 52, h: 52 });

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

    const costados: LadoMapa[] = ['izquierda', 'derecha'];
    
    costados.forEach(lado => {
      if (aleatorio() < 0.90 && arboles.length > 0) {
        const arbol = arboles[Math.floor(aleatorio() * arboles.length)];
        const escalaArbol = 0.5 + aleatorio() * 0.4;
        const anchoArbol = 172 * escalaArbol;
        const altoArbol = 172 * escalaArbol;
        
        // Empujamos los árboles mucho más a los costados
        let xArbol = lado === 'izquierda' 
          ? -anchoArbol * 0.4 - aleatorio() * 30
          : ancho - anchoArbol * 0.6 + aleatorio() * 30;
          
        const yArbol = y - 80 + (aleatorio() * 80 - 40);
        
        // Caja miniatura solo para el tronco central
        const cajaArbol = { x: xArbol + anchoArbol*0.4, y: yArbol + altoArbol*0.5, w: anchoArbol*0.2, h: altoArbol*0.4 };

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

          if (aleatorio() < 0.85 && arbustos.length > 0) {
            const numArbustos = aleatorio() > 0.4 ? 2 : 1;
            for (let i = 0; i < numArbustos; i++) {
              const arbusto = arbustos[Math.floor(aleatorio() * arbustos.length)];
              const escalaArbusto = escalaArbol * (0.35 + aleatorio() * 0.15); 
              const anchoArbusto = 172 * escalaArbusto;
              
              // Los arbustos nacen A UN LADO del tronco, hacia adentro
              const xArbusto = lado === 'izquierda' 
                ? xArbol + anchoArbol * 0.7 + (i * 20) + aleatorio() * 10
                : xArbol - anchoArbusto + anchoArbol * 0.3 - (i * 20) - aleatorio() * 10;
                
              // Altura en la base del tronco
              const yArbusto = yArbol + altoArbol - (172 * escalaArbusto) + (aleatorio() * 30 - 10);
              
              const cajaArbusto = { x: xArbusto + anchoArbusto*0.2, y: yArbusto + (172*escalaArbusto)*0.4, w: anchoArbusto*0.6, h: (172*escalaArbusto)*0.5 };
              
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

    if (aleatorio() < 0.7 && flores.length > 0) {
      const flor = flores[Math.floor(aleatorio() * flores.length)];
      const escalaFlor = 0.15 + aleatorio() * 0.08;
      const anchoFlor = 172 * escalaFlor;
      const altoFlor = 172 * escalaFlor;
      
      const posFlorAleatoria = aleatorio();
      let xFlor, yFlor;
      
      if (posFlorAleatoria < 0.5) {
         xFlor = x + (aleatorio() > 0.5 ? 45 + aleatorio()*10 : -45 - anchoFlor - aleatorio()*10);
         yFlor = y + (aleatorio() * 40 - 20);
      } else {
         xFlor = lamparaX + (ladoLampara === 'derecha' ? -20 - anchoFlor : 40);
         yFlor = lamparaY + 20 + (aleatorio() * 15 - 5);
      }

      const cajaFlor = { x: xFlor + anchoFlor*0.2, y: yFlor + altoFlor*0.2, w: anchoFlor*0.6, h: altoFlor*0.6 };
      
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
