import { Platform } from 'react-native';

export const plataforma = {
  esIos: Platform.OS === 'ios',
  esAndroid: Platform.OS === 'android',
  esWeb: Platform.OS === 'web',
};
