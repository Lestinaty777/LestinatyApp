import { LayoutTemplate, ListChecks, Plus } from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EstadoVacioModulo } from '../../../diseno';

// Estados vacíos de la vista "Hoy" de Rutinas. Dos casos distintos:
//  · 'sin_rutinas': la persona aún no creó ninguna → una frase y las dos
//    formas de empezar (crear o usar una plantilla).
//  · 'nada_hoy': tiene rutinas, pero hoy no toca ninguna → se le recuerda por
//    qué está vacío y se la lleva a verlas.
export function VacioRutinas({ color, ilustracion, onCrear, onVerMisRutinas, onVerPlantillas, tipo }: {
  /** Acento del módulo (Ignate). */
  color: string;
  /** Arte del paquete: la semilla para "sin rutinas", el arbusto para "nada hoy". */
  ilustracion?: ImageSourcePropType;
  onCrear: () => void;
  onVerMisRutinas: () => void;
  onVerPlantillas: () => void;
  tipo: 'sin_rutinas' | 'nada_hoy';
}) {
  const { t } = useTranslation();
  if (tipo === 'nada_hoy') {
    return (
      <EstadoVacioModulo
        accion={{ Icono: ListChecks, onPress: onVerMisRutinas, texto: t('rutinas.pantalla.vacio.verMisRutinas') }}
        accionSecundaria={{ Icono: Plus, onPress: onCrear, texto: t('rutinas.pantalla.access.creacion.label') }}
        color={color}
        ilustracion={ilustracion}
        texto={t('rutinas.pantalla.nadaHoyDescripcion')}
        titulo={t('rutinas.pantalla.nadaHoyTitulo')}
      />
    );
  }
  return (
    <EstadoVacioModulo
      accion={{ Icono: Plus, onPress: onCrear, texto: t('rutinas.pantalla.access.creacion.label') }}
      accionSecundaria={{ Icono: LayoutTemplate, onPress: onVerPlantillas, texto: t('rutinas.pantalla.vacio.usarPlantilla') }}
      color={color}
      ilustracion={ilustracion}
      texto={t('rutinas.pantalla.vacioDescripcion')}
      titulo={t('rutinas.pantalla.vacio.titulo')}
    />
  );
}
