// Entry point propio (reemplaza el "main": "expo-router/entry" por defecto) —
// react-native-android-widget necesita registrar su task handler headless
// acá, antes de que arranque el router. Ver
// src/modulos/habitos/widgets/widgetTaskHandler.tsx.
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/modulos/habitos/widgets/widgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);
