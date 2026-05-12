const path = require('path');

// CRA + craco config: ignore broken source maps produced by html5-qrcode/zxing.
// This prevents build-time warnings from source-map-loader trying to read
// missing files like zxing-html5-qrcode-decoder.ts (under a non-existent path).
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      for (const rule of webpackConfig.module.rules) {
        if (!rule) continue;

        // CRA uses an array of `use` entries on rules.
        const useArr = rule.use && Array.isArray(rule.use) ? rule.use : null;
        if (!useArr) continue;

        for (const useEntry of useArr) {
          if (!useEntry) continue;

          const loaderName = typeof useEntry === 'string' ? useEntry : useEntry.loader;
          if (loaderName && String(loaderName).includes('source-map-loader')) {
            useEntry.options = {
              ...(useEntry.options || {}),
              ignore: [
                /zxing-html5-qrcode-decoder\.ts/i,
                /html5-qrcode.*zxing-html5-qrcode-decoder\.ts/i,
              ],
            };
          }
        }
      }

      return webpackConfig;
    },
  },
};

