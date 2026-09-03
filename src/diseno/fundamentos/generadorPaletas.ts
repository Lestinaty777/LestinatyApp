// Funciones matematicas para manipulacion de color

function hexToHsl(hex: string): [number, number, number] {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Genera una paleta de colores degradados a partir de un color base.
 * Ideal para listas, steps, y widgets con múltiples elementos.
 */
export function generarPaleta(hexBase: string, cantidad: number): string[] {
  if (cantidad <= 1) return [hexBase];
  
  const [h, s, l] = hexToHsl(hexBase);
  const paleta: string[] = [];
  
  for (let i = 0; i < cantidad; i++) {
    // Rotar sutilmente el tono (Analogous shift)
    const nuevoH = (h + (i * 12)) % 360; 
    
    // Oscurecer ligeramente para dar profundidad en fondos oscuros
    // Disminuimos la luminosidad un 12% por cada paso, pero evitamos que baje de 20 para que no sea negro
    const nuevoL = Math.max(20, l - (i * 12)); 
    
    // Saturación se mantiene alta para el look "neón"
    const nuevoS = Math.min(100, s + (i * 5));

    paleta.push(hslToHex(nuevoH, nuevoS, nuevoL));
  }
  
  return paleta;
}
