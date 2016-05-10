// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
  'use strict';
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine', 'requirejs'],
    
    // list of files / patterns to load in the browser
    files: [
      {pattern: 'src/**/*.js', included: false},
      {pattern: 'lib/**/*.js', included: false},
      {pattern: 'tests/spec/**/*.js', included: false},
      {pattern: 'dist/**/*.js', included: false},
      {pattern: 'tests/resources/**/*', included: false},
      'tests/karma-test-main.js'
    ],

    plugins: [
              'karma-junit-reporter',
              'karma-chrome-launcher',
              'karma-firefox-launcher',
              'karma-jasmine',
              'karma-phantomjs-launcher',
              'karma-requirejs',
              'karma-jasmine-html-reporter',
    ],
    
//    reporters: [
//                'html'
//    ],
    
    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 7070,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Firefox', 'Chrome'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
