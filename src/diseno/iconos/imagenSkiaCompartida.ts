import { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import { Skia, type SkImage } from '@shopify/react-native-skia';

// Skia decodifica la imagen por CADA instancia de useImage: 40 iconos iguales
// = 40 decodificaciones y 40 muestreos de hue (el cache de hue de MasterChanger
// es por objeto SkImage, y cada instancia tenía el suyo). Aquí la imagen se
// decodifica UNA vez por asset y se comparte: la segunda instancia la recibe
// ya lista, sin el vacío de "aún no cargó" que dejaba el icono ausente un frame.
const promesas = new Map<string, Promise<SkImage | null>>();
const listas = new Map<string, SkImage | null>();

function claveDe(fuente: ImageSourcePropType): string | null {
  return Image.resolveAssetSource(fuente)?.uri ?? null;
}

function cargar(clave: string): Promise<SkImage | null> {
  let promesa = promesas.get(clave);
  if (!promesa) {
    promesa = Skia.Data.fromURI(clave)
      .then((datos) => Skia.Image.MakeImageFromEncoded(datos))
      .catch(() => null)
      .then((imagen) => { listas.set(clave, imagen); return imagen; });
    promesas.set(clave, promesa);
  }
  return promesa;
}

/** Igual que `useImage` de Skia, pero compartiendo la imagen decodificada entre instancias. */
export function useImagenSkiaCompartida(fuente: ImageSourcePropType): SkImage | null {
  const clave = claveDe(fuente);
  const [imagen, setImagen] = useState<SkImage | null>(() => (clave ? listas.get(clave) ?? null : null));
  useEffect(() => {
    if (!clave) return;
    if (listas.has(clave)) { setImagen(listas.get(clave) ?? null); return; }
    let vigente = true;
    cargar(clave).then((cargada) => { if (vigente) setImagen(cargada); });
    return () => { vigente = false; };
  }, [clave]);
  return imagen;
}
