import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ltd.brand_new.yi',
  appName: '周易六爻',
  webDir: 'dist',
  plugins: {
    JPush: {
      appKey: 'd5a6aae78b4a38a026f1a651',
      channel: 'developer-default',
    },
  },
};

export default config;
