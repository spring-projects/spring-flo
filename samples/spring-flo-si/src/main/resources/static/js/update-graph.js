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
 * Update the labels on links on the graph based on a fresh copy of the graph data.
 * This assumes no nodes have changed, no links have changed - purely the counter 
 * stats on those elements.
 * 
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
//		console.log("collapsed = "+JSON.stringify(retval));
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
			var label = link.label(1);
			if (label.timer) {
				clearTimeout(label.timer);
			}
			link.label(1,{position: p})
			p+=0.06
			if (p<1) { 
				label.timer = setTimeout(function() {animate(link,p)},15);
			} else {
				link.label(1, {
	                position: 0.0,
	                type: 'blip',
	//                  rate: sourceRates.outgoingRate,
	                attrs: {
	                    text: {
	                        transform: 'translate(0, 0)',
	                        //text: '{{rateLabel()}}',
	                        text: '',
	                        'fill': 'black',
	                        'stroke': 'black',
	                        'font-size': '4'
	                    },
	                    rect: {
	                        transform: 'translate(0, 0)',
	                        stroke: '#00ffff',
	                        rx:1,ry:1,
	                        'border-width': '3px',
	                        'stroke-width': 4,
	                        fill: '#00ffff'
	                    }
	                }
	            });
//				link.label(1,{text:{text:''}});
//				label.attr('rect/display','none');
//				label.attr('text/display','none');
//				label.attrs.text.display = 'none'; 
//				label.attrs.rect.display = 'none'; 
			} 
		}
	}

	return function(input, graph, labelpath) { //flo, metamodel, metamodelUtils) {
     	// input is a string like this (3 nodes: foo, goo and hoo):   foo --a=b --c=d > goo --d=e --f=g>hoo
     	var trimmed = input.trim();
     	if (trimmed.length===0) {
     		return;
     	}
     	var integrationGraph = JSON.parse(input);
     	var nodes = integrationGraph.nodes;
     	var graphNodes = graph.getElements();
     	var map = {};
     	var linksToVisit = graph.getLinks();
     	graphNodes.forEach(function(element) {
     		 if (element.attr('metadata/name')) { // is it a node?
//     		if (!element.get('source')) {
     			map[element.attr('props/id')] = element;
     		} else {
     			linksToVisit.push(element);
     		}
     	});
     	function toLabel(text) {
     		var string = text.toString();
     		if (string.length>5) {
     			string = string.substring(0,5);
     			if (string.endsWith('.')) {
     				string = string.substring(0,4);
     			}
     			return string;
     		}
     		return text;
     	}
     	// Go through nodes, updating properties
     	for (var i=0;i<nodes.length;i++) {
     		var inputNode = nodes[i];
	        var props = collapse(inputNode.stats,'stats');
	        var props2 = collapse(inputNode.properties,'properties');
            for (var attrname in props2) { props[attrname] = props2[attrname]; }
            
            map[inputNode.nodeId].attr('props',props);
     	}
     	for (var i=0;i<linksToVisit.length;i++) {
     		var link = linksToVisit[i];
     		var sourceId = link.get('source').id;
     		var sourceElement = graph.getCell(sourceId);
     		var rate;
     		var props = sourceElement.attr('props');
     		Object.keys(props).forEach(function(key) {
     			if (key.toLowerCase() === labelpath.toLowerCase()) {
     				rate = props[key];
     			}
     		});
     		var existingLabel = link.label(0);
     		var existingValue;
     		var animateLink = false;
     		if (existingLabel) {
     			existingValue = existingLabel.attrs.text.text;
     			if (existingValue !== toLabel(rate)) {
     				animateLink = true;
     			}
     		}
     		if (rate) {
 				link.label(0, {
                  position: 15,
                  type: 'outgoing-rate',
                  attrs: {
                      text: { transform: 'translate(0, -8)', text: toLabel(rate), 'fill': 'black', 'stroke': 'none', 'font-size': '12' },
                      rect: {
                    	  display: 'none'
//                          transform: 'translate(0, -5)',
//                          stroke: 'black',
//                          rx:1,ry:1,
//                          'border-width': '2px',
//                          'stroke-width': 1,
//                          fill: '#00B0A7'
                      }
                  }
              });

 				if (animateLink) {
					link.label(1, {
		                position: 0.0,
		                type: 'blip',
		//                  rate: sourceRates.outgoingRate,
		                attrs: {
		                    text: {
		                        transform: 'translate(0, 0)',
		                        //text: '{{rateLabel()}}',
		                        text: ' ',
		                        'fill': '#00ffff',
		                        'stroke': 'black',
		                        'font-size': '10'
		                    },
		                    rect: {
		                        transform: 'translate(0, 0)',
//		                        stroke: '#00B0A7',
		                        'stroke': 'black',
		                        rx:2,ry:2,
		                        'border-width': 2,
		                        'stroke-width': 3,
//		                        fill: '#00B0A7'
			                        'fill': 'black'
		                    }
		                }
		            });
					link.label(1).timer = setTimeout(function() {animate(this,0.0)}.bind(link),0);
 				}
     		}
     	}
	};
     	
});