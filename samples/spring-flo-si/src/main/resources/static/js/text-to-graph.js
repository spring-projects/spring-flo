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
define(function(require) {
	'use strict';
	var joint = require('joint');
	
	function collapseOneLevel(prefix, obj, collector) {
		var type = typeof obj;
		if (obj == null) {
			collector[prefix] = null;
			return;
		}
		if (type === 'object') {
			Object.keys(obj).forEach(function(key) {
				collapseOneLevel(prefix.length==0?key:prefix+'.'+key,obj[key],collector);
			});
		} else if (type === 'array') {
			for (var i=0;i<obj.length;i++) {
				collapseOneLevel(prefix.length==0?key:prefix+'.'+i,obj[i],collector);
			}
		} else {
			collector[prefix] = obj;
		}
	}
	
	function collapse(obj, prefix) {
		if (!prefix) {
			prefix = '';
		}
		var retval = {};
		collapseOneLevel(prefix,obj,retval);
		console.log("collapsed = "+JSON.stringify(retval));
		return retval;
	}

    var MAGNITUDE_NUMBERS = [ 1000000000, 1000000, 1000];
    var MAGNITUDE_LITERALS = ['B', 'M', 'K'];
    
	var rateLabel = function() {
        var postFix, division, index = -1, fixed = 3;
        do {
            division = this.rate / MAGNITUDE_NUMBERS[++index];
        } while (!Math.floor(division) && index < MAGNITUDE_NUMBERS.length);
        if (index === MAGNITUDE_NUMBERS.length) {
            postFix = '';
            division = this.rate;
        } else {
            postFix = MAGNITUDE_LITERALS[index];
        }
        for (var decimal = 1; decimal <= 100 && Math.floor(division / decimal); decimal*=10) {
            fixed--;
        }
        return division.toFixed(fixed) + postFix;
    };
	
	function animate(link,p) {
//		console.log("moving label on "+link.id+" to "+p);
		if (!link.label(1)) {
			console.log("No label1 on this link??");
		} else {
			link.label(1,{position: p})
			p+=0.025
			if (p>0.975) p = 0;
			setTimeout(function() {animate(link,p)},25);
		}
	}

		
	return function(input, flo, metamodel, metamodelUtils) {
     	// input is a string like this (3 nodes: foo, goo and hoo):   foo --a=b --c=d > goo --d=e --f=g>hoo
     	var trimmed = input.trim();
     	if (trimmed.length===0) {
     		return;
     	}
     	var getMetadata = function(type) {
     		var group = metamodelUtils.matchGroup(metamodel, type, 1, 1);
     		var md = metamodelUtils.getMetadata(metamodel, type, group);
     		if (!md || md.unresolved) {
     			var secondAttempt;
 				// Examples:   mail:outbound-channel-adapter or file:inbound-channel-adapter
     			if (type.indexOf("inbound-channel-adapter")!=-1) {
 					type = "inbound-channel-adapter";
 					group = metamodelUtils.matchGroup(metamodel, type, 1, 1);
 		     		secondAttempt = metamodelUtils.getMetadata(metamodel, type, group);
 					if (secondAttempt && !secondAttempt.unresolved) {
 						md = secondAttempt;
 					}
     			} else if (type.indexOf("outbound-channel-adapter")!=-1) {
 					type = "outbound-channel-adapter";
 					group = metamodelUtils.matchGroup(metamodel, type, 1, 1);
 		     		secondAttempt = metamodelUtils.getMetadata(metamodel, type, group);
 					if (secondAttempt && !secondAttempt.unresolved) {
 						md = secondAttempt;
 					}
     			} else {
     				// use the general one - this will ensure validation is OK and tooltips work but
     				// we aren't really sure what type it is.
     				type = 'general';
 					group = metamodelUtils.matchGroup(metamodel, type, 1, 1);
 		     		secondAttempt = metamodelUtils.getMetadata(metamodel, type, group);
 					if (secondAttempt && !secondAttempt.unresolved) {
 						md = secondAttempt;
 					}
     			}
     		}
     		return md;
     	}
     	var integrationGraph = JSON.parse(input);
     	var nodes = integrationGraph.nodes;
     	var nodesMap = {};
     	for (var i=0;i<nodes.length;i++) {
     		var node = nodes[i];
            var stats = node.stats;
            var props = collapse(node.stats,'stats');
            var props2 = collapse(node.properties,'properties');
            for (var attrname in props2) { props[attrname] = props2[attrname]; }
            props.name = node.name;
            props.id = node.nodeId;
     		var newNode = flo.createNode(getMetadata(node.componentType), props);
     		var nodeName = node.name;
     		var metadataName = newNode.attr('metadata').name;
     		if (metadataName === 'splitter' && nodeName.endsWith('.splitter')) {
     			nodeName = nodeName.substring(0,nodeName.length-'.splitter'.length);
     		} else if (metadataName === 'aggregator' && nodeName.endsWith('.aggregator')) {
     			nodeName = nodeName.substring(0,nodeName.length-'.aggregator'.length);
     		} else if (metadataName === 'service-activator' && nodeName.endsWith('serviceActivator')) {
     			nodeName = nodeName.substring(0,nodeName.length-'.serviceActivator'.length);
     		}
     		if (node.name.indexOf('ConsumerEndpointFactoryBean')!==-1) {
     			if (metadataName === 'router' && props['properties.expression']) {
     				nodeName = props['properties.expression']+'?';
     			} else if (metadataName != 'general') {
     				nodeName = metadataName;
     			}
     		}
 			newNode.attr('props/componentType',node.componentType);
//     		if (nodeName != node.componentType) {
//     			// Don't lose the componentType. For example the nodeName might end up as mailOut but
//     			// componentType is mail:outbound-channel-adapter
//     		}
 			newNode.attr('.label/text',nodeName);
 			nodesMap[node.nodeId] = newNode;
     	}
     	var links = integrationGraph.links;
     	for (var i=0;i<links.length;i++) {
     		var link = links[i];
     		var isErrorLink = false;
     		var fromPort = '.output-port';
     		var toName = nodesMap[link.to].attr('.label/text');
     		var fromName = nodesMap[link.from].attr('.label/text');
     		if (link.type == 'error') {
     			fromPort = '.error-port';
     			isErrorLink=true;
     		}
     		var jointLink = flo.createLink({'id': nodesMap[link.from].id,'selector': fromPort}, 
     				  		 {'id': nodesMap[link.to].id, 'selector': '.input-port'});
     		if (isErrorLink) {
     			jointLink.attr('.connection/stroke','red');
     		} else {
     			if (nodes[link.from-1].stats && nodes[link.from-1].stats.hasOwnProperty('sendCount')) {
//     				jointLink.label(0, {
//	                  position: 15,
//	                  type: 'outgoing-rate',
//	//                  rate: sourceRates.outgoingRate,
//	                  attrs: {
//	                      text: {
//	                          transform: 'translate(0, -8)',
//	                          //text: '{{rateLabel()}}',
//	                          text: nodes[link.from-1].stats.sendCount,
//	                          'fill': 'black',
//	                          'stroke': 'none',
//	                          'font-size': '12'
//	                      },
//	                      rect: {
//	                    	  display: 'none'
////	                          transform: 'translate(0, -5)',
////	                          stroke: 'black',
////	                          rx:1,ry:1,
////	                          'border-width': '2px',
////	                          'stroke-width': 1,
////	                          fill: '#00B0A7'
//	                      }
//	                  }
//	              });
//     				jointLink.label(1, {
//  	                  position: 0.5,
//  	                  type: 'message',
//  	//                  rate: sourceRates.outgoingRate,
//  	                  attrs: {
//  	                      text: {
//  	                          transform: 'translate(0, 0)',
//  	                          //text: '{{rateLabel()}}',
//  	                          text: ' ',
//  	                          'fill': 'black',
//  	                          'stroke': 'black',
//  	                          'font-size': '2'
//  	                      },
//  	                      rect: {
//  	                          transform: 'translate(0, 0)',
//  	                          stroke: '#ffffff',
//  	                          rx:1,ry:1,
//  	                          'border-width': '3px',
//  	                          'stroke-width': 2,
//  	                          fill: '#ffffff'
//  	                      }
//  	                  }
//  	              });
//     				console.log("Label 1 on link id "+jointLink.id+" = "+jointLink.label(1));
//     				setTimeout(function() {animate(this,0.0)}.bind(jointLink),1000);
//     				jointLink.transition('labels/1/position',1,{valueFunction: joint.util.interpolate.unit, timingFunction: joint.util.timing.bounce});
     			}
     		  }
     	}
//     	var lines = trimmed.split('\n');
//     	for (var l=0;l<lines.length;l++) {
//     		var line = lines[l];
//     		var elements = line.split('>');
//         	var lastNode = null;
//     		for (var e=0;e<elements.length;e++) {
//     			var element = elements[e].trim();
//     			// Has properties?
//     			var startOfProps = element.indexOf(' ');
//     			var name = element;
//                	var properties = {};
//        			if (startOfProps !== -1) {
//     				name = element.substring(0,startOfProps);
//     				var propValues = element.substring(startOfProps+1).trim().split(' ');
//     				for (var p=0;p<propValues.length;p++) {
//     					var propValue = propValues[p].trim();
//     					if (propValue.length===0) {
//     						// allows for multiple spaces between options
//     						continue;
//     					}
//     					var equalsIndex = propValue.indexOf('=');
//     					// The 2 skips the '--'
//     					var key = propValue.substring(2,equalsIndex);
//     					var value = propValue.substring(equalsIndex+1);
//     					properties[key] = value;
//     				}
//     			}
//                var group = metamodelUtils.matchGroup(metamodel, name, 1, 1);
//     			var newNode = flo.createNode(metamodelUtils.getMetadata(metamodel,name,group),properties);
//     			newNode.attr('.label/text',name);
//     			if (lastNode) {
//	                    flo.createLink({'id': lastNode.id,'selector': '.output-port'}, 
//	                    		       {'id': newNode.id,'selector': '.input-port'});
//     			}
//     			lastNode = newNode;
//     		}
//     	}
	};
	
});