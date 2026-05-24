const { withGradleProperties, withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.1.20';
const COMPILE_SDK = 36;
const TARGET_SDK = 36;

// ExpoRootProjectPlugin ext.* değerlerini 'setIfNotExist' ile okuyor —
// plugin apply'den ÖNCE ext'e yazarsak doğru versiyonlar kullanılır.
function withRootExtValues(config) {
  return withProjectBuildGradle(config, (config) => {
    let src = config.modResults.contents;
    const injections = [
      `ext.kotlinVersion = '${KOTLIN_VERSION}'`,
      `ext.compileSdkVersion = ${COMPILE_SDK}`,
      `ext.targetSdkVersion = ${TARGET_SDK}`,
    ].filter((line) => !src.includes(line.split('=')[0].trim()));

    if (injections.length > 0) {
      src = injections.join('\n') + '\n\n' + src;
    }
    config.modResults.contents = src;
    return config;
  });
}

// Gradle 9 + AGP 8.12: generateReleaseBuildConfig çalışıyor ama Kotlin compile
// path'inde görünmüyor. buildFeatures.buildConfig = true bunu zorluyor.
function withBuildConfigFeature(config) {
  return withAppBuildGradle(config, (config) => {
    let src = config.modResults.contents;
    if (!src.includes('buildConfig = true') && !src.includes('buildConfig true')) {
      src = src.replace(
        /android\s*\{/,
        'android {\n    buildFeatures {\n        buildConfig = true\n    }'
      );
      config.modResults.contents = src;
    }
    return config;
  });
}

function withGradlePropsConfig(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) =>
        !(
          item.type === 'property' &&
          (item.key === 'org.gradle.jvmargs' || item.key === 'org.gradle.parallel')
        )
    );
    config.modResults.push(
      {
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: '-Xmx4096m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8',
      },
      { type: 'property', key: 'org.gradle.parallel', value: 'true' }
    );
    return config;
  });
}

module.exports = function withGradleConfig(config) {
  config = withGradlePropsConfig(config);
  config = withRootExtValues(config);
  config = withBuildConfigFeature(config);
  return config;
};
