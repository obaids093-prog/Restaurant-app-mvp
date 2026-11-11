// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// React Native 0.79+ relocated asset-registry exports.
// Point assetRegistryPath to the actual file inside react-native.
config.transformer.assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native/asset-registry') {
    return {
      filePath: require.resolve('react-native/Libraries/Image/AssetRegistry'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    return {
      filePath: path.resolve(__dirname, 'src/shims/reactNativeUnstableInternals.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
