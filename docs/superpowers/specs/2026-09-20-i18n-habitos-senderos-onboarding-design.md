# Internacionalización de hábitos, senderos y onboarding

## Objetivo

Traducir completamente al español e inglés el texto visible de las pantallas acordadas, reutilizando el i18next ya inicializado por `src/servicios/i18n/i18n.ts` y el único namespace `translation` de `src/servicios/i18n/recursos.ts`.

## Límites

- Incluye Hábitos, Senderos, Tienda, Insights, Perfil, onboarding/splash, Horizon y compra de gemas, además de las subpantallas enumeradas por la persona usuaria.
- Incluye títulos, subtítulos, botones, placeholders, labels, `accessibilityLabel`, alertas, mensajes de error, empty states y tooltips visibles.
- No modifica `metas`, `miEspacio`, rutas, assets, iconos, estructura visual, comentarios, valores internos de Supabase ni enums.
- El español copia exactamente la cadena actual. El inglés se traduce de forma natural.

## Arquitectura

`recursos.ts` seguirá siendo el único diccionario. Cada pantalla tendrá un objeto propio dentro de `translation`, con los componentes que se montan exclusivamente en esa pantalla anidados debajo cuando sea útil. Ejemplo: `senderos.mapa`, `senderos.contenedorMapa`, `tienda.arboles`, `onboarding.regaloBienvenida`.

Los componentes React importarán `useTranslation` desde `react-i18next` y resolverán cadenas con `t('…')`. Las funciones puras o servicios sin render usarán el `i18n.t('…')` ya inicializado. Los valores variables utilizarán interpolación, por ejemplo `t('habitos.detalle.progreso', { actual, meta })`.

## Orden de ejecución y checkpoints

Cada bloque se completa antes de iniciar el siguiente: inventario de cadenas, claves ES/EN, reemplazo local, búsqueda de textos visibles restantes y prueba focalizada.

1. Hábitos: `HabitosPantalla`, `CrearHabitoWizard`, `WidgetRegistrarProgreso`.
2. Senderos: `MapaSenderosPantalla`, `ContenedorMapaSenderos`.
3. Tienda e Insights: `TiendaArbolesPantalla`, `CarruselHeroTienda`, `TarjetaReferidosGemas`, `InsightsPantalla`, `GaleriaWidgetsModal`, `PerfilPantalla`.
4. Splash y onboarding: `AnimacionApertura`, `IntroduccionAppPantalla`, `AccesoOnboardingPantalla`, `FormularioAccesoOnboarding`, `RegaloBienvenidaPantalla`, `CarruselArbolRegalo`, `SelectorArbolRegalo`, `RegaloTrialHorizonPantalla`.
5. Horizon y gemas: `HorizonPaywallPantalla` y la pantalla de ruta `app/tienda/gemas.tsx` junto a su componente real.
6. Subpantallas de Hábitos: detalle, progresión, recordatorios, widgets y categoría.
7. Subpantallas de Senderos: detalle, sesión de misión, análisis y vista previa de paquete.

## Calidad y validación

- No se crean namespaces ni proveedores nuevos.
- Las claves son específicas por contexto para evitar colisiones; las cadenas repetidas solo se comparten cuando tienen exactamente el mismo significado.
- Los archivos de recursos mantienen paridad exacta de claves `es`/`en`.
- Al terminar cada bloque se ejecutan sus pruebas focalizadas y una búsqueda de literales visibles restantes en los archivos del bloque.
- Al final se ejecutan `npx tsc --noEmit` y `npx vitest run`.
- Se aceptan únicamente los ocho errores preexistentes documentados: cuatro de `WidgetRegistrarProgreso.tsx` por `deshabilitado` en `Rebote`, y cuatro de `SesionMisionPantalla.tsx` por el mismo prop; además de sus dos referencias históricas a `StyleSheet.absoluteFillObject` según el estado actual del repositorio. Cualquier error nuevo se corrige dentro del bloque que lo introdujo.

## Criterio de aceptación

Al cambiar el locale del dispositivo a inglés, toda cadena visible dentro del alcance muestra inglés; en español se conserva exactamente el texto actual. Los datos creados por el usuario y valores de backend permanecen sin traducción.
