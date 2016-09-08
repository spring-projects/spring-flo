/*
 * Copyright 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

requirejs.config({
  paths: {
    joint: '../lib/joint/joint',
    backbone: '../lib/backbone/backbone',    
    angular: '../lib/angular/angular',
    jquery: '../lib/jquery/jquery',
    bootstrap: '../lib/bootstrap/bootstrap',
    lodash: '../lib/lodash/lodash.compat',
    jshint: '../lib/jshint/dist/jshint',
	floDirectives: './directives',
	floServices: './services'
  },
  map: {
      '*': {
          // Backbone requires underscore. This forces requireJS to load lodash instead:
          'underscore': 'lodash'
      }
  },
  packages: [
	{
		name: 'codemirror',
		location: '../lib/codemirror',
		main: 'lib/codemirror'
	}
  ],
  shim: {
	angular: {
		deps: ['bootstrap'],
		exports: 'angular'
	},
	bootstrap: {
		deps: ['jquery']
	},
	joint: {
	    deps: ['jquery', 'underscore', 'backbone'],
	},
	underscore: {
	    exports: '_'
	},	
	jshint: {
		deps: ['lodash']
	}  
  }
});