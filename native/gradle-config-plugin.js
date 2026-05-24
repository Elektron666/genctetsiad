const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withGradleConfig(config) {
  return withGradleProperties(config, (config) => {
    // Remove any existing jvmargs entry
    config.modResults = config.modResults.filter(
      item => !(item.type === 'property' && item.key === 'org.gradle.jvmargs')
    );
    // Set 4GB heap — default is often not enough for RN 0.85 builds
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8',
    });
    // Enable parallel builds
    config.modResults = config.modResults.filter(
      item => !(item.type === 'property' && item.key === 'org.gradle.parallel')
    );
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.parallel',
      value: 'true',
    });
    return config;
  });
};
