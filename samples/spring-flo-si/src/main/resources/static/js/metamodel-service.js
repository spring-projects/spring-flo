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
	var updateGraph = require('update-graph');
	
	return ['$http', '$q', '$timeout', '$log', 'MetamodelUtils', function($http, $q, $timeout, $log, metamodelUtils) {

	    var metamodel;
	    
	    // Internally stored metamodel load promise
	    var request;

		var statsProperties = [
		    {'name':'name','default':'?', 'description':'name'},
		    {'name':'id','default':'?', 'description':'node id'},
		    {'name':'componentType','default':'','description':'Detailed component type'},
		    {'name':'stats.loggingEnabled', 'default': '?', 'description':'?' },
		  	{'name':'stats.statsEnabled', 'default': '?', 'description':'?' },
		  	{'name':'stats.countsEnabled', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendRate.count', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendRate.min', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendRate.max', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendRate.mean', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendRate.standardDeviation', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendRate.countLong', 'default': '?', 'description':'?' },
		  	{'name':'stats.errorRate.count', 'default': '?', 'description':'?' },
		  	{'name':'stats.errorRate.min', 'default': '?', 'description':'?' },
		  	{'name':'stats.errorRate.max', 'default': '?', 'description':'?' },
		  	{'name':'stats.errorRate.mean', 'default': '?', 'description':'?' },
		  	{'name':'stats.errorRate.standardDeviation', 'default': '?', 'description':'?' },
		  	{'name':'stats.errorRate.countLong', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendCount', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendErrorCount', 'default': '?', 'description':'?' },
		  	{'name':'stats.timeSinceLastSend', 'default': '?', 'description':'?' },
		  	{'name':'stats.meanSendRate', 'default': '?', 'description':'?' },
		  	{'name':'stats.meanErrorRate', 'default': '?', 'description':'?' },
		  	{'name':'stats.meanErrorRatio', 'default': '?', 'description':'?' },
		  	{'name':'stats.meanSendDuration', 'default': '?', 'description':'?' },
		  	{'name':'stats.minSendDuration', 'default': '?', 'description':'?' },
		  	{'name':'stats.maxSendDuration', 'default': '?', 'description':'?' },
		  	{'name':'stats.standardDeviationSendDuration', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendDuration.count', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendDuration.min', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendDuration.max', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendDuration.mean', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendDuration.standardDeviation', 'default': '?', 'description':'?' },
		  	{'name':'stats.sendDuration.countLong', 'default': '?', 'description':'?' }];
		
	    /**
	     * Helper that goes from basic JSON to a lazy getter structure. Useful when the
	     * metamodel is 'cheap' to build. If it is costly to discover the actual properties
	     * the getter may be more complex (e.g. make a REST request).
	     */
		function createMetadata(entry) {
			var props = {};
			if (!entry.properties) {
				// use the default stats properties
				entry.properties = JSON.parse(JSON.stringify(statsProperties));
			}
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
        
        function updateGraphLabels(flo, text, labelpath) {
			updateGraph(text, flo.getGraph(), labelpath);
        }

        function textToGraph(flo, definition) {
        	// TODO perhaps push these flo operations into the 'caller' to make this simpler
			flo.getGraph().clear();
			load().then(function(metamodel) {
				convertTextToGraph(definition.text, flo, metamodel, metamodelUtils);
				updateGraph(definition.text,flo.getGraph(),'stats.sendcount');
	            flo.performLayout();
	            flo.fitToPage();
			});
        }

		return {
			'load': load,
            'textToGraph': textToGraph,
            'updateGraphLabels': updateGraphLabels,
            'graphToText': graphToText
	    };
	    
	}];

});
