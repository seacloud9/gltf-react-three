/*global module, require */
/*eslint no-undef: "error"*/
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  env: {
    IS_DEBUG: true,
  },
  webpack: (config, { isServer }) => {
    const newConfig = Object.assign({}, config, {
      module: Object.assign({}, config.module, {
        rules: config.module.rules.concat([
          {
            test: /\.gltf$/,
            loader: 'raw-loader',
          },
        ]),
      }),
    })
    if (!isServer) {
      newConfig.resolve.fallback.fs = false;
    }
    newConfig.infrastructureLogging = { debug: /PackFileCache/ }
    return newConfig
  },
}
