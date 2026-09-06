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

  // Sistema de colisión estricto para evitar NINGUNA sobreposición visible
  function hayColision(caja: CajaColision): boolean {
    for (const c of cajasColision) {
      if (caja.x < c.x + c.w && caja.x + caja.w > c.x && caja.y < c.y + c.h && caja.y + caja.h > c.y) {
        return true;
      }
    }
    return false;
  }

  // Base estructural (Cimientos superiores)
  cajasColision.push({ x: 0, y: -80, w: ancho, h: 80 });

  // 1. GENERAR NODOS Y ESTRUCTURAS PRINCIPALES
  for (let indice = 0; indice < cantidadNodos; indice += 1) {
    const signo = indice === 0 ? 0 : indice % 2 === 0 ? 1 : -1;
    const amplitud = indice === 0 ? 0 : 34 + Math.round(aleatorio() * 12);
    const x = centro + signo * amplitud;
    const y = 54 + indice * 112;
    nodos.push({ id: `nodo-${indice}`, x, y });
    
    // Nodo central protegido
    cajasColision.push({ x: x - 40, y: y - 40, w: 80, h: 80 });

    if (indice === 0) continue;

    const nodoEstaIzquierda = x < centro;
    const ladoLampara: LadoMapa = nodoEstaIzquierda ? 'derecha' : 'izquierda';
    
    // Hojas del camino
    const tamanoHojas = 30 + Math.round(aleatorio() * 5);
    const altoHojas = tamanoHojas * (35 / 26);
    const margenNodo = 33;
    hojas.push({
      lado: ladoLampara,
      tamano: tamanoHojas,
      x: ladoLampara === 'derecha' ? x + margenNodo : x - tamanoHojas - margenNodo,
      y: y - altoHojas / 2,
    });

    // Lámpara protegida
    const lamparaX = ladoLampara === 'derecha' ? ancho - 128 : 84;
    const lamparaY = y - 16;
    const tamanoLampara = 23 + Math.round(aleatorio() * 3);
    lamparas.push({
      lado: ladoLampara,
      tamano: tamanoLampara,
      x: lamparaX,
      y: lamparaY,
    });
    cajasColision.push({ x: lamparaX - 10, y: lamparaY - 10, w: 54, h: 60 });
  }

  // 2. RELLENAR ESPACIOS (SISTEMA DENSO DE BIOMA)
  // Evaluamos el mapa verticalmente cada 40 pixeles para evitar huecos vacíos
  const altoMapa = 54 + (cantidadNodos - 1) * 112;
  const costados: LadoMapa[] = ['izquierda', 'derecha'];
  
  for (let scanY = 20; scanY < altoMapa; scanY += 40) {
    costados.forEach(lado => {
      // Intentamos plantar en cada paso vertical
      
      // 1. ÁRBOLES (Más grandes, estocásticos)
      if (aleatorio() < 0.65 && arboles.length > 0) {
        const arbol = arboles[Math.floor(aleatorio() * arboles.length)];
        const escalaArbol = 0.7 + aleatorio() * 0.4; // Más grandes
        const anchoArbol = 172 * escalaArbol;
        const altoArbol = 172 * escalaArbol;
        
        let xArbol = lado === 'izquierda' 
          ? -anchoArbol * 0.35 - aleatorio() * 20
          : ancho - anchoArbol * 0.65 + aleatorio() * 20;
          
        const yArbol = scanY + (aleatorio() * 30 - 15);
        
        // Caja de colisión MUCHO más precisa y ancha para evitar cruces
        const cajaArbol = { x: xArbol + anchoArbol*0.2, y: yArbol + altoArbol*0.2, w: anchoArbol*0.6, h: altoArbol*0.7 };

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
        }
      }

      // 2. ARBUSTOS INDEPENDIENTES (Más alejados, rellenando huecos)
      if (aleatorio() < 0.8 && arbustos.length > 0) {
        const arbusto = arbustos[Math.floor(aleatorio() * arbustos.length)];
        const escalaArbusto = 0.4 + aleatorio() * 0.25; 
        const anchoArbusto = 172 * escalaArbusto;
        const altoArbusto = 172 * escalaArbusto;
        
        // Se alejan del borde (hacia adentro), rellenando el espacio entre árboles y nodos
        const xArbusto = lado === 'izquierda' 
          ? (aleatorio() * 70) 
          : ancho - anchoArbusto - (aleatorio() * 70);
          
        const yArbusto = scanY + (aleatorio() * 40 - 20);
        
        const cajaArbusto = { x: xArbusto + anchoArbusto*0.1, y: yArbusto + altoArbusto*0.1, w: anchoArbusto*0.8, h: altoArbusto*0.8 };
        
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

      // 3. FLORES (Más grandes y cerca del sendero)
      if (aleatorio() < 0.5 && flores.length > 0) {
        const flor = flores[Math.floor(aleatorio() * flores.length)];
        const escalaFlor = 0.2 + aleatorio() * 0.12; // Un poco más grandes
        const anchoFlor = 172 * escalaFlor;
        const altoFlor = 172 * escalaFlor;
        
        // Muy cerca de la zona central
        const xFlor = lado === 'izquierda' 
          ? centro - 90 + aleatorio() * 40
          : centro + 90 - anchoFlor - aleatorio() * 40;
          
        const yFlor = scanY + (aleatorio() * 40 - 20);
        
        const cajaFlor = { x: xFlor + anchoFlor*0.1, y: yFlor + altoFlor*0.1, w: anchoFlor*0.8, h: altoFlor*0.8 };
        
        if (!hayColision(cajaFlor)) {
          decoraciones.push({
            assetId: flor.id,
            escala: escalaFlor,
            lado: lado,
            x: xFlor,
            y: yFlor,
            volteado: aleatorio() > 0.5
          });
          cajasColision.push(cajaFlor);
        }
      }
    });
  }

  return { decoraciones, hojas, lamparas, nodos };
}
"""

old_generar_pattern = r"export function generarMapaProcedural.*?return \{ decoraciones, hojas, lamparas, nodos \};\n\}"
content = re.sub(old_generar_pattern, new_generar, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/algoritmo/mapaProcedural.ts', 'w') as f:
    f.write(content)
