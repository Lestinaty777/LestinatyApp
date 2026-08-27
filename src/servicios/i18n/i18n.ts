import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { recursosI18n } from './recursos';

function obtenerIdiomaInicial() {
  const idioma = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];

  return idioma === 'en' ? 'en' : 'es';
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  lng: obtenerIdiomaInicial(),
  resources: recursosI18n,
});

export { i18n };
