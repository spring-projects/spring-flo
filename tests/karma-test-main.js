var tests = Object.keys(window.__karma__.files).filter(function (file) {
      return /spec\.js$/.test(file);
});

requirejs.config({
    // Karma serves files from '/base'
	
    paths: {
        joint: '/base/lib/joint/joint',
        backbone: '/base/lib/backbone/backbone',
        
        text : '/base/lib/requirejs-text/text',
        angular: '/base/lib/angular/angular',
        jquery: '/base/lib/jquery/jquery',
        bootstrap: '/base/lib/bootstrap/bootstrap',
        lodash: '/base/lib/lodash/lodash.compat',
        dagre: '/base/lib/dagre/dagre.core.min',
        graphlib: '/base/lib/graphlib/graphlib.core',
        angularMocks: '/base/lib/angular-mocks/angular-mocks',
        jshint: '/base/lib/jshint/dist/jshint',
        
        flo: '/base/dist/spring-flo',
        metamodelService: '/base/tests/resources/metamodel-service',
        'editor-service': '/base/tests/resources/editor-service',
        'graph-to-text': '/base/tests/resources/graph-to-text',
        'render-service': '/base/tests/resources/render-service'

    },
    map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    },
    shim: {
    	angular: {
    		deps: ['bootstrap'],
    		exports: 'angular'
    	},
        'angularMocks': {
            deps:['angular'],
            'exports':'angular.mock'
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
    	
    	backbone: {
    	    //These script dependencies should be loaded before loading backbone.js.
    	    deps: ['underscore', 'jquery'],
    	},
    	joint: {
    	    deps: ['jquery', 'underscore', 'backbone'],
    	},
    	underscore: {
    	    exports: '_'
    	},
    	jshint: {
    		deps: ['lodash']
    	},  
    	flo: {
        	deps: ['angular', 'jquery', 'joint', 'underscore']
    	},
        metamodelService: {
            deps: [ 'flo',  'graph-to-text' ]
        },
        'editor-service': {
            deps: [ 'flo' ]
        },
        'render-service': {
            deps: [ 'flo' ]
        },
        'graph2text': {
            deps: [ 'joint' ]
        }
    },
    
    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});