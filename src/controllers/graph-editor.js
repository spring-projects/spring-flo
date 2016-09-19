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
 * Angular controller for Flo-Editor directive. Manages interactions with the canvas. Defines 'flo' object on the scope
 * that contains graph, DSL model and has a mechanism to sync them. 'Flo' object contains functions for interacting
 * with graph model, DSL model, standard editor actions (grid, zoom, etc.), react to drop events from the palette
 *
 * Note: controller contains some DOM manipulation logic that will be moved to the corresponding directive link function
 */
define(function(require) {
	'use strict';
	
	var isChrome = !!window.chrome;
	var isFF = typeof InstallTrigger !== 'undefined';

	var angular = require('angular');
	var joint = require('joint');
	var shapesFactory = require('common/shapes-factory');
	var createProperties = require('common/properties-manager');
	var createEventManager = require('common/event-manager');
	
	return ['$q', '$scope', '$timeout', '$http', '$log', '$injector', function($q, $scope, $timeout, $http, $log, $injector) {
	
	/**
	 * Metamodel service. Retrieves metadata about elements that can be shown in Flo
	 */
	var metamodelService;
	
	/**
	 * Service for rendering elements.
	 */
	var renderService;
	
	/**
	 * Editor service. Provides domain specific editing capabilities on top os standard Flo features
	 */
	var editorService;
	
	/**
	 * Joint JS Graph object representing the Graph model 
	 */
	var graph;
	
	/**
	 * Joint JS Paper object representing the canvas control containing the graph view
	 */
	var paper;
	
	/**
	 * DOM element for Flo-Editor. Use jQuery selector relative to this DOM Node
	 */
	var domContext;
	
	/**
	 * Properties View
	 */
	var propsMgr;
	
	/**
	 * Selection
	 */
	var selection = null;
	
	/**
	 * Timer promise to sync text representation to graph representation
	 */
	var synctimer;
	
	/**
	 * Nodes to validate
	 */
	var invalidNodes = {};
	
	/**
	 * Timed promise for asynchronously scheduled validation
	 */
	var validationTimer;
		
	/**
	 * Timer promise to sync graph representation with textual representation
	 */
	var graphUpdateTimer;
	
	/**
	 * Events map for event triggering mechanism
	 */
	var events = {};

	/**
	 * View to highlight when something is dragged over it
	 */
	var highlighted;

	/**
	 * Min zoom percent value
 	 */
	var minZoom;

	/**
	 * Max zoom percent value
	 */
	var maxZoom;

	/**
	 * Zoom percent increment/decrement step
 	 */
	var zoomStep;

	/**
	 * Flag specifying whether the Flo-Editor is in read-only mode.
	 */
	var _readOnlyCanvas;
	
	/**
	 * Grid size
	 */
	var _gridSize = 1;

	if (!$scope.flo) {
		$scope.flo = {};
	}
	
	if (!$scope.definition) {
		$scope.definition = {};
	}
          
	function createHandle(element, kind, action, location) {
		if (!location) {
			var bbox = element.getBBox();
			location = bbox.origin().offset(bbox.width / 2, bbox.height / 2);
		}
		var handle = shapesFactory.createHandle({
			'renderService': renderService,
			'paper': paper,
			'parent': element,
			'kind': kind,
			'position': location
		});
		var view = paper.findViewByModel(handle);
		view.on('cell:pointerdown', function() {
			if (action && action.call) {
				action();
			}
		});
		view.on('cell:mouseover', function() {
			handle.attr('image/filter', {
		        		name: 'dropShadow',
		        		args: { dx: 1, dy: 1, blur: 1, color: 'black' }
		    });
		});
		view.on('cell:mouseout', function() {
			handle.removeAttr('image/filter');			
		});
		view.options.interactive = false;
		return handle;
	}
    
	function removeEmbeddedChildrenOfType(element, type) {
		var embeds = element.getEmbeddedCells();
		for (var i = 0; i < embeds.length; i++) {
			if (Array.isArray(type) && type.indexOf(embeds[i].get('type')) >= 0 || 
				type && type === embeds[i].get('type') || 
				!type) 
			{
				embeds[i].remove();
			}
		}
	}
	
	function setSelection(newSelection) {
		if (newSelection && (newSelection.model.get('type') === joint.shapes.flo.DECORATION_TYPE || newSelection.model.get('type') === joint.shapes.flo.HANDLE_TYPE)) {
			newSelection = paper.findViewByModel(graph.getCell(newSelection.model.get('parent')));
		}
		if (newSelection && !newSelection.model.attr('metadata')) {
			newSelection = null;
		}
		if (newSelection === selection || (!newSelection && !selection)) {
			if (selection && propsMgr) {
				propsMgr.togglePropertiesView(selection);
			}
		}
		else {
			if (selection) {
		        var elementview = paper.findViewByModel(selection.model);
		        if (elementview) { // May have been removed from the graph
					removeEmbeddedChildrenOfType(elementview.model, joint.shapes.flo.HANDLE_TYPE);
					elementview.unhighlight();
		        }
			}
			if (newSelection) {
				newSelection.highlight();
				if (editorService && angular.isFunction(editorService.createHandles)) {
					editorService.createHandles($scope.flo, createHandle, newSelection.model);
				}
			}
	        selection = newSelection;
	        $('#properties', domContext).css('display','block');
	        if (propsMgr) {
		        propsMgr.updatePropertiesView(newSelection);
	        }
		}
	}

	function readOnlyCanvas(value) {
		if (value !== undefined && value !== null && _readOnlyCanvas !== value) {
			if (value) {
				setSelection();
			}
			if (graph) {
				graph.getLinks().forEach(function(link) {
					if (value) {
						link.attr('.link-tools/display', 'none');
						link.attr('.marker-vertices/display', 'none');
						link.attr('.connection-wrap/display', 'none');
					} else {
						link.removeAttr('.link-tools/display');
						if (editorService && editorService.allowLinkVertexEdit) {
							link.removeAttr('.marker-vertices/display');
						}
						link.removeAttr('.connection-wrap/display');
					}
				});
			}
			_readOnlyCanvas = value;
		}
		return _readOnlyCanvas;
	}
	
	function flashNode(node) {
		node.set('__animationDirection', !node.get('__animationDirection'));
		var color = node.get('__animationDirection') ? '#6db33f' : '#ffffff';
		node.transition('attrs/.border/stroke', color, {
			delay: 0,
			duration: 1000,
			valueFunction: joint.util.interpolate.hexColor,
			timingFunction: joint.util.timing.linear
		});
	}
	
	function startFlashingNode(node) {
		if (node.getTransitions().indexOf('attrs/.border/stroke') < 0) {
			// No active transition, store original values and start one
			node.set('__initStrokeWidth', node.attr('.border/stroke-width'));
			node.set('__initStroke', node.attr('.border/stroke'));
			node.on('transition:start', function() {
				node.off('transition:start');
				node.attr('.border/stroke-width', 5);
				node.attr('.border/stroke', '#ffffff');
			});
			node.on('transition:end', flashNode);
			flashNode(node);
		} else {
			// There is active transition, stop it and start over
			node.stopTransitions('attrs/.border/stroke');
			node.on('transition:start', function() {
				node.off('transition:start');
				node.set('__animationDirection', undefined);
				node.attr('.border/stroke-width', 5);
				node.attr('.border/stroke', '#ffffff');
			});
			node.on('transition:end', flashNode);
			flashNode(node);
		}
	}
	
	function stopFlashingNode(node) {
		node.attr('.border/stroke-width', node.get('__initStrokeWidth'));
		if (node.getTransitions().indexOf('attrs/.border/stroke') >= 0) {
			// there is active transition, end by starting a very short transition to original color
			node.off('transition:end');
			node.transition('attrs/.border/stroke', node.get('__initStroke'), {
				delay: 0,
				duration: 5,
				valueFunction: joint.util.interpolate.hexColor,
				timingFunction: joint.util.timing.linear
			});
		} else {
			// no transition yet? wait for it to start and stop it then
			node.on('transition:start', function() {
				node.off('transition:start');
				stopFlashingNode(node);
			});
		}
	}
	
	function highlight(element, selector) {
		if (element instanceof joint.dia.Element) {
			startFlashingNode(element);
			if (selector) {
				var attribute = selector + '/transform';
				var value = element.attr(attribute) ? element.attr(attribute) : '';
				// Double port size
				element.attr(attribute, value.replace(/scale\(\d*\)/g, '') + 'scale(2)');
			}
		} else if (element instanceof joint.dia.Link) {
			// TODO figure out highlighting for the link
		}
	}
	
	function unhighlight(element, selector) {
		if (element instanceof joint.dia.Element) {
			stopFlashingNode(element);
			if (selector) {
				var attribute = selector + '/transform';
				var value = element.attr(attribute) ? element.attr(attribute) : '';
				// Return port size to normal
				element.attr(attribute, value.replace(/scale\(\d*\)/g, ''));
			}
		} else if (element instanceof joint.dia.Link) {
			// TODO figure out unhighlighting for the link
		}
	}

	/**
	 * Displays graphical feedback for the drag and drop in progress based on current drag and drop descriptor object
	 *
 	 * @param dragDescriptor DnD info object. Has on info on graph node being dragged (drag source) and what it is
	 * being dragged over at the moment (drop target)
     */
	function showDragFeedback(dragDescriptor) {
		if (editorService && angular.isFunction(editorService.showDragFeedback)) {
			editorService.showDragFeedback($scope.flo, dragDescriptor);
		} else {
			if (dragDescriptor.source && dragDescriptor.target) {
				highlight(dragDescriptor.source.cell, dragDescriptor.source.selector);
				highlight(dragDescriptor.target.cell, dragDescriptor.target.selector);
			}
		}
	}

	/**
	 * Hides graphical feedback for the drag and drop in progress based on current drag and drop descriptor object
	 *
	 * @param dragDescriptor DnD info object. Has on info on graph node being dragged (drag source) and what it is
	 * being dragged over at the moment (drop target)
     */
	function hideDragFeedback(dragDescriptor) {
		if (editorService && angular.isFunction(editorService.hideDragFeedback)) {
			editorService.hideDragFeedback($scope.flo, dragDescriptor);
		} else {
			if (dragDescriptor.source && dragDescriptor.target) {
				unhighlight(dragDescriptor.source.cell, dragDescriptor.source.selector);
				unhighlight(dragDescriptor.target.cell, dragDescriptor.target.selector);
			}
		}
	}

	/**
	 * Sets the new DnD info object - the descriptor for DnD
	 *
	 * @param dragDescriptor DnD info object. Has on info on graph node being dragged (drag source) and what it is
	 * being dragged over at the moment (drop target)
     */
	function setDragDescriptor(dragDescriptor) {
		if (highlighted === dragDescriptor) {
			return;
		}
		if (highlighted && dragDescriptor && _.isEqual(highlighted.context, dragDescriptor.context)) {
			if (highlighted.source === dragDescriptor.source && highlighted.target === dragDescriptor.target) {
				return;
			}
			if (highlighted.source && 
					dragDescriptor.source &&
					highlighted.target &&
					dragDescriptor.target &&
					highlighted.source.cell === dragDescriptor.source.cell &&
					highlighted.source.selector === dragDescriptor.source.selector &&
					highlighted.target.cell === dragDescriptor.target.cell &&
					highlighted.target.selector === dragDescriptor.target.selector) {
				return;
			}
		}
		if (highlighted) {
			hideDragFeedback(highlighted);
		}
		highlighted = dragDescriptor;
		if (highlighted) {
			showDragFeedback(highlighted);
		}
	}

	/**
	 * Handles DnD events when a node is being dragged over canvas
	 *
 	 * @param draggedView The Joint JS view object being dragged
	 * @param targetUnderMouse The Joint JS view under mouse cursor
	 * @param x X coordinate of the mouse on the canvas
     * @param y Y coordinate of the mosue on the canvas
     * @param context DnD context (palette or canvas)
     */
	function handleNodeDragging(draggedView, targetUnderMouse, x, y, context) {
		if (editorService && angular.isFunction(editorService.calculateDragDescriptor)) {
			setDragDescriptor(editorService.calculateDragDescriptor($scope.flo, draggedView, targetUnderMouse, joint.g.point(x, y), context));
		}
	}

	/**
	 * Handles DnD drop event when a node is being dragged and dropped on the main canvas
	 */
	function handleNodeDropping() {
		if (highlighted && editorService && angular.isFunction(editorService.handleNodeDropping)) {
			editorService.handleNodeDropping($scope.flo, highlighted);
		}
		setDragDescriptor();
	}

	/**
	 * Hides DOM Node (used to determine drop target DOM element)
	 * @param domNode DOM node to hide
	 * @returns {{visibility: *, children: Array}}
     * @private
     */
    function _hideNode(domNode) {
		var oldVisibility = {
			visibility: domNode.style ? domNode.style.display : undefined,
			children: []
		};
		for (var i = 0; i < domNode.childNodes.length; i++) {
			oldVisibility.children.push(_hideNode(domNode.childNodes[i]));
		}
		if (domNode.style) {
			domNode.style.display = 'none';
		}
		return oldVisibility;
	}

	/**
	 * Restored DOM node original visibility (used to determine drop target DOM element)
	 * @param domNode DOM node to restore visibility of
	 * @param oldVisibility original visibility parameter
     * @private
     */
	function _restoreNodeVisibility(domNode, oldVisibility) {
		if (domNode.style) {
			domNode.style.display = oldVisibility.visibility;
		}
		for (var i = 0; i < domNode.childNodes.length; i++) {
			if (i < oldVisibility.children.length) {
				_restoreNodeVisibility(domNode.childNodes[i], oldVisibility.children[i]);								
			}
		}
	}
        
	/**
	 * Unfortunately we can't just use event.target because often draggable shape on the canvas overlaps the target.
	 * We can easily find the element(s) at location, but only nodes :-( Unclear how to find links at location 
	 * (bounding box of a link for testing is bad).
	 * The result of that is that links can only be the drop target when dragging from the palette currently. 
	 * When DnDing shapes on the canvas drop target cannot be a link.
	 * 
	 * Excluded views enables you to choose to filter some possible answers (useful in the case where elements are stacked
	 * - e.g. Drag-n-Drop)
	 */
	function getTargetElementFromEvent(event, x, y, excludeViews) {
		excludeViews = excludeViews || [];
		
		if (!x && !y) {
			var l = paper.snapToGrid({x: event.clientX, y: event.clientY});
			x = l.x;
			y = l.y;
		}
		
		var elements = graph.findModelsFromPoint(joint.g.point(x, y));
		if (Array.isArray(elements)) {
			for (var i = 0; i < elements.length; i++) {
				if (excludeViews.indexOf(paper.findViewByModel(elements[i])) < 0) {
					return elements[i];
				}
			}
		}
		
		var oldVisibility = [];
		excludeViews.forEach(function(excluded) {
			oldVisibility.push(_hideNode(excluded.el));
		});
		var targetElement = document.elementFromPoint(event.clientX, event.clientY);
		excludeViews.forEach(function(excluded, i) {
			_restoreNodeVisibility(excluded.el, oldVisibility[i]);
		});		
		var view = paper.findView(targetElement);
		if (view) {
			return view.model;
		}
	}
        
	function handleDraggingFromPalette(event) {
		/*
		 * Palette always fires this event because of the doc listener.
		 * No DnD from palette only if event.dragged is undefined
		 * TODO: see if palette code can be smarter about doc listeners.
		 */
		if (event.dragged && !readOnlyCanvas()) {
			var location = paper.snapToGrid({x: event.evt.clientX, y: event.evt.clientY});
			handleNodeDragging(event.dragged,  getTargetElementFromEvent(event.evt, location.x, location.y), location.x, location.y, {'palette': 'true'});
		}
	}
	
	function createNode(metadata, props, position) {
		return shapesFactory.createNode({
			'renderService': renderService,
			'paper': paper,
			'metadata': metadata,
			'props': props,
			'position': position
		});
	}
        
	function handleDropFromPalette(event) {
		var cellview = event.dragged;
		var evt = event.evt;
		if (paper.el===evt.target || $.contains(paper.el, evt.target)) {
			$log.debug('Dropped!');
			if (readOnlyCanvas()) {
				setDragDescriptor();
			} else {
                cellview.model.attr('metadata/name');
				var metadata = cellview.model.attr('metadata');
				var props = cellview.model.attr('props');
				
				var position = paper.snapToGrid({x: evt.clientX, y: evt.clientY});
				/* Calculate target element before creating the new
				 * element under mouse location. Otherwise target
				 * element would be the newly created element because
				 * it's under the mouse pointer
				 */
				getTargetElementFromEvent(evt, position.x, position.y);
				var newNode = createNode(metadata, props, position);
				var newView = paper.findViewByModel(newNode);
				
				handleNodeDragging(newView, getTargetElementFromEvent(evt, position.x, position.y, [ newView ]), position.x, position.y, {'palette': 'true'});
				handleNodeDropping();				
			}
		}
	}
        
	function autosizePaper() {
        var scrollBarSize = 17;
		var parent = $('#paper', domContext);
		paper.fitToContent({
			padding: $scope.paperPadding,
			minWidth: parent.width() - scrollBarSize,
			minHeight: parent.height() - scrollBarSize,
		});
	}
        
	function resize() {
		autosizePaper();
	}
        
	function dispose() {
		$scope.paletteObservers.off('drag', handleDraggingFromPalette);
		$scope.paletteObservers.off('drop', handleDropFromPalette);
		if (validationTimer) {
			$timeout.cancel(validationTimer);
		}
		if (graphUpdateTimer) {
			$timeout.cancel(graphUpdateTimer);
		}
		if (synctimer) {
			$timeout.cancel(synctimer);
		}
		$(window).off('resize', resize);
		events = {};
	}
	
	function getMinZoom() {
		return minZoom ? minZoom : 5;
	}
	
	function getMaxZoom() {
		return maxZoom ? maxZoom : 400;
	}
	
	function getZoomStep() {
		return zoomStep ? zoomStep : 5;
	}
        
	function fitToPage() {
        var scrollBarSize = 17;
		var parent = $('#paper', domContext);
		var minScale = getMinZoom() / 100;
		var maxScale = 2;
		paper.scaleContentToFit({
			padding: $scope.paperPadding,
			minScaleX: minScale,
			minScaleY: minScale,
			maxScaleX: maxScale, 
			maxScaleY: maxScale,
			fittingBBox: {x: 0, y: 0, width: parent.width() - scrollBarSize, height: parent.height() - scrollBarSize}
		});
		/**
		 * #scaleContentToFit() sets some weird origin for the paper, so autosize to get the better origin.
		 * If origins are different a sudden jump would flash when shape started being dragged on the
		 * canvas after #fitToPage() has been called
		 */
		autosizePaper();
	}

	function zoomPercent(percent) {
		if (percent) {
			if (!isNaN(percent)) {
				if (percent < getMinZoom()) {
					percent = getMinZoom();
				} else if (percent >= getMaxZoom()) {
					percent = getMaxZoom();
				} else {
					if (percent <= 0) {
						percent = 0.00001;
					}
				}
				paper.scale(percent/100, percent/100);
			}
		} else {
			return Math.round(joint.V(paper.viewport).scale().sx * 100);
		}
	}
	
	function gridSize(size) {
		if (size) {
			if (!isNaN(size) && size >= 1) {
				_gridSize = size; 
			}
		}
		return _gridSize;
	}
	
	function getSelection() {
		return selection;
	}
	
	$scope.flo.deleteSelectedNode = function() {
		var selection = getSelection();
		if (selection) {
			if (editorService && angular.isFunction(editorService.preDelete)) {
				editorService.preDelete($scope.flo, selection.model);
			} else {
				if (selection.model instanceof joint.dia.Element) {
					graph.getConnectedLinks(selection.model).forEach(function(l) {
						l.remove();
					});
				}
			}
			selection.model.remove();
			setSelection();
		}
	};
        
	function createLink(source, target, metadata, props) {
		return shapesFactory.createLink({
			'renderService': renderService,
			'paper': paper,
			'source': source,
			'target': target,
			'metadata': metadata,
			'props': props
		});
	}
	
	if (!$scope.paletteObservers) {
		$scope.paletteObservers = createEventManager();
	}
	
//	/**
//	 * Determine if the supplied location is on the paper. The location is expected to be browser relative.
//	 */
//	function onPaper(x,y) {
//		// $log.info("paper at L="+$('#paper').position().left+" T="+$('#paper').position().top+
//		//  "  size = "+$('#paper').width()+"x"+$('#paper').height());	
//		var p = $('#paper', domContext);
//		var paperLeft = p.offset().left;
//		var paperTop = p.offset().top;
//		return (x>paperLeft && x<(paperLeft+p.width()) &&
//				y>paperTop && y<(paperTop+p.height()));
//	}
	
//  /**
//   * Determine if the supplied location is on an element.
//   */
//	function onElement(elementName, x,y) {
//		var p = $(elementName);
//		return (x>p.position().left && x<(p.position().left+p.width()) &&
//				y>p.position().top && y<(p.position().top+p.height()));
//	}
	
	function getElementFromId(id) {
		return graph.getCell(id);
	}
	
	function validateNode(element) {
		if (!element) {
			return;
		}
		if (editorService && angular.isFunction(editorService.validateNode)) {
			var errors = editorService.validateNode($scope.flo, element);
			
			$log.info('Validated ' + element.id + ' Errors: ' + errors);
						
			errors = errors || [];
			var errorMessages = [];
			
			errors.forEach(function(e) {
				if (typeof e === 'string') {
					errorMessages.push(e);
				} else if (typeof e.message === 'string') {
					if (e.range) {
						if (!$scope.definition.parseError) {
							$scope.definition.parseError = [];
						}
						$scope.definition.parseError.push(e);
					}
					errorMessages.push(e.message);
				}
			});
				
			var embedded = element.getEmbeddedCells();
			var found = false;
			for (var i = 0; i < embedded.length && !found; i++) {
				if (embedded[i].attr('./kind') === 'error') {
					found = true;
					if (errorMessages.length === 0) {
						embedded[i].remove();
					} else {
					    // Without rewrite we merge this list with existing errors
						embedded[i].attr('messages',errorMessages,{rewrite:true});
					}				
				}
			}
			if (!found && errorMessages.length > 0) {
				var error = shapesFactory.createDecoration({
					'renderService': renderService,
					'paper': paper,
					'parent': element,
					'kind': 'error',
					'messages': errorMessages
				});
				var pt = element.getBBox().topRight().offset(-error.get('size').width, 0);
				error.set('position', pt);
				var view = paper.findViewByModel(error);
				view.options.interactive = false;			
			}
				
		}		
	}
        
	function postValidation(invalidElementIds) {
		if (invalidElementIds) {
			if (validationTimer) {
				$timeout.cancel(validationTimer);
			}
			if (typeof invalidElementIds === 'string') {
				invalidNodes[invalidElementIds] = true;
			} else if (invalidElementIds.length) {
				for (var i = 0; i < invalidElementIds.length; i++) {
					if (typeof invalidElementIds[i] === 'string') {
						invalidNodes[invalidElementIds[i]] = true;
					}
				}
			}
			validationTimer = $timeout(function() {
				for (var id in invalidNodes) {
					var element = getElementFromId(id);
					if (element && element.attr('metadata')) {
						validateNode(element);
					}
				}
				invalidNodes = {};
			}, 100);
		}
	}
	
	// Applies fan routing to multiple links not having any vertices (except start and end point) between the same source and target
	function fanRoute(graph, cell) {
	    // If the cell is a view, find its model.
	    cell = cell.model || cell;

	    if (cell instanceof joint.dia.Element) {

	        _.chain(graph.getConnectedLinks(cell)).groupBy(function(link) {
	            // the key of the group is the model id of the link's source or target, but not our cell id.
	            return _.omit([link.get('source').id, link.get('target').id], cell.id)[0];
	        }).each(function(group, key) {
	            // If the member of the group has both source and target model adjust vertices.
	        	var toRoute = {};
	        	if (key !== undefined) {
	        		group.forEach(function(link) {
	        			if (link.get('source').id === cell.get('id') && link.get('target').id) {
	        				toRoute[link.get('target').id] = link;
	        			} else if (link.get('target').id === cell.get('id') && link.get('source').id) {
	        				toRoute[link.get('source').id] = link;
	        			}
	        		});
	        		Object.keys(toRoute).forEach(function(key) {
		        		fanRoute(graph, toRoute[key]);	        		
	        		});
	        	}
	        });

	        return;
	    }

	    // The cell is a link. Let's find its source and target models.
	    var srcId = cell.get('source').id || cell.previous('source').id;
	    var trgId = cell.get('target').id || cell.previous('target').id;

	    // If one of the ends is not a model, the link has no siblings.
	    if (!srcId || !trgId) { return; }

	    var siblings = _.filter(graph.getLinks(), function(sibling) {

	        var _srcId = sibling.get('source').id;
	        var _trgId = sibling.get('target').id;
	        var vertices = sibling.get('vertices');
	        var fanRouted = !vertices || vertices.length === 0 || sibling.get('fanRouted');

	        return ((_srcId === srcId && _trgId === trgId) || (_srcId === trgId && _trgId === srcId)) && fanRouted;
	    });
        
	    switch (siblings.length) {

	    case 0:
	        // The link was removed and had no siblings.
	        break;

	    case 1:
	        // There is only one link between the source and target. No vertices needed.
	        var vertices = cell.get('vertices');
	        if (vertices && vertices.length && cell.get('fanRouted')) {
		        cell.unset('vertices');	        	
	        }
	        break;

	    default:
	    	
	        // There is more than one siblings. We need to create vertices.

	        // First of all we'll find the middle point of the link.
	    	var source = graph.getCell(srcId);
	    	var target = graph.getCell(trgId);
	    	
	    	if (!source || !target) {
	    		// When clearing the graph it may happen that some nodes are gone and some are left
	    		return;
	    	}
	    	
	        var srcCenter = source.getBBox().center();
	        var trgCenter = target.getBBox().center();
	        var midPoint = joint.g.line(srcCenter, trgCenter).midpoint();

	        // Then find the angle it forms.
	        var theta = srcCenter.theta(trgCenter);

	        // This is the maximum distance between links
	        var gap = 20;

	        _.each(siblings, function(sibling, index) {

	            // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
	            var offset = gap * Math.ceil(index / 2);

	            // Now we need the vertices to be placed at points which are 'offset' pixels distant
	            // from the first link and forms a perpendicular angle to it. And as index goes up
	            // alternate left and right.
	            //
	            //  ^  odd indexes 
	            //  |
	            //  |---->  index 0 line (straight line between a source center and a target center.
	            //  |
	            //  v  even indexes
	            var sign = index % 2 ? 1 : -1;
	            var angle = joint.g.toRad(theta + sign * 90);

	            // We found the vertex.
	            var vertex = joint.g.point.fromPolar(offset, angle, midPoint);

	            sibling.set('fanRouted', true);
	            sibling.set('vertices', [{ x: vertex.x, y: vertex.y }], {'fanRouted': true});	            
	        });
	    }
	}
	
	function reactToVerticesChange(cell, changed, opt) {
    	if (opt.fanRouted) {
    		cell.set('fanRouted', true);
    	} else {
    		cell.unset('fanRouted');
    	}
	}
	
	function doLayout() {
		if (renderService && angular.isFunction(renderService.layout)) {
			return renderService.layout($scope.flo.getPaper());
		}
	}

	/**
	 * Ask the server to parse the supplied text into a JSON graph of nodes and links,
	 * then update the view based on that new information.
	 * 
	 * @param {string} definition A flow definition (could be any format the server 'parse' endpoint understands)
	 */
	function updateGraphRepresentation() {
		$log.debug('Updating graph to represent \''+$scope.definition.text+'\'');
		if (metamodelService && angular.isFunction(metamodelService.textToGraph)) {
			return metamodelService.textToGraph($scope.flo, $scope.definition);
		}
	}

	var mainElementView = joint.dia.ElementView.extend({
		canShowTooltip: true,
		beingDragged: false,
		_tempZorder: 0,
		_tempOpacity: 1.0,
		_hovering: false,
		pointerdown: function(evt, x, y) {
			this.canShowTooltip = false;
			this.hideTooltip();
			this.beingDragged = false;
			this._tempOpacity = this.model.attr('./opacity');

	        this.model.trigger('batch:start');
	        
	        if ( // target is a valid magnet start linking
	            evt.target.getAttribute('magnet') &&
	            this.paper.options.validateMagnet.call(this.paper, this, evt.target)
	        ) {
	            var link = this.paper.getDefaultLink(this, evt.target);
	            if ($(evt.target).attr('type') === 'input') {
		            link.set({
		                source: { x: x, y: y },
		                target: {
		                    id: this.model.id,
		                    selector: this.getSelector(evt.target),
		                    port: evt.target.getAttribute('port')
		                }
		            });
	            } else {
		            link.set({
		                source: {
		                    id: this.model.id,
		                    selector: this.getSelector(evt.target),
		                    port: evt.target.getAttribute('port')
		                },
		                target: { x: x, y: y }
		            });
	            }
	            this.paper.model.addCell(link);
	            this._linkView = this.paper.findViewByModel(link);
	            if ($(evt.target).attr('type') === 'input') {
		            this._linkView.startArrowheadMove('source');
	            } else {
		            this._linkView.startArrowheadMove('target');
	            }
	            this.paper.__creatingLinkFromPort = true;
	        } else {
	            this._dx = x;
	            this._dy = y;

	            joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
	        }
		},
		pointermove: function(evt, x, y) {
			var interactive = _.isFunction(this.options.interactive) ? this.options.interactive(this, 'pointermove') :
				this.options.interactive;
			if (interactive !== false && !this._linkView) {
				this.beingDragged = true;
				handleNodeDragging(this, getTargetElementFromEvent(evt, x, y, [ this ]), x, y, {'canvas': 'true'});
				this.model.attr('./opacity', 0.75);
			}
			joint.dia.ElementView.prototype.pointermove.apply(this, arguments);
		},
		pointerup: function(evt, x, y) { // jshint ignore:line
            delete this.paper.__creatingLinkFromPort;
			this.canShowTooltip = true;
			if (this.beingDragged) {
				if (typeof this._tempOpacity === 'number') {
					this.model.attr('./opacity', this._tempOpacity);
				} else {
					// Joint JS view doesn't react to attribute removal.
					// TODO: fix in the mainElementView
					this.model.attr('./opacity', 1);
//					this.model.removeAttr('./opacity');
				}
				handleNodeDropping();
			}
			this.beingDragged = false;
			joint.dia.ElementView.prototype.pointerup.apply(this, arguments);
		},
		events: {
	    	// Tooltips on the elements in the graph
	    	'mouseenter': function(evt) {
	    		if (this.canShowTooltip) {
	    			this.showTooltip(evt.pageX, evt.pageY);
	    		}
				if (!this._hovering && !this.paper.__creatingLinkFromPort) {
					this._hovering = true;
					if (isChrome || isFF) {
			    		this._tempZorder = this.model.get('z');
			    		this.model.toFront({deep: true});
					}
				}
	    	},
	    	'mouseleave': function() {
	    		this.hideTooltip();
				if (this._hovering) {
					this._hovering = false;
		    		if (isChrome || isFF) {
			    		this.model.set('z', this._tempZorder);
			    		var z = this._tempZorder;
			    		this.model.getEmbeddedCells({breadthFirst: true}).forEach(function(cell) {
			    			cell.set('z', ++z);
			    		});
		    		}
				}
	    	},
	    	'mousemove': function(evt) {
	    		this.moveTooltip(evt.pageX, evt.pageY);
	    	}
		},
		showTooltip: function(x, y) {
    		var mousex = x + 10;
	        var mousey = y + 10;

            var nodeTooltip;
    		if (this.model instanceof joint.dia.Element && this.model.attr('metadata')) {
	    		nodeTooltip = document.createElement('div');
	    		$(nodeTooltip).addClass('node-tooltip');
	    		
	    		$(nodeTooltip).appendTo($('body')).fadeIn('fast');
	    		$(nodeTooltip).addClass('tooltip-description');
	    		var nodeTitle = document.createElement('div');
	    		$(nodeTooltip).append(nodeTitle);	    		
	    		var nodeDescription = document.createElement('div');
	    		$(nodeTooltip).append(nodeDescription);
	    		
	    		var model = this.model;
	    		
	    		if (model.attr('metadata/name')) {
	    			var typeSpan = document.createElement('span');
		    		$(typeSpan).addClass('tooltip-title-type');
		    		$(nodeTitle).append(typeSpan);		    		
	    			$(typeSpan).text(model.attr('metadata/name'));
	    			if (model.attr('metadata/group')) {
		    			var groupSpan = document.createElement('span');
			    		$(groupSpan).addClass('tooltip-title-group');
			    		$(nodeTitle).append(groupSpan);		    		
		    			$(groupSpan).text('(' + model.attr('metadata/group') + ')');
	    			}
	    		}
	    		
	    		model.attr('metadata').get('description').then(function(description) {
		    		$(nodeDescription).text(description);	    				
	    		}, function(error) {
	    			if (error) {
	    				$log.error(error);
	    			}
	    		});

	    		// defaultValue
	    		if (!model.attr('metadata/metadata/hide-tooltip-options')) {
	    			model.attr('metadata').get('properties').then(function(metaProps) {
	    	    		var props = model.attr('props'); // array of {'name':,'value':}
			    		if (metaProps && props) {
		    	    		Object.keys(props).sort().forEach(function(propertyName) {
		    	    			if (metaProps[propertyName]) {
				    				var optionRow = document.createElement('div');
				    				var optionName = document.createElement('span');
				    				var optionDescription = document.createElement('span');
				    				$(optionName).addClass('node-tooltip-option-name');
				    				$(optionDescription).addClass('node-tooltip-option-description');
				    				$(optionName).text(metaProps[propertyName].name);
				    				$(optionDescription).text(props[propertyName]);//nodeOptionData[i].description);
				    				$(optionRow).append(optionName);
				    				$(optionRow).append(optionDescription); 
				    				$(nodeTooltip).append(optionRow);
		    	    			}
			    				// This was the code to add every parameter in:
//			    				$(optionName).addClass('node-tooltip-option-name');
//			    				$(optionDescription).addClass('node-tooltip-option-description');
//			    				$(optionName).text(metaProps[propertyName].name);
//			    				$(optionDescription).text(metaProps[propertyName].description);
//			    				$(optionRow).append(optionName);
//			    				$(optionRow).append(optionDescription); 
//			    				$(nodeTooltip).append(optionRow);
		    	    		});
			    		}
	    			}, function(error) {
	    				if (error) {
	    					$log.error(error);
	    				}
	    			});
	    		}
	    		
	            $('.node-tooltip').css({ top: mousey, left: mousex });
    		} else if (this.model.get('type') === joint.shapes.flo.DECORATION_TYPE && this.model.attr('./kind') === 'error') {
	    		$log.debug('mouse enter: ERROR box=' + JSON.stringify(this.model.getBBox()));
	    		nodeTooltip = document.createElement('div');
	    		var errors = this.model.attr('messages');
	    		if (errors && errors.length > 0) {
		    		$(nodeTooltip).addClass('error-tooltip');
		    		$(nodeTooltip).appendTo($('body')).fadeIn('fast');
		    		var header = document.createElement('p');
		    		$(header).text('Errors:');
		    		$(nodeTooltip).append(header);
		    		for (var i = 0;i < errors.length; i++) {
				    	var errorElement = document.createElement('li');
				    	$(errorElement).text(errors[i]);
				    	$(nodeTooltip).append(errorElement);
		    		}
		            $('.error-tooltip').css({ top: mousey, left: mousex });
	    		}
    		}
		},
		hideTooltip: function() {
    		$('.node-tooltip').remove();
    		$('.error-tooltip').remove();
		},
		moveTooltip: function(x, y) {
	        $('.node-tooltip')
	        .css({ top: y + 10, left: x + 10 });
   	        $('.error-tooltip')
	        .css({ top: y + 10, left: x + 10 });
		}
	});
	
	function initEditor(attrs) {
		if (attrs.minZoom && !isNaN(attrs.minZoom)) {
			minZoom = Number(attrs.minZoom);
		}
		if (attrs.maxZoom && !isNaN(attrs.maxZoom)) {
			maxZoom = Number(attrs.maxZoom);
		}
		if (attrs.zoomStep && !isNaN(attrs.zoomStep)) {
			zoomStep = Number(attrs.zoomStep);
		}
		zoomPercent(attrs.initZoom);
		readOnlyCanvas(attrs.initReadOnlyCanvas);
	}
        
	function updateTextRepresentation() {
		if (metamodelService && angular.isFunction(metamodelService.graphToText)) {
			return metamodelService.graphToText($scope.flo, $scope.definition);
		}
	}
        
	function enableSyncing(on) {
		//$log.info("Enable syncing: "+(on?"ON":"OFF"));
		paper.off('resync-required');
		if (on) {
			paper.on('resync-required',function() {
				if (synctimer) {
					$timeout.cancel(synctimer);
				}
				synctimer = $timeout(updateTextRepresentation, 100);
			});
		}
	}
	
	function initMetamodel() {
		metamodelService.load().then(function(data) {
			updateGraphRepresentation();
			enableSyncing(true);		
			if (editorService && angular.isFunction(editorService.setDefaultContent)) {
				editorService.setDefaultContent($scope.flo, data);
			}
		});
	}
		
	function initGraph() {
		graph = new joint.dia.Graph();
		graph.attributes.type = joint.shapes.flo.CANVAS_TYPE;
	}
	
	function handleNodeCreation(node) {
		node.on('change:size', autosizePaper);
		node.on('change:position', autosizePaper);
		if (node.attr('metadata')) {
			node.on('change:attrs', function(cell, attrs, changeData) {
				var propertyPath = changeData ? changeData.propertyPath : null;
				if (propertyPath) {
					var propAttr = propertyPath.substr(propertyPath.indexOf('/') + 1);
					if (propAttr.indexOf('metadata') === 0 ||
							propAttr.indexOf('props') === 0 ||
							(renderService && angular.isFunction(renderService.isSemanticProperty) && renderService.isSemanticProperty(propAttr, node))) {						
						postValidation(node.id);
						if (selection && selection.model === node) {
							if (propsMgr) {
				    			propsMgr.updatePropertiesView(selection);
							}
						}
						paper.trigger('resync-required');
					}
					if (renderService && angular.isFunction(renderService.refreshVisuals)) {
						renderService.refreshVisuals(node, propAttr, paper);
					}

				}		
			});
			postValidation(node.id);
		}
	}
	
	/**
	 * Forwards a link event occurrence to any handlers in the editor service, if they are defined. Event examples
	 * are 'change:source', 'change:target'.
	 */
	function handleLinkEvent(paper, event, link) {
		if (renderService && angular.isFunction(renderService.handleLinkEvent)) {
			if (renderService.handleLinkEvent(paper,event,link)) {
				// If the link was changed, update the properties view which might be open for it
				if (propsMgr && propsMgr.isVisible(link.id)) {
					propsMgr.updatePropertiesView(paper.findViewByModel(link));
				}
			}
		}
	}
	
	function updateNodeLinkStats(linkType, endPoint, increment, outgoing) {
		if (increment && endPoint) {
			linkType = linkType || '.';
			var node = getElementFromId(endPoint.id);
			if (node) {
				var incidence = outgoing ? 'outgoing' : 'incoming';
				
				var selectorType;
				if (endPoint.selector) {
					var view = paper.findViewByModel(node);
					if (view) {
						var el = view.findBySelector(endPoint.selector);
						if (el) {
							selectorType = el.attr('type');
						}
					}
				}
				var attrPath = selectorType ? 'linkStats/ports/' + selectorType + '/' + linkType + '/' + incidence
						:  'linkStats/links/' + linkType + '/' + incidence;
				var current = node.attr(attrPath) || 0;
				node.attr(attrPath, Math.max(0, increment + current), {silent: true});
			}
		}
	}
		
	function handleLinkCreation(link) {
		updateNodeLinkStats(link.attr('metadata/name'), link.get('source'), 1, true);
		updateNodeLinkStats(link.attr('metadata/name'), link.get('target'), 1, false);
		handleLinkEvent(paper, 'add', link);
		postValidation([link.get('source').id, link.get('target').id]);
		link.on('change:source', function(link) {
			autosizePaper();
			var newSourceId = link.get('source').id;
			var oldSourceId = link.previous('source').id;
			updateNodeLinkStats(link.attr('metadata/name'), link.previous('source'), true, -1);
			updateNodeLinkStats(link.attr('metadata/name'), link.get('source'), true, 1);
			if (newSourceId !== oldSourceId) {
				postValidation([newSourceId, oldSourceId]);
				paper.trigger('resync-required');
			}
			handleLinkEvent(paper,'change:source',link);
		});
		link.on('change:target', function(link) {
			autosizePaper();
			var newTargetId = link.get('target').id;
			var oldTargetId = link.previous('target').id;
			updateNodeLinkStats(link.attr('metadata/name'), link.previous('target'), false, -1);
			updateNodeLinkStats(link.attr('metadata/name'), link.get('target'), false, 1);
			if (newTargetId !== oldTargetId) {
				postValidation([newTargetId, oldTargetId]);
				paper.trigger('resync-required');
			}
			handleLinkEvent(paper,'change:target',link);
		});
		link.on('change:vertices', autosizePaper);
		link.on('change:attrs', function(cell, attrs, changeData) {
			var propertyPath = changeData ? changeData.propertyPath : null;
			if (propertyPath) {
				var propAttr = propertyPath.substr(propertyPath.indexOf('/') + 1);
				if (propAttr.indexOf('metadata') === 0 ||
						propAttr.indexOf('props') === 0 ||
						(renderService && angular.isFunction(renderService.isSemanticProperty) && renderService.isSemanticProperty(propAttr, link))) {
					var sourceId = link.get('source').id;
					var targetId = link.get('target').id;
					if (sourceId) {
						postValidation(sourceId);
					}
					if (targetId) {
						postValidation(targetId);
					}
					if (selection && selection.model === link) {
						if (propsMgr) {
			    			propsMgr.updatePropertiesView(selection);
						}
					}
					paper.trigger('resync-required');
				}
				if (renderService && angular.isFunction(renderService.refreshVisuals)) {
					renderService.refreshVisuals(link, propAttr, paper);
				}
			}
		});
		if (readOnlyCanvas()) {
			link.attr('.link-tools/display', 'none');
		}
	}
	
	/*
	 * Workaround for
	 * https://github.com/clientIO/joint/issues/197
	 */
	var PaperExtended = joint.dia.Paper.extend({
		pointerdown: function(evt) {
			joint.dia.Paper.prototype.pointerdown.call(this, evt);
			this._mousemoved = false;
	    }
	});
        
	function initGraphListeners() {
		graph.on('add', function(element) {
			if (element instanceof joint.dia.Link) {
				handleLinkCreation(element);
			} else if (element instanceof joint.dia.Element) {
				handleNodeCreation(element);
			}
			paper.trigger('resync-required');
			autosizePaper();
		});
		
		graph.on('remove', function(element) {
			if (element.isLink()) {
				updateNodeLinkStats(element.attr('metadata/name'), element.get('source'), -1, true);
				updateNodeLinkStats(element.attr('metadata/name'), element.get('target'), -1, false);
				handleLinkEvent(paper, 'remove', element);
				postValidation([element.get('source').id, element.get('target').id]);
			}
			if (selection && selection.model === element) {
				setSelection();
				if (propsMgr) {
	    			propsMgr.updatePropertiesView();
				}
			}
			if (element.isLink()) {
				setTimeout(function() {paper.trigger('resync-required');},100);
			} else {
				paper.trigger('resync-required');
			}
			autosizePaper();
		});
		
		var routingCall = _.partial(fanRoute, graph);
		// Set if link is fan-routed. Should be called before routing call
		graph.on('change:vertices', reactToVerticesChange);
		// adjust vertices when a cell is removed or its source/target was changed
		graph.on('add remove change:source change:target change:vertices change:position', routingCall);
	}   
        
	function getGridBackgroundImage(gridX, gridY) {
	    var canvas = document.createElement('canvas');
	    canvas.width = gridX * 10;
	    canvas.height = gridY * 10;

	    if (gridX > 5 && gridY > 5) {

	        var context = canvas.getContext('2d');
	        context.beginPath();
	        
	        var ox = paper.options.origin.x;
	        var oy = paper.options.origin.y;

	        var startX = ox >= 0 ? ((ox * 100) % (gridX * 100)) / 100 : ((gridX * 100) + (ox * 100) % (gridX * 100) - 1 * 100) / 100;
	        var startY = oy >= 0 ? ((oy * 100) % (gridY * 100)) / 100 : ((gridY * 100) + (oy * 100) % (gridY * 100) - 1 * 100) / 100;

		    for (var i = 0; i < 10; i++) {
		    	for (var j = 0; j < 10; j++) {
			        context.rect(startX + gridX * i, startY + gridY * j, 1, 1);
		    	}
		    }
		    
	        context.fillStyle = 'black';
	        context.fill();
	    }
	    
	    return canvas.toDataURL('image/png');
	}
	
	function refreshGridVisuals() {
		var scale = joint.V(paper.viewport).scale(); // jshint ignore:line
		$(paper.svg).css('background-image', 'url("' + getGridBackgroundImage(paper.options.gridSize * scale.sx, paper.options.gridSize * scale.sy) + '")');
	}
	
	function initPaperListeners() {
		// http://stackoverflow.com/questions/20463533/how-to-add-an-onclick-event-to-a-joint-js-element
		paper.on('cell:pointerclick',
		    function(cellView, evt, x, y) { // jshint ignore:line
				if (!readOnlyCanvas()) {
					setSelection(cellView);
				}
		    }
		);
		
		paper.on('blank:pointerclick', 
			function(evt, x, y) { // jshint ignore:line
				setSelection();
			}
		);
		
		paper.on('scale', function() {
			autosizePaper();
		});

		paper.on({
		    scale: function(sx, sy) { // jshint ignore:line
				refreshGridVisuals();
		    },
		    translate: function(ox, oy) { // jshint ignore:line
				refreshGridVisuals();
		    }
		});
		
		// JointJS now no longer grabs focus if working in a paper element - crude...
		$('#flow-view', domContext).on('mousedown', function() {
			$('#palette-filter-textfield', domContext).focus();
		});
	}
	
	function initPaper() {
		// The paper is what will represent the graph on the screen
		paper = new PaperExtended({ // http://www.jointjs.com/api#joint.dia.Paper
		 	el: $('#paper', domContext),
		 	gridSize: gridSize(),
		 	model: graph,
		 	elementView: renderService && angular.isFunction(renderService.getNodeView) ? renderService.getNodeView() : mainElementView,
		 	linkView: renderService && angular.isFunction(renderService.getLinkView) ? renderService.getLinkView() : joint.dia.LinkView,
		 	// Enable link snapping within 25px lookup radius
		 	snapLinks: { radius: 25 }, // http://www.jointjs.com/tutorial/ports
			defaultLink: renderService && angular.isFunction(renderService.createLink) ? renderService.createLink() : new joint.shapes.flo.Link(),

			// decide whether to create a link if the user clicks a magnet
		 	validateMagnet:  function(cellView, magnet) {
				if (readOnlyCanvas()) {
					return false;
				} else {
					if (editorService && angular.isFunction(editorService.validatePort)) {
						return editorService.validatePort($scope.flo, cellView, magnet);
					} else {
						return true;
					}
				}
		 	},
		 	
		 	validateConnection: editorService && angular.isFunction(editorService.validateLink) ? function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
		 		return editorService.validateLink($scope.flo, cellViewS, magnetS, cellViewT, magnetT, end, linkView);
		 	}: undefined,
		 	
		    interactive: function() {
				if (readOnlyCanvas()) {
					return false;
				} else {
					return editorService && angular.isDefined(editorService.interactive) ? editorService.interactive : undefined;
				}
			},

		 	linkConnectionPoint: renderService && angular.isFunction(renderService.getLinkAnchorPoint) ? renderService.getLinkAnchorPoint : undefined,
	        markAvailable: true
		});
		
		refreshGridVisuals();
		
		$scope.$watch(function() {
			return $scope.flo.gridSize();
		}, function(newValue) {
			paper.options.gridSize = newValue;
			refreshGridVisuals();
		});
		
		// Watch for palette presence model variable changes
		$scope.$watch(function() {
			return $scope.flo.noPalette;
		}, function(newValue) {
			// If palette is not shown ensure that canvas starts from the left==0!
			if (newValue) {
				$('#paper-container', domContext).css('left', 0);
			}
		});
	}
		
	function initProperties(attrs) {
		if (!attrs.disableProperties) {
			propsMgr = createProperties(domContext, metamodelService);
			
			propsMgr.on('change',function() {
				paper.trigger('resync-required');
			});
		} 
	}
	
	function initPalette() {
		$scope.paletteObservers.on('drag', handleDraggingFromPalette);
		$scope.paletteObservers.on('drop', handleDropFromPalette);
	}
	
	$scope.init = function(domElement, attrs) {
		domContext = domElement;
		if (!$scope.definition) {
			$scope.definition = {
				text: ''
			};		
		} else {
			if (!$scope.definition.text) {
				$scope.definition.text = '';
			}
		}
						
		metamodelService = $injector.get($scope.metamodelServiceName);
		
		if ($scope.renderServiceName) {
			renderService = $injector.get($scope.renderServiceName);
		}
		
		if ($scope.editorServiceName) {
			editorService = $injector.get($scope.editorServiceName);
		}

		initGraph();
		
		initPaper();
		
		initGraphListeners();
		
		initPaperListeners();
		
		initPalette();
		
		initProperties(attrs);

		initEditor(attrs);
		
		initMetamodel();
		
		$(window).on('resize', resize);
		
		/*
		 * Execute resize to get the right size for the SVG element on the editor canvas.
		 * Executed via timeout to let angular render the DOM first and elements to have the right width and height
		 */
		$timeout(resize);
		
	};
	
//	/**
//	 * Bring the node/link clicked on up in the z-order 
//	 */
//	paper.on('cell:pointerdown', function(cellView, evt, x, y) {
//	    var cell = cellView.model;
//	    if (!cell.get('parent')) {
//	        cell.toFront();
//		    var children = cell.get('embeds');
//		    if (children && children.length) {
//		        for (var i = 0; i < children.length; i++) {
//		        	getElementFromId(children[i]).toFront();
//		        }
//		    }
//	    }
//	});
	
	$scope.flo.scheduleUpdateGraphRepresentation = function() {
		if (graphUpdateTimer) {
			$timeout.cancel(graphUpdateTimer);
		}
		graphUpdateTimer = $timeout( function() {
			graphUpdateTimer = null;
			updateGraphRepresentation();
		}, 300 );
	};
	
	$scope.flo.updateGraphRepresentation = updateGraphRepresentation;
        
	$scope.$on('$destroy', dispose);

	$scope.flo.updateTextRepresentation = updateTextRepresentation;

	$scope.flo.performLayout = doLayout;
	
	$scope.flo.clearGraph = function() {
		$log.info('Creating new flow');
		setSelection();
		graph.clear();
		if (metamodelService && angular.isFunction(metamodelService.load) &&
			editorService && angular.isFunction(editorService.setDefaultContent)) {
			
			return metamodelService.load().then(function(data) {
				return editorService.setDefaultContent($scope.flo, data);
			});
		}
	};
	
	$scope.flo.getGraph = function() {
		return graph;
	};

	$scope.flo.getPaper = function() {
		return paper;
	};
	
	$scope.flo.enableSyncing = enableSyncing;
	
	$scope.flo.getSelection = getSelection;
	
	$scope.flo.zoomPercent = zoomPercent;
	
	$scope.flo.gridSize = gridSize;
	
	$scope.flo.getMinZoom = getMinZoom;
	
	$scope.flo.getMaxZoom = getMaxZoom;
	
	$scope.flo.getZoomStep = getZoomStep;
	
	$scope.flo.fitToPage = fitToPage;
	
	$scope.flo.readOnlyCanvas = readOnlyCanvas;
	
	$scope.flo.createNode = createNode;
	
	$scope.flo.createLink = createLink;

	// Internal API below. Might be used for tests.

	$scope.flo._setDragDescriptor = setDragDescriptor;

	$scope.flo._handleNodeDropping = handleNodeDropping;

	}];
});
