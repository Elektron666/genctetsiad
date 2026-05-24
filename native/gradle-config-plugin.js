const { withGradleProperties, withProjectBuildGradle } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.1.20';

function withKotlinExt(config) {
  return withProjectBuildGradle(config, (config) => {
    let src = config.modResults.contents;

    // expo-root-project plugin extra.kotlinVersion okuyor, gradle property değil.
    // ext.kotlinVersion'ı zaten varsa override et, yoksa ekle.
    if (/ext\.kotlinVersion\s*=/.test(src)) {
      src = src.replace(/ext\.kotlinVersion\s*=\s*['"][^'"]*['"]/, `ext.kotlinVersion = '${KOTLIN_VERSION}'`);
    } else {
      // İlk satıra ekle, plugin apply'lerinden önce çalışsın diye
      src = `ext.kotlinVersion = '${KOTLIN_VERSION}'\n\n${src}`;
    }

    config.modResults.contents = src;
    return config;
  });
}

function withGradlePropsConfig(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && (item.key === 'org.gradle.jvmargs' || item.key === 'org.gradle.parallel'))
    );
    config.modResults.push(
      {
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: '-Xmx4096m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8',
      },
      {
        type: 'property',
        key: 'org.gradle.parallel',
        value: 'true',
      }
    );
    return config;
  });
}

module.exports = function withGradleConfig(config) {
  config = withGradlePropsConfig(config);
  config = withKotlinExt(config);
  return config;
};
