import { describe, expect, it } from 'vitest';

import { mapearPanelHabitos } from './habitos.mapper';

describe('mapearPanelHabitos', () => {
  it('convierte el payload snake_case sin inventar métricas', () => {
    const panel = mapearPanelHabitos({
      hoy: { estado: 'listo', datos: [{ id: 'agua', titulo: 'Agua', descripcion: null, icono_lucide: 'Droplets', color: '#2196F3', tipo_meta: 'cantidad', unidad: 'vasos', meta: 8, valor_hoy: 6, completado: false }] },
      patrones: { estado: 'en_observacion', datos: [] },
      conexiones: { estado: 'en_observacion', datos: [] },
      riesgo: { estado: 'en_observacion', datos: [] },
      impacto: { estado: 'en_observacion', datos: [] },
    });

    expect(panel.hoy.datos[0]).toMatchObject({ iconoLucide: 'Droplets', tipoMeta: 'cantidad', valorHoy: 6 });
    expect(panel.riesgo.datos).toEqual([]);
  });
});
