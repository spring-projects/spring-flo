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
define(function(require) {
	'use strict';
	
	require('json5');
	
	var convertGraphToText = require('graph-to-text');
	var convertTextToGraph = require('text-to-graph');
	
	return ['$http', '$q', '$timeout', '$log', 'MetamodelUtils', function($http, $q, $timeout, $log, metamodelUtils) {

	    var metamodel;
	    
	    // Internally stored metamodel load promise
	    var request;
	    
	    /**
	     * Helper that goes from basic JSON to a lazy getter structure. Useful when the
	     * metamodel is 'cheap' to build. If it is costly to discover the actual properties
	     * the getter may be more complex (e.g. make a REST request).
	     */
		function createMetadata(entry) {
			var props = {};
			if (Array.isArray(entry.properties)) {
				entry.properties.forEach(function(property) {
					if (!property.id) {
						property.id = property.name;
					}
					props[property.id] = property;
				});
			}
			entry.properties = props;
			return {
				name: entry.name,
				group: entry.group,
				icon: entry.icon,
				constraints: entry.constraints,
				description: entry.description,
				metadata: entry.metadata,
				properties: entry.properties,
				get: function(property) {
					var deferred = $q.defer();
					if (entry.hasOwnProperty(property)) {
						deferred.resolve(entry[property]);
					} else {
						deferred.reject();
					}
					return deferred.promise;
				}
			};
		}
		
	    function load() {
	    	// COULDDO: to cache the result here, check result before doing this processing
	    	// and simply return it if it is set. If doing that may want to override refresh
	    	// in this service
			var metamodelData = JSON5.parse(require('text!metamodel-sample.json'));
	    	var deferred = $q.defer();
	    	var newData = {};
	    	metamodelData.forEach(function(data) {
	    		var metadata = createMetadata(data);
				if (!newData[metadata.group]) {
					newData[metadata.group] = {};
				}
				newData[metadata.group][metadata.name] = metadata;
	    	});
			metamodel = newData;
			deferred.resolve(metamodel);
			request = deferred.promise;
			return request;
	    }
	            
        function graphToText(flo, definition) {
			definition.text = convertGraphToText(flo.getGraph()); 
        }

        function textToGraph(flo, definition) {
        	// TODO perhaps push these flo operations into the 'caller' to make this simpler
			flo.getGraph().clear();
			load().then(function(metamodel) {
				convertTextToGraph(definition.text, flo, metamodel, metamodelUtils);
	            flo.performLayout();
	            flo.fitToPage();
			});
        }

		return {
			'load': load,
            'textToGraph': textToGraph,
            'graphToText': graphToText
	    };
	    
	}];

});
