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

'use strict';

module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	var LIB_DIR = './lib';
	
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

		// Test settings
		karma: {
			options: {
				browsers: ['PhantomJS'],
				singleRun: true
			},
			unit: {
				configFile: 'karma.conf.js'
			}
		},

        requirejs: {
        	// global config
        	options: {
        		baseUrl: './src',
				name: 'app',
				exclude: [ 'joint', 'angular', 'jquery', 'bootstrap', 'underscore' ],
				// insertRequire: [ './app' ],
        		mainConfigFile: './src/main.js'
        	},
        	production: {
        		// overwrites the default config above
        		options: {
        			out: './dist/spring-flo.min.js'
        		}
        	},
        	development: {
        		// overwrites the default config above
        		options: {
        			out: './dist/spring-flo.js',
        			optimize: 'none' // no minification
        		}
        	}
        },
        
        // Empties folders to start fresh
        clean: {
        	build: {
        		files: [
        		        {
        		        	dot: true,
        		        	src: [ './dist']
        		        }
        		]
        	}
        },

		// Make sure code styles are up to par and there are no obvious mistakes
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			all: [
				'Gruntfile.js',
				'./src/{,**/}*.js'
			],
			test: {
				options: {
					jshintrc: 'tests/.jshintrc'
				},
				src: ['./tests/spec/{,*/}*.js', './tests/resources/{,*/}*.js']
			}
		},


		copy: {
        	codemirror: {
        		files: [
	        	    {expand:true, 
	        	    	src: ['codemirror/**'], 
	        	    	cwd: 'bower_components',
	        	    	dest: LIB_DIR
	        	    }
	        	]
        	}
        },
        
        concat: {
        	  css: {
        		  src: [
        		        './bower_components/codemirror/lib/codemirror.css',
        		        './bower_components/codemirror/lib/codemirror.css',
        		        './bower_components/codemirror/addon/lint/lint.css',
        		        './bower_components/codemirror/addon/hint/show-hint.css',
					    './bower_components/codemirror/addon/scroll/simplescrollbars.css',
        		        './lib/joint/joint.css',
        		        './css/flo.css'
        		  ],
        		  dest: 'dist/spring-flo.css'
        	  }
        },
        
        cssmin: {
        	css:{
        		src: 'dist/spring-flo.css',
        		dest: 'dist/spring-flo.min.css'
        	}
        },
        
        // Set bower task's targetDir to use src/main/resources/static/bower_components
        bower: {
          options: {
            targetDir: LIB_DIR,
            cleanTargetDir: true
          },
          // Provide install target
          install: {}
        }
        
    });
    
    grunt.registerTask('css', ['concat:css', 'cssmin:css']);
    grunt.registerTask('dev', ['clean:build', 'bower:install', 'copy:codemirror', 'requirejs:development', 'concat:css' ]);
    grunt.registerTask('prod', ['clean:build', 'bower:install', 'copy:codemirror', 'requirejs:production', 'css' ]);
    grunt.registerTask('build', ['clean:build', 'jshint', 'bower:install', 'copy:codemirror', 'requirejs', 'css' ]);
    grunt.registerTask('test', ['karma']);
    grunt.registerTask('default', ['build', 'test']);
    
};
