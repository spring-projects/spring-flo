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
	
	var joint = require('joint');
	
	var dagre = require('dagre');
	
    var HANDLE_ICON_MAP = {
       	'remove': 'icons/delete.svg',	
    };
        
    var DECORATION_ICON_MAP = {
      	'error': 'icons/error.svg'
    };	

    var IMAGE_W = 120,
        IMAGE_H = 40;

    var HORIZONTAL_PADDING = 10;

    joint.shapes.si = {};
    
    joint.routers.floforintegration = (function() {
    	
        // expands a box by specific value
        function expand(bbox, val) {
            return joint.g.rect(bbox).moveAndExpand({ x: -val, y: -val, width: 2 * val, height: 2 * val });
        }
        
        function routeAround(exp, ref, anchor, opt) {
            
        	var anchorSide = exp.sideNearestToPoint(anchor);
        	var expAnchor = exp.pointNearestToPoint(anchor);
            var line = joint.g.line(ref, anchor);
            var center = exp.center();
        	var intersection;
			var pts = [];
        	
        	if (anchorSide !== 'top') {
        		intersection = line.intersection(joint.g.line(exp.origin(), exp.topRight()));
        		if (intersection) {
        			if (anchorSide === 'bottom') {
        				if (intersection.x - exp.x + expAnchor.x - exp.x <= exp.width) {
        					pts = [exp.origin(), exp.bottomLeft()];
        				} else {
        					pts = [exp.topRight(), exp.corner()];
        				}
        			} else {
        				if (anchorSide === 'left') {
        					pts = [exp.origin()];
        				} else {
        					pts = [exp.topRight()];
        				}
        			}
        			if (opt.includeExtraPoints) {
        				pts.push(expAnchor);
        			}
        			return pts;
        		}
        	}
        	
        	if (anchorSide !== 'bottom') {
        		intersection = line.intersection(joint.g.line(exp.corner(), exp.bottomLeft()));
        		if (intersection) {
        			if (anchorSide === 'top') {
        				if (intersection.x - exp.x + expAnchor.x - exp.x <= exp.width) {
        					pts = [exp.bottomLeft(), exp.origin()];
        				} else {
        					pts = [exp.corner(), exp.topRight()];
        				}
        			} else {
        				if (anchorSide === 'left') {
        					pts = [exp.bottomLeft()];
        				} else {
        					pts = [exp.corner()];
        				}
        			}
        			if (opt.includeExtraPoints) {
        				pts.push(expAnchor);
        			}
        			return pts;
        		}
        	}
        	
        	if (anchorSide !== 'left') {
        		intersection = line.intersection(joint.g.line(exp.origin(), exp.bottomLeft()));
        		if (intersection) {
        			if (anchorSide === 'right') {
        				if (intersection.y - exp.y + expAnchor.y - exp.y <= exp.height) {
        					pts = [exp.origin(), exp.topRight()];
        				} else {
        					pts = [exp.bottomLeft(), exp.corner()];
        				}
        			} else {
        				if (anchorSide === 'top') {
        					pts = [exp.origin()];
        				} else {
        					pts = [exp.bottomLeft()];
        				}
        			}
        			if (opt.includeExtraPoints) {
        				pts.push(expAnchor);
        			}
        			return pts;
        		}
        	}
        	
        	if (anchorSide !== 'right') {
        		intersection = line.intersection(joint.g.line(exp.topRight(), exp.corner()));
        		if (intersection) {
        			if (anchorSide === 'left') {
        				if (intersection.y - exp.y + expAnchor.y - exp.y <= exp.height) {
        					pts = [exp.topRight(), exp.origin()];
        				} else {
        					pts = [exp.corner(), exp.bottomLeft()];
        				}
        			} else {
        				if (anchorSide === 'top') {
        					pts = [exp.topRight()];
        				} else {
        					pts = [exp.corner()];
        				}
        			}
        			if (opt.includeExtraPoints) {
        				pts.push(expAnchor);
        			}
        			return pts;
        		}
        	}
        	
        	return pts;
        }
        
        function findRoute(vx, opt, linkView) {
        	
        	var vertices = opt.metro ? joint.routers.metro(vx, opt, linkView) : vx;
        	var sourceRoute = [], targetRoute = [];
        	
        	var paper = linkView.paper;
        	var reference = vertices.length ? vertices[0] : joint.g.rect(linkView.targetBBox).center();
        	var sourceAnchorPt = paper.options.linkConnectionPoint(linkView, linkView.sourceView, linkView.sourceMagnet, reference);
        	var targetAnchorPt = paper.options.linkConnectionPoint(linkView, linkView.targetView, linkView.targetMagnet, sourceAnchorPt);
        	var padding = opt.elementPadding || 20;
        	
        	if (linkView.sourceView) {
            	var expSource = expand(linkView.sourceView.model.getBBox(), padding);
            	while (vertices.length && expSource.containsPoint(vertices[0])) {
            		vertices.splice(0, 1);
            	}
            	var sourceRef = vertices.length ? joint.g.point(vertices[0]) : targetAnchorPt;
                sourceRoute = routeAround(expSource, sourceRef, sourceAnchorPt, opt).reverse();
        	}
        	if (linkView.targetView) {
            	var expTarget = expand(linkView.targetView.model.getBBox(), padding);
            	while (vertices.length && expTarget.containsPoint(vertices[vertices.length - 1])) {
            		vertices.splice(vertices.length - 1, 1);
            	}
            	var targetRef = vertices.length ? joint.g.point(vertices[vertices.length - 1]) : sourceAnchorPt;

                targetRoute = routeAround(expTarget, targetRef, targetAnchorPt, opt);
        	}
            
            return sourceRoute.concat(vertices).concat(targetRoute);
        };

        return findRoute;

    })();
    
    joint.shapes.si.Channel = joint.shapes.basic.Generic.extend({

        markup:
        '<g class="shape">'+
            '<rect class="border"/>' +
            '<path class="the_shape" d="M 0 10 H 100 A 8 10 0 0 1 100 30 H 0"/>'+
            '<ellipse class="the_shape" cx="0" cy="20" rx="8" ry="10"/>'+
            '<text class="label"/>'+
            '<text class="label2"/>'+
        '</g>' +
//        '<text class="stream-label"/>'+
        '<rect class="input-port" />'+
        '<rect class="output-port"/>'+
        '<circle class="tap-port"/>',

        defaults: joint.util.deepSupplement({
            type: 'channel',//joint.shapes.flo.NODE_TYPE,
            position: {x: 0, y: 0},
            size: { width: 100, height: 40 },
            attrs: {
                '.': {
                    magnet: false,
                },
                '.the_shape': {
                	'stroke':'#000000'
                },
                // rounded edges around image
//                '.border': {
//                    width: IMAGE_W,
//                    height: IMAGE_H,
//                    rx: 2,
//                    ry: 2,
//                    'fill-opacity':0, // see through
//                    stroke: '#eeeeee',
//                    'stroke-width': 0,
//                },
//                '.box': {
//                    width: IMAGE_W,
//                    height: IMAGE_H,
//                    rx: 2,
//                    ry: 2,
//                    //'fill-opacity':0, // see through
//                    stroke: '#6db33f',
//                    fill: '#eeeeee',
//                    'stroke-width': 2,
//                },
                '.input-port': {
                    type: 'input',
                    port: 'input',
                    r:4,
                    height: 4, width: 4,
                    magnet: true,
                    fill: '#eeeeee',
                    transform: 'translate(' + -2 + ',' + ((20/2)-2+10) + ')',
                    stroke: '#34302d',
                    'stroke-width': 1,
                },
                '.output-port': {
                    type: 'output',
                    port: 'output',
                    r:4,
                    height: 4, width: 4,
                    magnet: true,
                    fill: '#eeeeee',
                    transform: 'translate(' + (100+8-2) + ',' + ((20/2)-2+10) + ')',
                    stroke: '#34302d',
                    'stroke-width': 1,
                },
//                '.tap-port': {
//                    type: 'output',
//                    port: 'tap',
//                    r: 4,
//                    magnet: true,
//                    fill: '#eeeeee',
//                    'ref-x': 0.5,
//                    'ref-y': 0.99999999,
//                    ref: '.border',
//                    stroke: '#34302D'
//                },
                '.label': {
                    'ref-x': 0.5, // jointjs specific: relative position to ref'd element
                    'ref-y': 0.525,
                    'y-alignment': 'middle',
                    'x-alignment' : 'middle',
                    ref: '.the_shape', // jointjs specific: element for ref-x, ref-y
                    fill: 'black',
                    'stroke': 'black',
                    'font-size': '12px',
                	'font-family': 'Ubuntu Mono',
                	'color': 'black'
                },
                '.label2': {
                    'y-alignment': 'middle',
                    'ref-x': HORIZONTAL_PADDING+2, // jointjs specific: relative position to ref'd element
                    'ref-y': 0.55, // jointjs specific: relative position to ref'd element
                    ref: '.border', // jointjs specific: element for ref-x, ref-y
                    fill: 'black',
                    'font-size': 20
                },
//                '.stream-label': {
//                    'x-alignment': 'middle',
//                    'y-alignment': -0.999999,
//                    'ref-x': 0.5, // jointjs specific: relative position to ref'd element
//                    'ref-y': 0, // jointjs specific: relative position to ref'd element
//                    ref: '.border', // jointjs specific: element for ref-x, ref-y
//                    fill: '#AAAAAA',
//                    'font-size': 15
//                },
//                '.shape': {
//                }
            }
        }, joint.shapes.basic.Generic.prototype.defaults)
    });
    

	joint.shapes.si.Node = joint.shapes.basic.Generic.extend({
		markup: 
	    		'<g class="shape"><image class="image" /></g>'+
	    		'<rect class="border-white"/>' +
	    		'<rect class="border"/>' +
	    		'<rect class="box"/>'+
	    		'<text class="label"/>'+
	    		'<text class="label2"></text>'+
	    		'<rect class="input-port" />'+
	    		'<rect class="error-port" />'+
	    		'<rect class="output-port"/>'+
	    		'<rect class="output-port-cover"/>',

	    defaults: joint.util.deepSupplement({

	        type: 'node',//joint.shapes.flo.NODE_TYPE,
	        position: {x: 0, y: 0},
	        size: { width: IMAGE_W, height: IMAGE_H },
	        attrs: {
	            '.': { magnet: false },
	            // rounded edges around image
	            '.border': {
	                width: IMAGE_W,
	                height: IMAGE_H,
	                rx: 3,
	                ry: 3,
	                'fill-opacity':0, // see through
	                stroke: '#eeeeee',
	                'stroke-width': 0
	            },

	            '.box': {
	                width: IMAGE_W,
	                height: IMAGE_H,
	                rx: 3,
	                ry: 3,
	                //'fill-opacity':0, // see through
	                stroke: '#6db33f',
	                fill: '#eeeeee',
	                'stroke-width': 1
	            },
	            '.input-port': {
	            	type: 'input',
	            	height: 4, width: 4,
	            	magnet: true,
	            	fill: '#eeeeee',
	            	transform: 'translate(' + -2 + ',' + ((IMAGE_H/2)-2) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.output-port': {
	            	type: 'output',
	            	height: 4, width: 4,
	            	magnet: true,
	            	fill: '#eeeeee',
	            	transform: 'translate(' + (IMAGE_W-2) + ',' + ((IMAGE_H/2)-2) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.error-port': {
	            	type: 'output',
	            	height: 4, width: 4,
	            	magnet: true,
	            	fill: '#ff0000',
	            	transform: 'translate(' + (IMAGE_W/2-2) + ',' + ((IMAGE_H)-2) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.label': {
	                'text-anchor': 'middle',
	                'ref-x': 0.5, // jointjs specific: relative position to ref'd element
	                // 'ref-y': -12, // jointjs specific: relative position to ref'd element
	                'ref-y': 0.3,
	                ref: '.border', // jointjs specific: element for ref-x, ref-y
	                fill: 'black',
	                'font-size': 14
	            },
	            '.label2': {
	            	'text': '\u21d2',
	                'text-anchor': 'middle',
	                'ref-x': 0.15, // jointjs specific: relative position to ref'd element
	                'ref-y': 0.15, // jointjs specific: relative position to ref'd element
	                ref: '.border', // jointjs specific: element for ref-x, ref-y
	                transform: 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H/2) + ')',
	                fill: 'black',
	                'font-size': 24
	            },
	            '.shape': {
	            },
	            '.image': {
	                width: IMAGE_W,
	                height: IMAGE_H
	            }
	        }
	    }, joint.shapes.basic.Generic.prototype.defaults)
	});

	joint.shapes.si.ServiceActivator = joint.shapes.basic.Generic.extend({
		markup: 
    		'<g class="shape"><image class="image" /></g>'+
    		'<rect class="border-white"/>' +
    		'<rect class="border"/>' +
    		'<rect class="box"/>'+
    		'<text class="label"/>'+
    		'<text class="label2"></text>'+
    		'<rect class="input-port" />'+
    		'<rect class="error-port" />'+
    		'<rect class="output-port"/>'+
    		'<rect class="output-port-cover"/>'+
    		'<g transform="scale(0.4)">'+
    		'<path class="blockSolid" d="M 43 20 l 6 6 l 6 -6 l -6 -6 l -6 6"/>'+
    		'<path class="blockEmpty" d="M 86 20 l 6 6 l 6 -6 l -6 -6 l -6 6"/>'+
    		'<path class="arrowGray" d="M 0 20 h 33 l 0 -5 l 7 5 l -7 5 l 0 -5"/>'+
    		'<path class="arrowBlack" d="M 52 20 h 26 l 0 -5 l 7 5 l -7 5 l 0 -5"/>'+
    		'</g>'
    		,


	    defaults: joint.util.deepSupplement({

	        type: 'node',//joint.shapes.flo.NODE_TYPE,
	        position: {x: 0, y: 0},
	        size: { width: IMAGE_W, height: IMAGE_H },
	        attrs: {
	            '.': { magnet: false },
	            // rounded edges around image
	            '.border': {
	                width: IMAGE_W,
	                height: IMAGE_H,
	                rx: 3,
	                ry: 3,
	                'fill-opacity':0, // see through
	                stroke: '#eeeeee',
	                'stroke-width': 0
	            },
                '.arrowGray': {
                	'stroke':'#aaaaaa',
                    'stroke-width':'2',
                    'fill': '#aaaaaa'
                },
                '.arrowBlack': {
                	'stroke':'black',
                    'stroke-width':'2',
                    'fill': 'black'
                },
                '.blockSolid': {
                	'stroke':'#000000',
                    'stroke-width':'2',
                    'fill': 'black'
                },
                '.blockEmpty': {
                	'stroke':'#000000',
                    'stroke-width':'2',
                    'fill': 'white'
                },
	            '.box': {
	                width: IMAGE_W,
	                height: IMAGE_H,
	                rx: 3,
	                ry: 3,
	                //'fill-opacity':0, // see through
	                stroke: '#6db33f',
	                fill: '#eeeeee',
	                'stroke-width': 1
	            },
	            '.input-port': {
	            	type: 'input',
	            	height: 4, width: 4,
	            	magnet: true,
	            	fill: '#eeeeee',
	            	transform: 'translate(' + -2 + ',' + ((IMAGE_H/2)-2) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.output-port': {
	            	type: 'output',
	            	height: 4, width: 4,
	            	magnet: true,
	            	fill: '#eeeeee',
	            	transform: 'translate(' + (IMAGE_W-2) + ',' + ((IMAGE_H/2)-2) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.error-port': {
	            	type: 'output',
	            	height: 4, width: 4,
	            	magnet: true,
	            	fill: '#ff0000',
	            	transform: 'translate(' + (IMAGE_W/2-2) + ',' + ((IMAGE_H)-2) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.label': {
	                'text-anchor': 'middle',
	                'ref-x': 0.5, // jointjs specific: relative position to ref'd element
//	                 'ref-y': -12, // jointjs specific: relative position to ref'd element
	                'ref-y': 0.3,
	                ref: '.border', // jointjs specific: element for ref-x, ref-y
	                fill: 'black',
	                'font-size': 14
	            },
	            '.label2': {
	            	'text': '\u21d2',
	                'text-anchor': 'middle',
	                'ref-x': 0.15, // jointjs specific: relative position to ref'd element
	                'ref-y': 0.15, // jointjs specific: relative position to ref'd element
	                ref: '.border', // jointjs specific: element for ref-x, ref-y
	                transform: 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H/2) + ')',
	                fill: 'black',
	                'font-size': 24
	            },
	            '.shape': {
	            },
	            '.image': {
	                width: IMAGE_W,
	                height: IMAGE_H
	            }
	        }
	    }, joint.shapes.basic.Generic.prototype.defaults)
	});
	
	
	return ['$log', function($log) {

        function createHandle(kind) {
            return new joint.shapes.flo.ErrorDecoration({
                size: {width: 10, height: 10},
                attrs: {
                    'image': {
                        'xlink:href': HANDLE_ICON_MAP[kind]
                    }
                }
            });
        }

        function createDecoration(kind) {
            return new joint.shapes.flo.ErrorDecoration({
                size: {width: 16, height: 16},
                attrs: {
                    'image': {
                        'xlink:href': DECORATION_ICON_MAP[kind]
                    }
                }
            });
        }

        function createNode(metadata, props) {
        	if (metadata.name === 'channel' || metadata.name === 'publish-subscribe-channel') {
        		return new joint.shapes.si.Channel();
        	} else if (metadata.name === 'service-activator') {
        		return new joint.shapes.si.ServiceActivator();
        	} else {
        		return new joint.shapes.si.Node();        		
        	}
        }
        
        function initializeNewNode(node, context) {
        	var metadata = node.attr('metadata');
			if (metadata) {
	        	node.attr('.label/text', node.attr('metadata/name'));
				if (node.attr('metadata/constraints/maxIncomingLinksNumber') === 0) {
					node.attr('.input-port/display','none');
				}
				if (node.attr('metadata/constraints/maxOutgoingLinksNumber') === 0) {
					node.attr('.output-port/display','none');
				}

	            var type = node.attr('metadata/name');
	            if (type === 'tap') {
	                if (!node.attr('props/channel')) {
	                    node.attr('props/channel', 'tap:stream:STREAM');
	                }
	                refreshVisuals(node, 'props/channel', context.paper);
	            } else if (type === 'named-channel') {
	                // Default channel for named channel is 'queue:default'
	                if (!node.attr('props/channel')) {
	                    node.attr('props/channel', 'queue:default');
	                }
	                refreshVisuals(node, 'props/channel', context.paper);
	            }
			}
			node.attr('.label2/text','');

        }
        
        function validateNode(flo, node) {
        	return [];
        }
        
        function fitLabel(paper, node, labelPath) {
            var label = node.attr(labelPath);
            if (label && label.length<9) {
                return;
            }
            var view = paper.findViewByModel(node);
            if (view && label) {
                var textView = view.findBySelector(labelPath.substr(0, labelPath.indexOf('/')))[0];
                var offset = 0;
                if (node.attr('.label2/text')) {
                    var label2View = view.findBySelector('.label2')[0];
                    if (label2View) {
                        var box = joint.V(label2View).bbox(false, paper.viewport);
                        offset = HORIZONTAL_PADDING + box.width;
                    }
                }
                var width = joint.V(textView).bbox(false, paper.viewport).width;
                var threshold = IMAGE_W - HORIZONTAL_PADDING - HORIZONTAL_PADDING - offset;
                if (offset) {
                    node.attr('.label1/ref-x', Math.max((offset + HORIZONTAL_PADDING + width / 2) / IMAGE_W, 0.5), { silent: true });
                }
                // Trim package prefix
                
                if (!label.endsWith('?')) {
//                	console.log("modifying label "+label);
	                // Sample name: com.foo.method(a.b.c.Order)
	                var openParen = label.indexOf('(');
	                if (openParen !== -1) {
	                	label = label.substring(0,openParen);
	                }
	                width = joint.V(textView).bbox(false, paper.viewport).width;                	
	                if (width > threshold) {
		                var lastDot = label.lastIndexOf('.');
		                if (lastDot !== -1) {
		            		label = label.substring(lastDot+1);
		                }
	                	console.log('driving label change');
		                node.attr(labelPath, label, { silent: true });
		                view.update();
		                width = joint.V(textView).bbox(false, paper.viewport).width;                	
		                for (var i = 1; i < label.length && width > threshold; i++) {
		                    node.attr(labelPath, label.substr(0, label.length - i) + '\u2026', { silent: true });
		                    view.update();
		                    width = joint.V(textView).bbox(false, paper.viewport).width;
		                    if (offset) {
		                        node.attr('.label1/ref-x', Math.max((offset + HORIZONTAL_PADDING + width / 2) / IMAGE_W, 0.5), { silent: true });
		                    }
		                }
	                }
                }
//                view.update();
            }
        }

        function createLink() {
        	var link = new joint.shapes.flo.Link(joint.util.deepSupplement({
                router: { name: 'floforintegration', args: {elementPadding: 20/*, metro: true*/} },
                connector: { name: 'smooth' },
        		attrs: {
    	        	'.': { 
						//filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } } 
					},
    	        	'.connection': { 'stroke-width': 3, 'stroke': 'black', 'stroke-linecap': 'round' },
    	        	'.marker-arrowheads': { display: 'none' },
    	        	'.tool-options': { display: 'none' },
    	        	'stroke':'red' // TODO necessary?
    	        },
    	    }, joint.shapes.flo.Link.prototype.defaults));
            return link;
        }
        
        function isSemanticProperty(propertyPath) {
        	return propertyPath === '.label/text';
        }
        
        function refreshVisuals(element, changedPropertyPath, paper) {
            fitLabel(paper, element, '.label/text');
        }

        function layout(paper) {
        	var graph = paper.model;
			var i;
			var g = new dagre.graphlib.Graph();
			g.setGraph({});
			g.setDefaultEdgeLabel(function() {return{};});

			var nodes = graph.getElements();
			for (i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node.get('type') === joint.shapes.flo.NODE_TYPE) {
					g.setNode(node.id, node.get('size'));
				} 
			}
			
			var links = graph.getLinks();
			for (i = 0; i < links.length; i++) {
				var link = links[i];
				if (link.get('type') === joint.shapes.flo.LINK_TYPE) {
					var options = {
							minlen: 1.5
					};
//					if (link.get('labels') && link.get('labels').length > 0) {
//						options.minlen = 1 + link.get('labels').length * 0.5;
//					}
					g.setEdge(link.get('source').id, link.get('target').id, options);
					link.set('vertices', []);
				}
			}
			
			g.graph().rankdir = 'LR';
			dagre.layout(g);
			g.nodes().forEach(function(v) {
				var node = graph.getCell(v);
				if (node) {
					var bbox = node.getBBox();
					node.translate(g.node(v).x - bbox.x, g.node(v).y - bbox.y);
				}
			});
        }
        
        function getLinkAnchorPoint(linkView, view, magnet, reference) {
            if (magnet) {
                var cssClass = magnet.getAttribute('class');
                var bbox = joint.V(magnet).bbox(false, linkView.paper.viewport);
                var rect = joint.g.rect(bbox);
                if (cssClass.indexOf('input-port') !== -1) {
                    return joint.g.point(rect.x, rect.y + rect.height / 2);
                } else if (cssClass.indexOf('error-port') !== -1) {
                    return joint.g.point(rect.x + rect.width / 2, rect.y + rect.height);
                } else {
                    return joint.g.point(rect.x + rect.width, rect.y + rect.height / 2);
                }
            } else {
                $log.debug('No magnet!');
                return reference;
            }
        }

        return {
            'createHandle': createHandle,
            'createDecoration': createDecoration,
            'createNode': createNode,
            'createLink': createLink,
            'initializeNewNode': initializeNewNode,
            'isSemanticProperty': isSemanticProperty,
            'refreshVisuals': refreshVisuals,
            'layout': layout,
            'getLinkAnchorPoint': getLinkAnchorPoint
        };
	    
	}];

});
