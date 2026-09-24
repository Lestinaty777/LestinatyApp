import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from '../../modulos/habitos/widgets/widgetTaskHandler';

export function registrarWidgets(): void {
  registerWidgetTaskHandler(widgetTaskHandler);
}
