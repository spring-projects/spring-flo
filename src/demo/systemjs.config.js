/**
 * System configuration for Angular samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
  System.config({
    paths: {
      // paths serve as alias
      'npm:': 'node_modules/'
    },
    // map tells the System loader where to look for things
    map: {
      // our app is within the app folder
      app: 'app',

      // angular bundles
      '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
      '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
      '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/http': 'npm:@angular/http/bundles/http.umd.js',
      '@angular/router': 'npm:@angular/router/bundles/router.umd.js',
      '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',

      // other libraries
      'rx': 'npm:rx',
      'rxjs': 'npm:rxjs',
      'jointjs': 'npm:jointjs',
      'jquery': 'npm:jquery',
      'backbone': 'npm:backbone',
      'lodash': 'npm:lodash',
      'underscore': 'npm:lodash',
      'dagre': 'npm:dagre',
      'codemirror': 'npm:codemirror',
      'moment': 'npm:moment/moment.js',
      'ngx-bootstrap': 'npm:ngx-bootstrap/bundles/ngx-bootstrap.umd.js',
      'ts-disposables': 'npm:ts-disposables',
      'jshint': 'npm:jshint/dist/jshint.js'
    },
    meta: {
      'lodash': {
        exports: '_',
        format: 'global'
      },
      'jshint': {
        deps: ['lodash'],
        format: 'global'
      }
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        defaultExtension: 'js',
        meta: {
          './*.js': {
            loader: 'systemjs-angular-loader.js'
          },
        }
      },
      rx: {
        main: './dist/rx.js'
      },
      rxjs: {
        defaultExtension: 'js'
      },
      'ts-disposables': {
        defaultExtension: 'js',
        main: './dist/index.js'
      },
      jointjs: {
        main: './dist/joint.js'
      },
      jquery: {
        main: './dist/jquery.js',
      },
      backbone: {
        main: './backbone.js',
      },
      lodash: {
        main: './index.js',
      },
      dagre: {
        main: './dist/dagre.js'
      },
      codemirror: {
        main: './lib/codemirror.js'
      },
      jshint: {
        meta: {
          lodash: {
            format: 'global'
          }
        }
      },
      'spring-flo': {
        main: 'index.js',
        defaultExtension: 'js',
        meta: {
          './*.js': {
            loader: 'systemjs-angular-loader.js'
          }
        }
      }
    }
  });
})(this);
