import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const perfil = process.env.EAS_BUILD_PROFILE ?? 'development';
  const produccion = perfil === 'production' || perfil === 'preview';
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'onesignal-expo-plugin') {
      return ['onesignal-expo-plugin', { disableLocation: true, mode: produccion ? 'production' : 'development' }];
    }
    return plugin;
  });

  return { ...config, plugins } as ExpoConfig;
};
