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
  'codemirror': 'codemirror',
  'jointjs': 'jointjs',
  'jquery': 'jquery',

  // CodeMirror extensions
  'codemirror/mode/meta': 'codemirror/mode/meta',
  'codemirror/addon/lint/lint': 'codemirror/addon/lint/lint',
  'codemirror/addon/hint/show-hint': 'codemirror/addon/hint/show-hint',
  'codemirror/addon/mode/loadmode': 'codemirror/addon/mode/loadmode',
  'codemirror/addon/edit/matchbrackets': 'codemirror/addon/edit/matchbrackets',
  'codemirror/addon/edit/closebrackets': 'codemirror/addon/edit/closebrackets',
  'codemirror/addon/display/placeholder': 'codemirror/addon/edit/closebrackets',
  'codemirror/addon/scroll/annotatescrollbar': 'codemirror/addon/scroll/annotatescrollbar',
  'codemirror/addon/scroll/simplescrollbars': 'codemirror/addon/scroll/simplescrollbars',

  // Lint support
  // Unclear how to import this dynamically...
  'codemirror/addon/lint/javascript-lint': 'codemirror/addon/lint/javascript-lint',
  'codemirror/addon/lint/coffeescript-lint': 'codemirror/addon/lint/coffeescript-lint',
  'codemirror/addon/lint/json-lint': 'codemirror/addon/lint/json-lint',
  'codemirror/addon/lint/yaml-lint': 'codemirror/addon/lint/yaml-lint',

  // TODO: use dynamic import with JS7 in the future. CM autoLoad cannot load it properly - thinks its AMD
  // Supported languages until dynamic loading
  'codemirror/mode/groovy/groovy': 'codemirror/mode/groovy/groovy',
  'codemirror/mode/javascript/javascript': 'codemirror/mode/javascript/javascript',
  'codemirror/mode/python/python': 'codemirror/mode/python/python',
  'codemirror/mode/ruby/ruby': 'codemirror/mode/ruby/ruby',
  'codemirror/mode/clike/clike': 'codemirror/mode/clike/clike',
  'codemirror/mode/yaml/yaml': 'codemirror/mode/yaml/yaml',
  'codemirror/mode/coffeescript/coffeescript': 'codemirror/mode/coffeescript/coffeescript'

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
