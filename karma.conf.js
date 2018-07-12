// Karma configuration
module.exports = function(config) {
  const coverage = !!process.env.COVERAGE;
  config.set({
    frameworks: ['custom'],

    files: [
      'node_modules/google-closure-library/closure/goog/base.js',
      'tests/test_dependency_map.js',
      'tests/*.js',
      'karmawrapper.js',
      'msg/js/en_us.js',
      { pattern: 'node_modules/google-closure-library/**/*.js', watched: false, included: false },
      { pattern: 'core/**/*.js', included: false },
      { pattern: 'blocks/**/*.js', included: false },
      { pattern: 'generators/**/*.js', included: false },
    ],

    exclude: [
      'tests/playground_requires.js',
    ],

    preprocessors: coverage ? {
      'core/**/*.js': ['coverage'],
      'blocks/**/*.js': ['coverage'],
      'generators/**/*.js': ['coverage'],
    } : {},

    reporters: coverage ? ['progress', 'coverage'] : ['progress'],

    coverageReporter: {
      reporters: [
        { type: 'html', subdir: '.' },
        { type: 'lcovonly', subdir: '.' },
      ],
    },

    logLevel: config.LOG_WARN,
    browsers: ['ChromeHeadless'],
    client: {
      captureConsole: false,
    },
  })
}
