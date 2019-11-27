/**
 * System configuration for Angular samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
  System.config({
    transpiler: false,
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
      '@angular/animations': 'npm:@angular/animations/bundles/animations.umd.js',

      'ngx-bootstrap': 'npm:ngx-bootstrap/bundles/ngx-bootstrap.umd.min.js',
      // Below workaround due to https://github.com/valor-software/ngx-bootstrap/issues/5195
      'ngx-bootstrap/chronos': 'npm:ngx-bootstrap/chronos/bundles/ngx-bootstrap-chronos.umd.min.js',
      'ngx-bootstrap/utils': 'npm:ngx-bootstrap/utils/bundles/ngx-bootstrap-utils.umd.min.js',
      'ngx-bootstrap/dropdown': 'npm:ngx-bootstrap/dropdown/bundles/ngx-bootstrap-dropdown.umd.min.js',
      'ngx-bootstrap/accordion': 'npm:ngx-bootstrap/accordion/bundles/ngx-bootstrap-accordion.umd.min.js',
      'ngx-bootstrap/collapse': 'npm:ngx-bootstrap/collapse/bundles/ngx-bootstrap-collapse.umd.min.js',
      'ngx-bootstrap/alert': 'npm:ngx-bootstrap/alert/bundles/ngx-bootstrap-alert.umd.min.js',
      'ngx-bootstrap/buttons': 'npm:ngx-bootstrap/buttons/bundles/ngx-bootstrap-buttons.umd.min.js',
      'ngx-bootstrap/carousel': 'npm:ngx-bootstrap/carousel/bundles/ngx-bootstrap-carousel.umd.min.js',
      'ngx-bootstrap/mini-ngrx': 'npm:ngx-bootstrap/mini-ngrx/bundles/ngx-bootstrap-mini-ngrx.umd.min.js',
      'ngx-bootstrap/component-loader': 'npm:ngx-bootstrap/component-loader/bundles/ngx-bootstrap-component-loader.umd.min.js',
      'ngx-bootstrap/positioning': 'npm:ngx-bootstrap/positioning/bundles/ngx-bootstrap-positioning.umd.min.js',
      'ngx-bootstrap/pagination': 'npm:ngx-bootstrap/pagination/bundles/ngx-bootstrap-pagination.umd.min.js',
      'ngx-bootstrap/progressbar': 'npm:ngx-bootstrap/progressbar/bundles/ngx-bootstrap-progressbar.umd.min.js',
      'ngx-bootstrap/rating': 'npm:ngx-bootstrap/rating/bundles/ngx-bootstrap-rating.umd.min.js',
      'ngx-bootstrap/tabs': 'npm:ngx-bootstrap/tabs/bundles/ngx-bootstrap-tabs.umd.min.js',
      'ngx-bootstrap/timepicker': 'npm:ngx-bootstrap/timepicker/bundles/ngx-bootstrap-timepicker.umd.min.js',
      'ngx-bootstrap/tooltip': 'npm:ngx-bootstrap/tooltip/bundles/ngx-bootstrap-tooltip.umd.min.js',
      'ngx-bootstrap/typeahead': 'npm:ngx-bootstrap/typeahead/bundles/ngx-bootstrap-typeahead.umd.min.js',
      'ngx-bootstrap/popover': 'npm:ngx-bootstrap/popover/bundles/ngx-bootstrap-popover.umd.min.js',
      'ngx-bootstrap/locale': 'npm:ngx-bootstrap/locale/bundles/ngx-bootstrap-locale.umd.min.js',
      'ngx-bootstrap/sortable': 'npm:ngx-bootstrap/sortable/bundles/ngx-bootstrap-sortable.umd.min.js',
      'ngx-bootstrap/datepicker': 'npm:ngx-bootstrap/datepicker/bundles/ngx-bootstrap-datepicker.umd.min.js',
      'ngx-bootstrap/modal': 'npm:ngx-bootstrap/modal/bundles/ngx-bootstrap-modal.umd.min.js',

      // other libraries
      'rxjs': 'npm:rxjs',
      'jointjs': 'npm:jointjs',
      'jquery': 'npm:jquery',
      'backbone': 'npm:backbone',
      'lodash': 'npm:lodash',
      'underscore': 'npm:lodash',
      'dagre': 'npm:dagre',
      'codemirror': 'npm:codemirror-minified',
      'codemirror-minified': 'npm:codemirror-minified',
      'moment': 'npm:moment/moment.js',
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
        main: 'index.js',
        defaultExtension: 'js'
      },
      'rxjs/operators': {
        main: './index.js'
      },
      'ts-disposables': {
        defaultExtension: 'js',
        main: './dist/index.js'
      },
      jointjs: {
        main: './dist/joint.js'
      },
      jquery: {
        main: './dist/jquery.js'
      },
      backbone: {
        main: './backbone.js'
      },
      lodash: {
        main: './index.js'
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
