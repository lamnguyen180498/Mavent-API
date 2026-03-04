import * as process from 'process';

export default () => ({
  app: {
    env: process.env.APP_ENV || 'production',
    url: process.env.APP_URL || 'http://localhost',
    key: process.env.APP_KEY,
    debug: process.env.APP_DEBUG === 'true',
    i18n: {
      locale: process.env.APP_LOCALE || 'en',
      fallbacks: {
        'en-*': 'en',
        'vi-*': 'vi',
      },
    },
  },
  zoom: {
    client_id: process.env.ZOOM_CLIENT_ID,
    client_secret: process.env.ZOOM_CLIENT_SECRET,
    account_id: process.env.ZOOM_ACCOUNT_ID,
    sdk_key: process.env.ZOOM_SDK_KEY,
    sdk_secret: process.env.ZOOM_SDK_SECRET,
  },
});
