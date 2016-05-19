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

/**
 * @author Alex Boyko
 * @author Andy Clement
 */
requirejs.config({
  baseUrl:'js',
  paths: {
    joint:    '/webjars/jointjs/dist/joint',
    backbone: '/webjars/backbone/backbone',    
    domReady: '/webjars/requirejs-domready/domReady',
    angular:  '/webjars/angular/angular',
    jquery:   '/webjars/jquery/dist/jquery',
    bootstrap:'/webjars/bootstrap/bootstrap',
    lodash:   '/webjars/lodash/lodash', // lodash.compat
    dagre:    '/webjars/dagre/dist/dagre.core',
    graphlib: '/webjars/graphlib/graphlib.core',
    text :    '/webjars/requirejs-text/text',
    flo :     '/webjars/spring-flo/dist/spring-flo',
    json5 :   '/webjars/json5/json5'
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
	graphlib: {
		deps: ['underscore']
	},
	dagre: {
		deps: ['graphlib', 'underscore']
	},	
	joint: {
	    deps: ['jquery', 'underscore', 'backbone'],
	},
	underscore: {
	    exports: '_'
	},	
    'flo': {
    	deps: ['angular', 'jquery', 'joint', 'underscore']
    }
  }
});

define(['require','angular'], function (require, angular) {
        'use strict';
         require(['domReady!', 'sample-app'], 
           function (document) {
        	 angular.bootstrap(document, ['floSampleApp']);
           }
      );
});
