# Mapa De Senderos De Ejercicio

## Objetivo

Mostrar el primer mapa interactivo de Lestinaty para `Salud / Ejercicio` con datos locales mock, sin modificar el mapa compartido existente.

## Arquitectura

`SenderosPantalla` conserva la responsabilidad de decidir si una subcategoria esta abierta y de calcular el alto disponible. `ContenedorMapaSenderos` recibe esos valores y se encarga de resolver los nodos, la seleccion y el scroll interno. Cada `NodoSendero` solo renderiza su apariencia y comunica la pulsacion.

El componente `Nodo.tsx` existente no se modifica: actualmente es una dependencia de `MapaCompartido.tsx`. La nueva experiencia vive bajo `src/modulos/senderos/componentes/mapa/` y se podra migrar a compartidos despues sin regresiones.

## Experiencia Visual

El recorrido es vertical, con una desviacion horizontal suave y conectores curvos. Cada nodo tiene un icono Lucide blanco y uno de tres estados: completado, activo y bloqueado. El nodo activo recibe halo y la pulsacion actualiza el detalle seleccionado sin navegar ni persistir datos.

## Datos

Solo `salud / ejercicio` tiene cinco pasos mock. Las demas subcategorias conservan el lienzo pastel vacio actual. Los datos tienen id, titulo, subtitulo, icono y estado; su fuente futura podra reemplazar el modulo mock sin cambiar componentes visuales.

## Restricciones

- No se agregan dependencias.
- Las animaciones usan `Animated` con native driver cuando aplica.
- El mapa conserva scroll interno solo en modo enfoque, segun el comportamiento actual de `MapaSubcategoria`.
- Debe compilar con `npm run typecheck` y no producir errores de formato con `git diff --check`.
