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
 * Define the custom nodes and links that will be used in our graphs and
 * functions to create them.
 */
define(['joint', 'underscore'],function(joint, _) {
	'use strict';

	var isChrome = !!window.chrome;
	var isFF = typeof InstallTrigger !== 'undefined';
	
	var IMAGE_W = 120,
		IMAGE_H = 35;
	
	var ERROR_MARKER_SIZE = {width: 16, height: 16};
	
	var HANDLE_SIZE = {width: 10, height: 10};
	
    joint.shapes.flo = {};

    joint.shapes.flo.NODE_TYPE = 'sinspctr.IntNode';
    joint.shapes.flo.LINK_TYPE = 'sinspctr.Link';
    joint.shapes.flo.DECORATION_TYPE = 'decoration';
    joint.shapes.flo.HANDLE_TYPE = 'handle';
    
    joint.shapes.flo.CANVAS_TYPE = 'canvas';
    joint.shapes.flo.PALETTE_TYPE = 'palette';
    joint.shapes.flo.FEEDBACK_TYPE = 'feedback';
    
    var HANDLE_ICON_MAP = {
    	'remove': 'icons/delete.svg'
    };
    
    var DECORATION_ICON_MAP = {
    	'error': 'icons/error.svg'
    };
	
	joint.util.filter.redscale = function(args) {

        var amount = _.isFinite(args.amount) ? args.amount : 1;
        
        return _.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 ${d} ${e} ${f} ${g} 0 0 ${h} ${i} ${k} 0 0 0 0 0 1 0"/></filter>', {
            a: 1 - 0.96 * amount,
            b: 0.95 * amount,
            c: 0.01 * amount,
            d: 0.3 * amount,
            e: 0.2 * amount,
            f: 1 - 0.9 * amount,
            g: 0.7 * amount,
            h: 0.05 * amount,
            i: 0.05 * amount,
            k: 1 - 0.1 * amount
        });
    };

	joint.util.filter.orangescale = function(args) {

        var amount = _.isFinite(args.amount) ? args.amount : 1;
        
        return _.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 ${d} ${e} ${f} ${g} 0 ${h} ${i} ${k} ${l} 0 0 0 0 0 1 0"/></filter>', {
            a: 1.0 + 0.5 * amount,
            b: 1.4 * amount,
            c: 0.2 * amount,
            d: 0.3 * amount,
            e: 0.3 * amount,
            f: 1 + 0.05 * amount,
            g: 0.2 * amount,
            h: 0.15 * amount,
            i: 0.3 * amount,
            k: 0.3 * amount,
            l: 1 - 0.6 * amount
        });
    };

	joint.shapes.flo.Node = joint.shapes.basic.Generic.extend({
		markup: 
	    		'<g class="shape"><image class="image" /></g>'+
	    		'<rect class="border-white"/>' +
	    		'<rect class="border"/>' +
	    		'<rect class="box"/>'+
	    		'<text class="label"/>'+
	    		'<text class="label2"></text>'+
	    		'<rect class="input-port" />'+
	    		'<rect class="output-port"/>'+
	    		'<rect class="output-port-cover"/>',

	    defaults: joint.util.deepSupplement({

	        type: joint.shapes.flo.NODE_TYPE,
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
	            	height: 8, width: 8,
	            	magnet: true,
	            	fill: '#eeeeee',
	            	transform: 'translate(' + -4 + ',' + ((IMAGE_H/2)-4) + ')',
	            	stroke: '#34302d',
	            	'stroke-width': 1
	            },
	            '.output-port': {
	            	type: 'output',
	            	height: 8, width: 8,
	            	magnet: true,
	            	fill: '#eeeeee',
	            	transform: 'translate(' + (IMAGE_W-4) + ',' + ((IMAGE_H/2)-4) + ')',
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
	

	joint.shapes.flo.Link = joint.dia.Link.extend({
	    defaults: joint.util.deepSupplement({
	    	type: joint.shapes.flo.LINK_TYPE,
	        attrs: {
	            '.connection': { stroke: '#34302d', 'stroke-width': 2 },
                // Lots of alternatives that have been played with:
//	            '.smoooth': true
//	            '.marker-source': { stroke: '#9B59B6', fill: '#9B59B6', d: 'M24.316,5.318,9.833,13.682,9.833,5.5,5.5,5.5,5.5,25.5,9.833,25.5,9.833,17.318,24.316,25.682z' },
//	            '.marker-target': { stroke: '#F39C12', fill: '#F39C12', d: 'M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z' },
//	        	'.connection': { 'stroke':'black'},
//	        	'.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } } },
//	        	'.connection': { 'stroke-width': 10, 'stroke-linecap': 'round' },
	        	// This means: moveto 10 0, lineto 0 5, lineto, 10 10 closepath(z)
//	        	'.marker-target': { d: 'M 5 0 L 0 7 L 5 14 z', stroke: '#34302d','stroke-width' : 1},
//	        	'.marker-target': { d: 'M 14 2 L 9,2 L9,0 L 0,7 L 9,14 L 9,12 L 14,12 z', 'stroke-width' : 1, fill: '#34302d', stroke: '#34302d'},
//	        	'.marker-source': {d: 'M 5 0 L 5,10 L 0,10 L 0,0 z', 'stroke-width' : 0, fill: '#34302d', stroke: '#34302d'},
//	            '.marker-target': { stroke: '#E74C3C', fill: '#E74C3C', d: 'M 10 0 L 0 5 L 10 10 z' },
	        	'.marker-arrowheads': { display: 'none' },
	        	'.tool-options': { display: 'none' }
	        },
//	    	connector: { name: 'normalDimFix' }
	    }, joint.dia.Link.prototype.defaults)
	});
	
	joint.shapes.flo.ErrorDecoration = joint.shapes.basic.Generic.extend({

	    markup: '<g class="rotatable"><g class="scalable"><image/></g></g>',

	    defaults: joint.util.deepSupplement({

	        type: joint.shapes.flo.DECORATION_TYPE,
	        size: ERROR_MARKER_SIZE,
	        attrs: {
	            'image': ERROR_MARKER_SIZE
	        }

	    }, joint.shapes.basic.Generic.prototype.defaults)
	});

	function createCustomElement(renderFn, paper, metadata, props, position) {
		var node;
		var graph = paper.model;
		if (!position) {
			position = {x: 0, y: 0};
		}
		node = new joint.shapes.flo.GenericElement({
			position: position,
	        renderFunction: renderFn,
			attrs: {
				'props': props,
				'metadata': metadata
			}
		});
		if (graph) {
			graph.addCell(node);
		}
		return node;
	}
	
	/**
	 * Create a JointJS node that embeds extra metadata (properties).
	 */
	function createNode(params) {
		params = params || {};
		var renderService = params.renderService;
		var paper = params.paper;
		var metadata = params.metadata;
		var position = params.position;
		var props = params.props;
		var graph = params.graph || (params.paper ? params.paper.model : undefined);
		
		var node;
		if (!props) {
			props = {};
		}
		if (!position) {
			position = {x: 0, y: 0};
		}
		if (renderService && _.isFunction(renderService.createNode)) {
			node = renderService.createNode(metadata, props);
		} else {
			node = new joint.shapes.flo.Node();
			node.attr('.label/text', metadata.name);
		}
		node.set('type', joint.shapes.flo.NODE_TYPE);
		node.set('position', position);
		node.attr('props', props);
		node.attr('metadata', metadata);
		if (graph) {
			graph.addCell(node);
		}		
		if (renderService && _.isFunction(renderService.initializeNewNode)) {
			renderService.initializeNewNode(node, {
				'paper': paper,
				'graph': graph
			});
		}
		return node;
	}

	function createLink(params) {
		params = params || {};
		var renderService = params.renderService;
		var paper = params.paper;
		var metadata = params.metadata;
		var source = params.source;
		var target = params.target;
		var props = params.props;
		var graph = params.graph || (params.paper ? params.paper.model : undefined);
		
		var link;
		if (!props) {
			props = {};
		}
		if (renderService && _.isFunction(renderService.createLink)) {
			link = renderService.createLink(source, target, metadata, props);
		} else {
			link = new joint.shapes.flo.Link();
		}
		link.set('source', source);
		link.set('target', target);
		link.set('type', joint.shapes.flo.LINK_TYPE);
		if (metadata) {
			link.attr('metadata', metadata);
		}
		link.attr('props', props);
		if (graph) {
			graph.addCell(link);
		}
		if (renderService && _.isFunction(renderService.initializeNewLink)) {
			renderService.initializeNewLink(link, {
				'paper': paper,
				'graph': graph
			});
		}
		// prevent creation of link breaks
		link.attr('.marker-vertices/display', 'none');
		return link;
	}
	
	function createDecoration(params) {
		params = params || {};
		var renderService = params.renderService;
		var paper = params.paper;
		var parent = params.parent;
		var kind = params.kind;
		var messages = params.messages;
		var location = params.position;
		var graph = params.graph || (params.paper ? params.paper.model : undefined);
		
		if (!location) {
			location = {x: 0, y: 0};
		}
		var decoration;
		if (renderService && _.isFunction(renderService.createDecoration)) {
			decoration = renderService.createDecoration(kind, parent);
		} else {
			decoration = new joint.shapes.flo.ErrorDecoration({
			    attrs: { 
			        image: { 'xlink:href': DECORATION_ICON_MAP[kind] },
			    }
			}); 
		}
		decoration.set('type', joint.shapes.flo.DECORATION_TYPE);
		decoration.set('position', location);
		if ((isChrome || isFF) && parent && typeof parent.get('z') === 'number') {
			decoration.set('z', parent.get('z') + 1);
		}
		decoration.attr('./kind', kind);
		decoration.attr('messages', messages);
		if (graph) {
			graph.addCell(decoration);
		}
		parent.embed(decoration);
		if (renderService && _.isFunction(renderService.initializeNewDecoration)) {
			renderService.initializeNewDecoration(decoration, {
				'paper': paper,
				'graph': graph
			});
		}
		return decoration;
	}
	
	function createHandle(params) {
		params = params || {};
		var renderService = params.renderService;
		var paper = params.paper;
		var parent = params.parent;
		var kind = params.kind;
		var location = params.position;
		var graph = params.graph || (params.paper ? params.paper.model : undefined);

		var handle;
		if (!location) {
			location = {x: 0, y: 0};
		}
		if (renderService && _.isFunction(renderService.createHandle)) {
			handle = renderService.createHandle(kind, parent);
		} else {
			handle = new joint.shapes.flo.ErrorDecoration({
		        size: HANDLE_SIZE,
			    attrs: {
			        'image': { 
			        	'xlink:href': HANDLE_ICON_MAP[kind]
			        }
			    }
			});
		}
		handle.set('type', joint.shapes.flo.HANDLE_TYPE);
		handle.set('position', location);
		if ((isChrome || isFF) && parent && typeof parent.get('z') === 'number') {
			handle.set('z', parent.get('z') + 1);
		}
		handle.attr('./kind', kind);
		if (graph) {
			graph.addCell(handle);
		}
		parent.embed(handle);
		if (renderService && _.isFunction(renderService.initializeNewHandle)) {
			renderService.initializeNewHandle(handle, {
				'paper': paper,
				'graph': graph
			});
		}
		return handle;
	}

	joint.shapes.flo.GenericElement = joint.shapes.basic.Generic.extend({
	    defaults: joint.util.deepSupplement({
	        type: 'flo.GenericElement',
	        size: { width: IMAGE_W, height: IMAGE_H },
	        renderFunction: joint.dia.ElementView.prototype.renderMarkup,
	    }, joint.shapes.basic.Generic.prototype.defaults)
	});
    
	joint.shapes.flo.GenericElementView = joint.dia.ElementView.extend({
	    renderMarkup: function() {        
	    	var renderFn = this.model.get('renderFunction');
	    	if (_.isFunction(renderFn)) {
	    		renderFn.call(this.model, this.el);
	    	} 
	    }
	});

	/*
	 * Gradient can only be applied to elements with non-0 size. Horizontal and vertical lines don't have any size.
	 * Therefore, add a tiny value to target point x and y to ensure line is not completely vertical/horizontal
	 */
	joint.connectors.normalDimFix = function(sourcePoint, targetPoint, vertices) {
		var dimensionFix = 1e-3;
		var d = ['M', sourcePoint.x, sourcePoint.y];
		_.each(vertices, function(vertex) { d.push(vertex.x, vertex.y); });
		d.push(targetPoint.x + dimensionFix, targetPoint.y + dimensionFix);
		return d.join(' ');
	};

	joint.shapes.flo.PatternLinkView = joint.dia.LinkView.extend({
		patternMarkup: '<pattern id="pattern-<%= id %>" patternUnits="userSpaceOnUse"></pattern>',
		initialize: function() {
			joint.dia.LinkView.prototype.initialize.apply(this, arguments);
			_.bindAll(this, 'fillWithPattern');
		},
		render: function() {
			joint.dia.LinkView.prototype.render.apply(this, arguments);

			// make sure that pattern doesn't already exist
			if (!this.pattern) {
				this.pattern = joint.V(_.template(this.patternMarkup, { id: this.id }));
				joint.V(this.paper.svg).defs().append(this.pattern);
			}

			// tell the '.connection' path to use the pattern
			var connection = joint.V(this.el).findOne('.connection').attr({
				stroke: 'url(#pattern-' + this.id + ')'
			});

			// cache the stroke width
			this.strokeWidth = connection.attr('stroke-width') || 1;

			return this;
		},

		remove: function() {
			// make sure we stop an ongoing pattern update
			joint.util.cancelFrame(this.frameId);
			joint.dia.LinkView.prototype.remove.apply(this, arguments);
			this.pattern.remove();
		},

		update: function() {
			joint.dia.LinkView.prototype.update.apply(this, arguments);
			joint.util.cancelFrame(this.frameId);
			this.frameId = joint.util.nextFrame(this.fillWithPattern);
			return this;
		},

		fillWithPattern: function() {
			var strokeWidth = this.strokeWidth;
			// we get the bounding box of the linkView without the transformations
			// and expand it to all 4 sides by the stroke width
			// (making sure there is always enough room for drawing,
			// even if the bounding box was tiny.
			// Note that the bounding box doesn't include the stroke.)
			var bbox = joint.g.rect(joint.V(this.el).bbox(true)).moveAndExpand({
				x: - strokeWidth,
				y: - strokeWidth,
				width: 2 * strokeWidth,
				height: 2 * strokeWidth
			});

			// create an array of all points the link goes through
			// (route doesn't contain the connection points)
			var points = [].concat(this.sourcePoint, this.route, this.targetPoint);

			// transform all points to the links coordinate system
			points = _.map(points, function(point) {
				return joint.g.point(point.x - bbox.x, point.y - bbox.y);
			});

			// iterate over the points and execute the drawing function
			// for each segment
			var elements = [];
			for (var i=0, pointsCount = points.length - 1; i < pointsCount; i++) {
				this.drawPattern.call(this, points[i], points[i+1], strokeWidth, i, elements);
			}

			// Remove previous pattern if there is one
			while (this.pattern.node.firstChild) {
				this.pattern.node.removeChild(this.pattern.node.firstChild);
			}

			// update the pattern dimensions and SVG contents
			this.pattern.attr(bbox);
			this.pattern.append(elements);
		},

		// finds a gradient with perpendicular direction to a link segment
		gradientPoints: function(from, to, width) {

			var angle = joint.g.toRad(from.theta(to) - 90);
			var center = joint.g.line(from, to).midpoint();
			var start = joint.g.point.fromPolar(width / 2, angle, center);
			var end = joint.g.point.fromPolar(width / 2, Math.PI + angle, center);
			return [start.x, start.y, end.x, end.y];
		},

		// A drawing function executed for all links segments.
		drawPattern: function(from, to, width, i, elements) {
			var outlineWidth = 2;
			var innerWidth = width - outlineWidth;
			var outerWidth = width;
			var buttFrom = joint.g.point(from).move(to, -0.001);
			var buttTo = joint.g.point(to).move(from, -0.001);
			var nsSVG = 'http://www.w3.org/2000/svg';
			var gradientPoints = this.gradientPoints(from, to, width);

			// Black background to paint the black outer border
			var background = document.createElementNS(nsSVG, 'path');
			background.setAttribute('stroke-width', outerWidth);
			background.setAttribute('stroke', 'rgba(52, 48, 45, 1.0)');
			background.setAttribute('d', ['M', from.x, from.y, to.x, to.y].join(' '));
			elements.push(joint.V(background));

			// Construct gradient element for the pipe's inner contents
			var gradient = document.createElementNS(nsSVG, 'linearGradient');
			var gradientId = 'pattern-' + this.id + '-' + i;
			gradient.setAttribute('id', gradientId);
			gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
			gradient.setAttribute('x1', gradientPoints[0]);
			gradient.setAttribute('y1', gradientPoints[1]);
			gradient.setAttribute('x2', gradientPoints[2]);
			gradient.setAttribute('y2', gradientPoints[3]);
			var stop1 = document.createElementNS(nsSVG, 'stop');
			stop1.setAttribute('offset', '0%');
			stop1.setAttribute('style', 'stop-color:rgba(52, 48, 45, 1.0)');
			gradient.appendChild(stop1);
			var stop2 = document.createElementNS(nsSVG, 'stop');
			stop2.setAttribute('offset', '50%');
			stop2.setAttribute('style', 'stop-color:white');
			gradient.appendChild(stop2);
			var stop3 = document.createElementNS(nsSVG, 'stop');
			stop3.setAttribute('offset', '100%');
			stop3.setAttribute('style', 'stop-color:rgba(52, 48, 45, 1.0)');
			gradient.appendChild(stop3);
			elements.push(joint.V(gradient));

			// Inner contents of the pipe: path filled with gradient
			var interior = document.createElementNS(nsSVG, 'path');
			interior.setAttribute('stroke-width', innerWidth);
			interior.setAttribute('stroke', 'url(#' + gradientId +')');
			interior.setAttribute('d', joint.connectors.normalDimFix(from, to));
			elements.push(joint.V(interior));

			// Rectangle at the start of the pipe
			var sourceEnd = document.createElementNS(nsSVG, 'path');
			sourceEnd.setAttribute('stroke-linecap', 'round');
			sourceEnd.setAttribute('stroke-width', outerWidth);
			sourceEnd.setAttribute('stroke', 'rgba(52, 48, 45, 1.0)');
			sourceEnd.setAttribute('d', ['M', from.x, from.y, buttFrom.x, buttFrom.y].join(' '));
			elements.push(joint.V(sourceEnd));

			// Rectangle at the end of the pipe
			var targetEnd = document.createElementNS(nsSVG, 'path');
			targetEnd.setAttribute('stroke-linecap', 'round');
			targetEnd.setAttribute('stroke-width', outerWidth);
			targetEnd.setAttribute('stroke', 'rgba(52, 48, 45, 1.0)');
			targetEnd.setAttribute('d', ['M', to.x, to.y, buttTo.x, buttTo.y].join(' '));
			elements.push(joint.V(targetEnd));

			// Arrow in the middle of the pipe
			var mid = joint.g.line(from,to).midpoint();
			var arrowStart = joint.g.point(mid).move(from, -15);
			var arrowEnd = joint.g.point(mid).move(to, -15);
			var arrow = document.createElementNS(nsSVG, 'path');
			var edgePoints = this.gradientPoints(from, to, innerWidth - 2);
			arrow.setAttribute('stroke-width', 1);
			arrow.setAttribute('stroke-linejoin', 'miter');
			arrow.setAttribute('stroke', 'black');
			arrow.setAttribute('fill', 'black');
			arrow.setAttribute('d', ['M', arrowStart.x, arrowStart.y, mid.x, mid.y, edgePoints[0], edgePoints[1], arrowEnd.x, arrowEnd.y, edgePoints[2], edgePoints[3], mid.x, mid.y].join(' '));
			elements.push(joint.V(arrow));

		}
	});

	return {
		'createNode': createNode,
		'createLink': createLink,
		'createDecoration': createDecoration,
		'createHandle': createHandle,
		'createCustomElement' : createCustomElement
	};
});
