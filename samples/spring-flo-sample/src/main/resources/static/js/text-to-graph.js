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
 * Convert a text representation to a graph.
 * 
 * @author Alex Boyko
 * @author Andy Clement
 */
define(function() {
	'use strict';
	
	return function(input, flo, metamodel, metamodelUtils) {
     	// input is a string like this (3 nodes: foo, goo and hoo):   foo --a=b --c=d > goo --d=e --f=g>hoo
     	var trimmed = input.trim();
     	if (trimmed.length===0) {
     		return;
     	}
     	var lines = trimmed.split('\n');
     	for (var l=0;l<lines.length;l++) {
     		var line = lines[l];
     		var elements = line.split('>');
         	var lastNode = null;
     		for (var e=0;e<elements.length;e++) {
     			var element = elements[e].trim();
     			// Has properties?
     			var startOfProps = element.indexOf(' ');
     			var name = element;
                	var properties = {};
        			if (startOfProps !== -1) {
     				name = element.substring(0,startOfProps);
     				var propValues = element.substring(startOfProps+1).trim().split(' ');
     				for (var p=0;p<propValues.length;p++) {
     					var propValue = propValues[p].trim();
     					if (propValue.length===0) {
     						// allows for multiple spaces between options
     						continue;
     					}
     					var equalsIndex = propValue.indexOf('=');
     					// The 2 skips the '--'
     					var key = propValue.substring(2,equalsIndex);
     					var value = propValue.substring(equalsIndex+1);
     					properties[key] = value;
     				}
     			}
                var group = metamodelUtils.matchGroup(metamodel, name, 1, 1);
     			var newNode = flo.createNode(metamodelUtils.getMetadata(metamodel,name,group),properties);
     			newNode.attr('.label/text',name);
     			if (lastNode) {
	                    flo.createLink({'id': lastNode.id,'selector': '.output-port'}, 
	                    		       {'id': newNode.id,'selector': '.input-port'});
     			}
     			lastNode = newNode;
     		}
     	}
	};
	
});