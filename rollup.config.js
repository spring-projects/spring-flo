import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import commonjs from 'rollup-plugin-commonjs';

/**
 * Add here external dependencies that actually you use.
 *
 * Angular dependencies
 * - '@angular/animations' => 'ng.animations'
 * - '@angular/animations/browser': 'ng.animations.browser'
 * - '@angular/common' => 'ng.common'
 * - '@angular/compiler' => 'ng.compiler'
 * - '@angular/core' => 'ng.core'
 * - '@angular/forms' => 'ng.forms'
 * - '@angular/common/http' => 'ng.common.http'
 * - '@angular/platform-browser-dynamic' => 'ng.platformBrowserDynamic'
 * - '@angular/platform-browser' => 'ng.platformBrowser'
 * - '@angular/platform-browser/animations' => 'ng.platformBrowser.animations'
 * - '@angular/platform-server' => 'ng.platformServer'
 * - '@angular/router' => 'ng.router'
 *
 * RxJS dependencies
 * From RxJS v6 you need only 'rxjs' and 'rxjs.operators'.
 *
 * Other dependencies
 * - Angular libraries: refer to their global namespace
 * - TypeScript/JavaScript libraries:
 *      e.g. lodash: 'lodash' => 'lodash'
 *
 * Also, if the dependency uses CommonJS modules, such as lodash,
 * you should also use a plugin like rollup-plugin-commonjs,
 * to explicitly specify unresolvable "named exports".
 *
 */
const globals = {
  '@angular/core': 'ng.core',
  '@angular/common': 'ng.common',
  '@angular/forms': 'ng.forms',
  '@angular/platform-browser': 'ng.browser',
  'rxjs': 'rxjs',
  'rxjs/operators': 'rxjs.operators',
  'lodash': 'lodash',
  'ts-disposables': 'ts-disposables',
  'codemirror-minified': 'codemirror-minified',
  'codemirror': 'codemirror-minified',
  'jointjs': 'jointjs',
  'jquery': 'jquery',

  // CodeMirror extensions
  'codemirror-minified/mode/meta': 'codemirror-minified/mode/meta',
  'codemirror-minified/addon/lint/lint': 'codemirror-minified/addon/lint/lint',
  'codemirror-minified/addon/hint/show-hint': 'codemirror-minified/addon/hint/show-hint',
  'codemirror-minified/addon/mode/loadmode': 'codemirror-minified/addon/mode/loadmode',
  'codemirror-minified/addon/edit/matchbrackets': 'codemirror-minified/addon/edit/matchbrackets',
  'codemirror-minified/addon/edit/closebrackets': 'codemirror-minified/addon/edit/closebrackets',
  'codemirror-minified/addon/display/placeholder': 'codemirror-minified/addon/edit/closebrackets',
  'codemirror-minified/addon/scroll/annotatescrollbar': 'codemirror-minified/addon/scroll/annotatescrollbar',
  'codemirror-minified/addon/scroll/simplescrollbars': 'codemirror-minified/addon/scroll/simplescrollbars',

  // Lint support
  // Unclear how to import this dynamically...
  'codemirror-minified/addon/lint/javascript-lint': 'codemirror-minified/addon/lint/javascript-lint',
  'codemirror-minified/addon/lint/coffeescript-lint': 'codemirror-minified/addon/lint/coffeescript-lint',
  'codemirror-minified/addon/lint/json-lint': 'codemirror-minified/addon/lint/json-lint',
  'codemirror-minified/addon/lint/yaml-lint': 'codemirror-minified/addon/lint/yaml-lint',

  // TODO: use dynamic import with JS7 in the future. CM autoLoad cannot load it properly - thinks its AMD
  // Supported languages until dynamic loading
  'codemirror-minified/mode/groovy/groovy': 'codemirror-minified/mode/groovy/groovy',
  'codemirror-minified/mode/javascript/javascript': 'codemirror-minified/mode/javascript/javascript',
  'codemirror-minified/mode/python/python': 'codemirror-minified/mode/python/python',
  'codemirror-minified/mode/ruby/ruby': 'codemirror-minified/mode/ruby/ruby',
  'codemirror-minified/mode/clike/clike': 'codemirror-minified/mode/clike/clike',
  'codemirror-minified/mode/yaml/yaml': 'codemirror-minified/mode/yaml/yaml',
  'codemirror-minified/mode/coffeescript/coffeescript': 'codemirror-minified/mode/coffeescript/coffeescript'

};

export default {
  external: Object.keys(globals),
  plugins: [resolve(), sourcemaps(), commonjs()],
  onwarn: () => { return },
  output: {
    format: 'umd',
    name: 'ng.spring-flo',
    globals: globals,
    sourcemap: true,
    exports: 'named',
    amd: { id: 'spring-flo' }
  }
}
