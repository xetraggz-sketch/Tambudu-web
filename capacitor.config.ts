/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/status-bar" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.tambudu.app',
  appName: 'ТамБуду',
  webDir: 'out',
  server: {
    url: process.env.MOBILE_SERVER_URL ?? 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#E89B4A',
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      backgroundColor: '#E89B4A',
      style: 'DARK',
    },
  },
};

export default config;
