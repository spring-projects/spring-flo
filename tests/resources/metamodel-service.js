/*
 * Copyright 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(function(require) {
	'use strict';

	var angular = require('angular');
	var app = require('flo');
	
	var convertGraphToText = require('graph-to-text');

	app.factory('StandaloneMetamodel', ['$http', '$q', '$timeout', '$log', 'MetamodelUtils', function($http, $q, $timeout, $log, metamodelUtils) {

		/**
		 * List of listeners to metamodel changes
		 * Each listener may have the following functions defined: metadataChanged(oldData, newData), metadataRefresh(), metadataError() 
		 * @type {Object} 
		 */
	    var listeners = [];
	    
	    var metamodel;
	    
	    /**
	     * Internally stored metamodel load promise
	     */
	    var request;
	    
	    function subscribe(listener) {
	    	listeners.push(listener);
	    }
	    
	    function unsubscribe(listener) {
	    	var index = listeners.indexOf(listener);
	    	if (index >= 0) {
	    		listeners.splice(index);
	    	}
	    }
	    
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
	    
	    function refresh() {
	    	listeners.forEach(function(listener) {
				if (angular.isFunction(listener.metadataRefresh)) {
					listener.metadataRefresh();
				}
	    	});
	    	var deferred = $q.defer();
			$http.get('/metamodel').success(function(json) {
				var newData = {};
				if (Array.isArray(json)) {
					json.forEach(function(data) {
						var metadata = createMetadata(data);
						if (!newData[metadata.group]) {
							newData[metadata.group] = {};
						}
						newData[metadata.group][metadata.name] = metadata;
					});
				}
				var change = {
					newData: newData,
					oldData: metamodel
				};
				metamodel = newData;
				listeners.forEach(function(listener) {
					if (angular.isFunction(listener.metadataChanged)) {
						listener.metadataChanged(change);
					}
				});
				deferred.resolve(metamodel);
			}).error(function(data, status, headers, config) {
				listeners.forEach(function(listener) {
					if (angular.isFunction(listener.metadataError)) {
						listener.metadataError(data, status, headers, config);
					}
				});
				deferred.reject(data);
			});
			request = deferred.promise;
			return request;
	    }
		
	    function load() {
	    	if (!request) {
	    		refresh();
	    	}
	    	return request;
	    }
        
		function parseAndRefreshGraph(definitionText,updateGraphFn,setErrorFn) {
			return $http.get('/parse', { params: {'text': definitionText}}).success(function(data) {
				if (angular.isFunction(setErrorFn)) {
					setErrorFn(null);
				}
				if (typeof data === 'string') {
					data = angular.fromJson(data);
				}
				// TODO handle error case, clear the graph
				$log.info('parse responded with data:\''+JSON.stringify(data)+'\'');
				if (angular.isFunction(updateGraphFn)) {
					updateGraphFn(data);
				}
			}).error(function(data, status, headers, config, statusText) { // jshint ignore:line
				if (typeof data === 'string') {
					data = angular.fromJson(data);
				}
				if (angular.isFunction(setErrorFn)) {
					setErrorFn(data);
				}
				
				$log.info(JSON.stringify(data));
			});
		}
		
    	/**
    	 * Take the JSON description of the flow as provided by the server and map it into a series
    	 * of nodes that can be processed by dagre/joint.
    	 */
        function buildGraphFromJson(flo, jsonFormatData, metamodel) {
            var inputnodes = jsonFormatData.nodes;
            var inputlinks = jsonFormatData.links;

            var incoming = {};
            var outgoing = {};
            var link;
            for (var i = 0; i < inputlinks.length; i++) {
                link = inputlinks[i];
                if (typeof link.from === 'number') {
                    if (typeof outgoing[link.from] !== 'number') {
                        outgoing[link.from] = 0;
                    }
                    outgoing[link.from]++;
                }
                if (typeof link.to === 'number') {
                    if (typeof incoming[link.to] !== 'number') {
                        incoming[link.to] = 0;
                    }
                    incoming[link.to]++;
                }
            }

            var inputnodesCount = inputnodes ? inputnodes.length : 0;
            var nodesIndex = [];
            for (var n = 0; n < inputnodesCount; n++) {
                var name = inputnodes[n].name;
                var label = inputnodes[n].label || inputnodes[n].name;
                var group = inputnodes[n].group;
                if (!group) {
                    group = metamodelUtils.matchGroup(metamodel, name, incoming[n], outgoing[n]);
                }
                var newNode = flo.createNode(metamodelUtils.getMetadata(metamodel, name, group), inputnodes[n].properties);
                newNode.attr('.label/text', label);
                var streamname = inputnodes[n]['stream-name'];
                if (streamname) {
                    newNode.attr('stream-name',streamname);
                }
                if (inputnodes[n].range) {
                    newNode.attr('range',inputnodes[n].range);
                }
                if (inputnodes[n].propertiesranges) {
                    newNode.attr('propertiesranges',inputnodes[n].propertiesranges);
                }
                if (inputnodes[n]['stream-id']) {
                    newNode.attr('stream-id',inputnodes[n]['stream-id']);
                }
                nodesIndex.push(newNode.id);
            }
//			var nextId = inputnodesCount; // For dropped nodes, they will start getting this ID

            var inputlinksCount = inputlinks?inputlinks.length:0;
//			$log.info('Links ' + inputlinksCount);
            for (var l = 0; l < inputlinksCount; l++) {
                link = inputlinks[l];
                flo.createLink({
                    'id': nodesIndex[link.from],
                    'selector': '.output-port'
                }, {
                    'id': nodesIndex[link.to],
                    'selector': '.input-port'
                });
            }

            flo.performLayout();

            flo.fitToPage();
        }
        
        function textToGraph(flo, definition) {
    		return parseAndRefreshGraph(definition.text, function(json) {
    			flo.getGraph().clear();
    			load().then(function(metamodel) {
    				buildGraphFromJson(flo, json, metamodel);
    			});
    		},function(errors) {
    			definition.parseError = errors;
    		});
        }
        
        function graphToText(flo, definition) {
			definition.text = convertGraphToText(flo.getGraph());
			return $timeout(function() {
				return parseAndRefreshGraph(definition.text, null, function(errors) {
					definition.parseError = errors;
				});
			});
        }
        
        function isValidPropertyValue(model, property, value) {
        	var type = model.attr('metadata/name');
        	if (type === 'tap' && property === 'channel') {
        		return value.indexOf('tap:stream:') === 0 || value.indexOf('tap:job:') === 0;
        	}
        	if (type === 'named-channel' && property === 'channel') {
        		return value.indexOf('queue:') === 0 || value.indexOf('topic:') === 0;
        	}
        	return true;
        }
        
        function encodeTextToDSL(value) {
        	return value.replace(/(?:\r\n|\r|\n)/g, '\\n');
        }
        
        function decodeTextFromDSL(value) {
        	return value.replace(/\\n/g, '\n');
        }

		return {
	    	'subscribe': subscribe,
			'unsubscribe': unsubscribe,
			'refresh': refresh,
			'load': load,
            'textToGraph': textToGraph,
            'graphToText': graphToText,
            'isValidPropertyValue': isValidPropertyValue,
            'encodeTextToDSL': encodeTextToDSL,
            'decodeTextFromDSL': decodeTextFromDSL
	    };
	    
	}]);

	return app;

});
