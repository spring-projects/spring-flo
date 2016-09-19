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

define(function(require) {
	'use strict';

	var $ = require('jquery');
	var joint = require('joint');
	var shapesFactory = require('common/shapes-factory');
	var angular = require('angular');

	// TODO move this node into custom nodes and links to centralize
	if (!joint.shapes.flo) {
		joint.shapes.flo = {};
	}

	// http://stackoverflow.com/questions/23960312/can-i-add-new-attributes-in-jointjs-element
	joint.shapes.flo.PaletteGroupHeader = joint.shapes.basic.Generic.extend({
		// The path is the open/close arrow, defaults to vertical (open)
		markup: '<g class="scalable"><rect/></g><text/><g class="rotatable"><path d="m 10 10 l 5 8.7 l 5 -8.7 z"/></g>',
		defaults: joint.util.deepSupplement({
			type: 'palette.groupheader',
			size:{width:170,height:30},
			position:{x:0,y:0},
			attrs: {
				'rect': { fill: '#34302d', 'stroke-width': 1, stroke: '#6db33f', 'follow-scale':true, width:80, height:40 },
				'text': {
					text:'',
					fill: '#eeeeee',
					'ref-x': 0.5,
					'ref-y': 7,
					'x-alignment':'middle',
					'font-size': 18/*, 'font-weight': 'bold', 'font-variant': 'small-caps', 'text-transform': 'capitalize'*/
				},
				'path': { fill: 'white', 'stroke-width': 2, stroke: 'white'/*,transform:'rotate(90,15,15)'*/}
			},
			// custom properties
			isOpen:true
		}, joint.shapes.basic.Generic.prototype.defaults)
	});

	return ['$scope', '$timeout', '$log', '$injector', function($scope, $timeout, $log, $injector) {

		var domContext;

		var metamodelService;

		var renderService;

		var paletteGraph = new joint.dia.Graph();
		paletteGraph.attributes.type = joint.shapes.flo.PALETTE_TYPE;

		var palette;

		/**
		 * The names of any groups in the palette that have been deliberately closed (the arrow clicked on)
		 * @type {String[]}
		 */
		var closedGroups = [];

		/**
		 * Model of the clicked element
		 */
		var clickedElement;

		var viewBeingDragged = null;

		function trigger(triggerEvent,paramsObject) {
			if ($scope.paletteObservers) {
				$scope.paletteObservers.fireEvent(triggerEvent, paramsObject);
			}
		}

		function handleDrag(event) {
			// TODO offsetX/Y not on firefox
			//$log.debug("tracking move: x="+event.pageX+",y="+event.pageY);
			if (clickedElement && clickedElement.attr('metadata')) {
				if (!viewBeingDragged) {
					var dataOfClickedElement = clickedElement.attr('metadata');
					// custom div if not already built.
					$('<div>', {
						id: 'palette-floater'
					}).appendTo($('body'));
					var floatergraph = new joint.dia.Graph();
					floatergraph.attributes.type = joint.shapes.flo.FEEDBACK_TYPE;
					var floaterpaper = new joint.dia.Paper({
						el: $('#palette-floater'),
						gridSize:10,
						model: floatergraph,
						height: 400,
						width: 200,
						validateMagnet: function() {
							return false;
						},
						validateConnection: function() {
							return false;
						}
					});
					// TODO float thing needs to be bigger otherwise icon label is missing
					// Initiative drag and drop - create draggable element
					var floaternode = shapesFactory.createNode({
						'renderService': renderService,
						'paper': floaterpaper,
						'graph': floatergraph,
						'metadata': dataOfClickedElement
					});
					var box = floaterpaper.findViewByModel(floaternode).getBBox();
					var size = floaternode.get('size');
					// Account for node real size including ports
					floaternode.translate(box.width - size.width, box.height - size.height);
					viewBeingDragged = floaterpaper.findViewByModel(floaternode);
					$('#palette-floater').offset({left:event.pageX+5,top:event.pageY+5});
//					trigger('dragStarted',{'dragged':viewBeingDragged,'x':x,'y':y});
				} else {
					$('#palette-floater').offset({left:event.pageX+5,top:event.pageY+5});
					trigger('drag',{'dragged':viewBeingDragged,'evt':event});

				}
			}
		}

		// TODO lock to grid on drag? (if grid is on)

		function getPaletteView(view) {
			return view.extend({
				pointerdown: function(/*evt, x, y*/) {
					// Remove the tooltip
					$('.node-tooltip').remove();
					// TODO move metadata to the right place (not inside attrs I think)
					clickedElement = this.model;
					if (clickedElement.attr('metadata')) {
						$(document).on('mousemove', handleDrag);
					}
				},
				pointermove: function(/*evt, x, y*/) {
					// Nothing to prevent move within the palette canvas
				},
				events: {
					// Tooltips on the palette elements
					'mouseenter': function(evt) {

						// Ignore 'mouseenter' if any other buttons are pressed
						if (evt.buttons) {
							return;
						}

						var model = this.model;
						var metadata = model.attr('metadata');
						if (!metadata) {
							return;
						}

						this.showTooltip(evt.pageX, evt.pageY);
					},
					// TODO bug here - if the call to get the info takes a while, the tooltip may appear after the pointer has left the cell
					'mouseleave': function(/*evt, x,y*/) {
						this.hideTooltip();
					},
					'mousemove': function(evt) {
						this.moveTooltip(evt.pageX, evt.pageY);
					}
				},

				showTooltip: function(x, y) {
					var model = this.model;
					var metadata = model.attr('metadata');
					// TODO refactor to use tooltip module
					var nodeTooltip = document.createElement('div');
					$(nodeTooltip).addClass('node-tooltip');
					$(nodeTooltip).appendTo($('body')).fadeIn('fast');
					var nodeDescription = document.createElement('div');
					$(nodeTooltip).addClass('tooltip-description');
					$(nodeTooltip).append(nodeDescription);

					metadata.get('description').then(function(description) {
						$(nodeDescription).text(description ? description : model.attr('metadata/name'));
					}, function() {
						$(nodeDescription).text(model.attr('metadata/name'));
					});

					if (!metadata.metadata || !metadata.metadata['hide-tooltip-options']) {
						metadata.get('properties').then(function(metaProps) {
							if (metaProps) {
								Object.keys(metaProps).sort().forEach(function(propertyName) {
									var optionRow = document.createElement('div');
									var optionName = document.createElement('span');
									var optionDescription = document.createElement('span');
									$(optionName).addClass('node-tooltip-option-name');
									$(optionDescription).addClass('node-tooltip-option-description');
									$(optionName).text(metaProps[propertyName].name);
									$(optionDescription).text(metaProps[propertyName].description);
									$(optionRow).append(optionName);
									$(optionRow).append(optionDescription);
									$(nodeTooltip).append(optionRow);
								});
							}
						}, function(error) {
							if (error) {
								$log.error(error);
							}
						});
					}

					var mousex = x + 10;
					var mousey = y + 10;
					$('.node-tooltip').css({ top: mousey, left: mousex });
				},

				hideTooltip: function() {
					$('.node-tooltip').remove();
				},

				moveTooltip: function(x, y) {
					var mousex = x + 10; // Get X coordinates
					var mousey = y + 10; // Get Y coordinates
					$('.node-tooltip').css({ top: mousey, left: mousex });
				}

			});
		}

		function createPaletteGroup(title, isOpen) {
			var newGroupHeader = new joint.shapes.flo.PaletteGroupHeader({attrs:{text:{text:title}}});
			newGroupHeader.set('header',title);
			if (!isOpen) {
				newGroupHeader.attr({'path':{'transform':'rotate(-90,15,13)'}});
				newGroupHeader.set('isOpen',false);
			}
			paletteGraph.addCell(newGroupHeader);
			return newGroupHeader;
		}

		function createPaletteEntry(title, metadata) {
			return shapesFactory.createNode({
				'renderService': renderService,
				'paper': palette,
				'metadata': metadata
			});
		}

		function buildPalette(metamodel) {
			var startTime = new Date().getTime();
			paletteGraph.clear();

			var filterText = $scope.filterText;
			if (filterText) {
				filterText = filterText.toLowerCase();
			}

			var paletteNodes = [];
			var groupAdded = {};

			var parentWidth = $(domContext.parentNode).width();

			// The field closedGroups tells us which should not be shown
			// Work out the list of active groups/nodes based on the filter text
			Object.keys(metamodel).sort(function(g1, g2) {
				var order = ['source', 'processor', 'sink', 'other', 'job'];
				var idx1 = order.indexOf(g1);
				var idx2 = order.indexOf(g2);
				if (idx1 === -1) {
					if (idx2 === -1) {
						return g1.localeCompare(g2);
					} else {
						return 1;
					}
				} else {
					if (idx2 === -1) {
						return -1;
					} else {
						return idx1 - idx2;
					}
				}
			}).forEach(function(group) {
				Object.keys(metamodel[group]).sort().forEach(function(name) {
					var node = metamodel[group][name];
					var nodeActive = !node.noPaletteEntry;
					if (nodeActive && filterText) {
						nodeActive = false;
						if (name.toLowerCase().indexOf(filterText) !== -1) {
							nodeActive = true;
						}
						else if (group.toLowerCase().indexOf(filterText) !== -1) {
							nodeActive = true;
						}
						else if (node.description && node.description.toLowerCase().indexOf(filterText) !== -1) {
							nodeActive = true;
						}
						else if (node.properties) {
							Object.keys(node.properties).sort().forEach(function(propertyName) {
								if (propertyName.toLowerCase().indexOf(filterText) !== -1 ||
									(node.properties[propertyName].description &&
									node.properties[propertyName].description.toLowerCase().indexOf(filterText) !== -1)) {
									nodeActive=true;
								}
							});
						}
					}
					if (nodeActive) {
						if (!groupAdded[group]) {
							var header = createPaletteGroup(group, !_.contains(closedGroups,group));
							header.set('size', {width: parentWidth, height: 30});
							paletteNodes.push(header);
							groupAdded[group] = true;
						}
						if (!_.contains(closedGroups,group)) {
							paletteNodes.push(createPaletteEntry(name, node));
						}
					}
				});
			});

			var cellWidth = 0, cellHeight = 0;
			// Determine the size of the palette entry cell (width and height)
			paletteNodes.forEach(function(pnode) {
				if (pnode.attr('metadata/name')) {
					var dimension = {
						width: pnode.get('size').width,
						height: pnode.get('size').height
					};
					if (cellWidth < dimension.width) {
						cellWidth = dimension.width;
					}
					if (cellHeight < dimension.height) {
						cellHeight = dimension.height;
					}
				}
			});

			// Adjust the palette entry cell size with paddings.
			cellWidth += 2 * $scope.flo.paletteEntryPadding.x;
			cellHeight += 2 * $scope.flo.paletteEntryPadding.y;

			// Align palette entries row to be at the center
			var startX = parentWidth >= cellWidth ? (parentWidth - Math.floor(parentWidth / cellWidth) * cellWidth) / 2 : 0;
			var xpos = startX;
			var ypos= 0;
			var prevNode;

			// Layout palette entry nodes
			paletteNodes.forEach(function(pnode) {
				var dimension = {
					width: pnode.get('size').width,
					height: pnode.get('size').height
				};
				if (pnode.get('header')) { //attributes.attrs.header) {
					// Palette entry header
					xpos = startX;
					pnode.set('position',{x:0, y:ypos});
					ypos += dimension.height + 5;
				} else {
					// Palette entry element
					if (xpos + cellWidth > parentWidth) {
						// Not enough real estate to place entry in a row - reset x position and leave the y pos which is next line
						xpos = startX;
						pnode.set('position', { x: xpos + (cellWidth - dimension.width) / 2, y: ypos + (cellHeight - dimension.height) / 2});
					} else {
						// Enough real estate to place entry in a row - adjust y position
						if (prevNode.attr('metadata/name')) {
							ypos -= cellHeight;
						}
						pnode.set('position', { x: xpos + (cellWidth - dimension.width) / 2, y: ypos + (cellHeight - dimension.height) / 2});
					}
					// increment x position and y position (can be reorganized)
					xpos += cellWidth;
					ypos += cellHeight;
				}
				prevNode = pnode;
			});
			palette.setDimensions(parentWidth, ypos);
			$log.info('buildPalette took '+(new Date().getTime()-startTime)+'ms');
		}

		var _metamodelListener = {
			metadataError: function(data/*, status, headers, config*/) {
				$log.error(JSON.stringify(data));
			},
			metadataRefresh: function() {

			},
			metadataChanged: function(data) {
				buildPalette(data.newData);
			}
		};

		// TODO handle case of clicking header whilst already rotating

		/*
		 * Modify the rotation of the arrow in the header from horizontal(closed) to vertical(open)
		 */
		function rotateOpen(element) {
			var angle = 90;
			var rotateIt = function() {
				angle = angle - 10;
				element.attr({'path':{'transform':'rotate(-'+angle+',15,13)'}});
				if (angle <= 0) {
					element.set('isOpen',true);
					closedGroups = _.without(closedGroups,element.get('header'));
					metamodelService.load().then(buildPalette);
					return;
				} else {
					$timeout(rotateIt,10);
				}
			};
			$timeout(rotateIt);
		}

		// TODO better name for this function as this does the animation *and* updates the palette

		/*
		 * Modify the rotation of the arrow in the header from vertical(open) to horizontal(closed)
		 */
		function rotateClosed(element) {
			var angle = 0;
			var rotateIt = function() {
				angle = angle + 10;
				element.attr({'path':{'transform':'rotate(-'+angle+',15,13)'}});
				if (angle >= 90) {
					element.set('isOpen',false);
					closedGroups.push(element.get('header'));
					metamodelService.load().then(buildPalette);
					return;
				} else {
					$timeout(rotateIt,10);
				}
			};
			$timeout(rotateIt);
		}

		function handleMouseUp(/*event*/) {
			$(document).off('mousemove', handleDrag);
		}

		function dispose() {
			if (metamodelService && angular.isFunction(metamodelService.unsubscribe)) {
				metamodelService.unsubscribe(_metamodelListener);
			}
			$(document).off('mouseup', handleMouseUp);
		}

		function filterTextUpdated() {
			metamodelService.load().then(buildPalette);
		}

		function init(element/*, attrs*/) {

			domContext = element;

			metamodelService = $injector.get($scope.metamodelServiceName);

			if ($scope.renderServiceName) {
				renderService = $injector.get($scope.renderServiceName);
			}

			// Create the paper for the palette using the specified element view
			palette = new joint.dia.Paper({
				el: $('#palette-paper', domContext),
				gridSize:1,
				model:paletteGraph,
				height: $(domContext.parentNode).height(),
				width: $(domContext.parentNode).width(),
				elementView: getPaletteView(renderService && angular.isFunction(renderService.getNodeView) ? renderService.getNodeView() : joint.dia.ElementView)
			});

			palette.on('cell:pointerup',
				function(cellview, evt) {
					$log.debug('pointerup');
					if (viewBeingDragged) {
						trigger('drop',{'dragged':viewBeingDragged,'evt':evt});
						viewBeingDragged = null;
					}
					clickedElement = null;
					$('#palette-floater').remove();
				});

			// Toggle the header open/closed on a click
			palette.on('cell:pointerclick',
				function(cellview/*,evt*/) {
					// TODO [design][palette] should the user need to click on the arrow rather than anywhere on the header?
					// Click position within the element would be: evt.offsetX, evt.offsetY
					var element = cellview.model;
					if (cellview.model.attributes.header) {
						// Toggle the header open/closed
						if (element.get('isOpen')) {
							rotateClosed(element);
						} else {
							rotateOpen(element);
						}
					}
					// TODO [palette] ensure other mouse handling events do nothing for headers
					// TODO [palette] move 'metadata' field to the right place (not inside attrs I think)
				});

			$(document).on('mouseup', handleMouseUp);

			if (metamodelService) {
				metamodelService.load().then(function(data) {
					buildPalette(data);
					if (metamodelService && angular.isFunction(metamodelService.subscribe)) {
						metamodelService.subscribe(_metamodelListener);
					}
				});
			} else {
				$log.error('No Metamodel service specified for palette!');
			}

			if ($scope.flo) {
				$scope.flo.paletteSize = $scope.flo.paletteSize || $(domContext.parentNode).width();
			}

		}

		$scope.$on('$destroy', dispose);

		$scope.init = init;

		$scope.filterTextUpdated = filterTextUpdated;

		if ($scope.flo) {
			$scope.flo._paletteGraph = function() {
				return paletteGraph;
			};
			$scope.flo.paletteEntryPadding = $scope.flo.paletteEntryPadding || {x:12, y:12};
		}

		$scope.$watch(function() {
			return $scope.flo.paletteSize;
		}, function(newValue, oldValue) {
			if (oldValue !== newValue) {
				metamodelService.load().then(buildPalette);
			}
		});

	}];

});
