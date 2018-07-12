// Karma configuration
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['custom'],


    // list of files / patterns to load in the browser
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


    // list of files / patterns to exclude
    exclude: [
      'tests/playground_requires.js',
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    client: {
      captureConsole: false,
    },
  })
}
