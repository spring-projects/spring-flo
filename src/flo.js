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

	require('angular');
    
	var app = angular.module('spring.flo', []);
	
	app.directive('dslEditor', function() {
		return {
			restrict: 'A',
			scope: true,
			controller: require('dsl-editor'),
			link: function(scope, element, attrs) {
				if (attrs.contentAssistServiceName) {
					scope.contentAssistServiceName = attrs.contentAssistServiceName;
				}
				scope.init(element.context);
			}
		};
	});
	
	app.directive('codeEditor', function() {
		return {
			restrict: 'A',
			controller: require('code-editor'),
			link: function(scope, element, attrs) {
				scope.init(element.context, attrs);
			},
			scope: {
				language: '=codeLanguage',
				text: '=codeText',
				decodeFunction: '&',
				encodeFunction: '&'
			}
		};
	});
	
	app.directive('floPalette', function() {
		return {
			restrict: 'E',
			scope: true,
			link: function(scope, element, attrs) {
				if (attrs.metamodelServiceName) {
					scope.metamodelServiceName = attrs.metamodelServiceName;
				}
				scope.init(element.context, attrs);
			},
			controller: require('palette-manager'),
			controllerAs: 'floPalette',
			template: 
				'<div id="palette-filter" class="palette-filter">' +
					'<input type="text" id="palette-filter-textfield" ng-model="filterText" ng-change="filterTextUpdated()" class="palette-filter-textfield" ng-model-options="{ debounce: 500 }"/>' +
				'</div>' +
				'<div id="palette-paper-container" style="height:calc(100% - 46px); width:100%; overflow:auto;">' +
					'<div id="palette-paper" class="palette-paper" style="overflow:hidden;"></div>' +
				'</div>'
		};
	});
	
	// Div for resizing the palette
	app.directive('resizer', function($document) {

	    return function($scope, $element, $attrs) {

	        function resize(size) {
	            if ($attrs.resizer === 'vertical') {
	                // Handle vertical resizer
	                var x = size;
	                
	                if ($attrs.resizerMax && x > $attrs.resizerMax) {
	                    x = parseInt($attrs.resizerMax);
	                }

	                $element.css({
	                    left: x + 'px'
	                });

	                $($attrs.resizerLeft).css({
	                    width: x + 'px'
	                });
	                $($attrs.resizerRight).css({
	                    left: (x + parseInt($attrs.resizerWidth)) + 'px'
	                });
	            } else {
	                // Handle horizontal resizer
	                var y = size;

	                $element.css({
	                    bottom: y + 'px'
	                });

	                $($attrs.resizerTop).css({
	                    bottom: (y + parseInt($attrs.resizerHeight)) + 'px'
	                });
	                $($attrs.resizerBottom).css({
	                    height: y + 'px'
	                });
	            }
	        }
	        
	        function mousemove(event) {
	        	var size;
	            if ($attrs.resizer === 'vertical') {
	                // Handle vertical resizer. Calculate new size relative to palette container DOM node
	                size = event.pageX - $($attrs.resizerLeft).offset().left;
	            } else {
	                // Handle horizontal resizer Calculate new size relative to palette container DOM node
	            	size = window.innerHeight - event.pageY - $($attrs.resizerTop).offset().top;
	            }
            	$scope.flo.paletteSize = size;
            	// Apply changes to the scope such that various watchers can react to palette size change
            	$scope.$apply();
	        }

			function mouseup() {
				$document.unbind('mousemove', mousemove);
				$document.unbind('mouseup', mouseup);
			}

			$element.on('mousedown', function(event) {
				event.preventDefault();

				$document.on('mousemove', mousemove);
				$document.on('mouseup', mouseup);
			});

			// Adjust DOM node sizes based on palette size model value
	        $scope.$watch(function() {
	        	return $scope.flo.paletteSize;
	        }, function(newValue) {
	        	resize(newValue);
	        });
	        
	        if ($scope.flo.paletteSize) {
	        	resize($scope.flo.paletteSize);
	        }
	    };
	});
	
	app.directive('floEditor', function() {
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {
				if (attrs.metamodelServiceName) {
					scope.metamodelServiceName = attrs.metamodelServiceName;
				}

				if (attrs.renderServiceName) {
					scope.renderServiceName = attrs.renderServiceName;
				}

				if (attrs.editorServiceName) {
					scope.editorServiceName = attrs.editorServiceName;
				}

				if (attrs.paletteSize) {
					scope.flo.paletteSize = Number(attrs.paletteSize);
				}

				if (attrs.paperPadding) {
					scope.paperPadding = Number(attrs.paperPadding);
				}

				scope.init(element.context, attrs);
				element.find('#paper').bind('keydown', function(e) {
					if (e.which === 8 || e.which === 46) {
						if (!scope.flo.readOnly() /*&& scope.flo.getSelection()*/) {
							scope.flo.deleteSelectedNode();
							e.preventDefault();							
						}
					}						
				});
			},
			controller: require('editor-manager'),
			controllerAs: 'floModel',
			transclude: true,
			template:
					'<ng-transclude></ng-transclude>' +
					'<div id="flow-view" class="flow-view" style="position:relative;">' +
						'<div id="canvas" class="canvas" style="position:relative; display: block; width: 100%; height: 100%;">' +
							'<div id="palette-container" class="palette-container" ng-if="!flo.noPalette" style="overflow:hidden;">' +
								'<flo-palette></flo-palette>' +
							'</div>' +
							'<div id="sidebar-resizer" ng-if="!flo.noPalette"' + 
								'resizer="vertical"' + 
						  		'resizer-width="6"' + 
						  		'resizer-left="#palette-container"' + 
						  		'resizer-right="#paper-container">' +
						  	'</div>' +
							
		 					'<div id="paper-container">' +
								'<div id="paper" class="paper" tabindex="0" style="overflow: hidden; position: absolute; display: block; height:100%; width:100%; overflow:auto;"></div>' +
								'<span class="canvas-controls-container" ng-if="canvasControls">' +
									'<table ng-if="canvasControls.zoom" class="canvas-control zoom-canvas-control"><tbody><tr>' +
										'<td><input class="zoom-canvas-input canvas-control zoom-canvas-control" type="text" data-inline="true" ng-model="flo.zoomPercent" ng-model-options="{ getterSetter: true, updateOn: \'blur change\' }" size="3"></input>' +
										'<label class="canvas-control zoom-canvas-label">%</label></td>' +
										'<td><input type="range" data-inline="true" ng-model="flo.zoomPercent" ng-model-options="{ getterSetter: true }" step="{{flo.getZoomStep()}}" max="{{flo.getMaxZoom()}}" min="{{flo.getMinZoom()}}" data-type="range" name="range" class="canvas-control zoom-canvas-control"></input></td>' +
									'</tr></tbody></table>' +
								'</span>' +
								'<div id="properties" class="properties" style="position:absolute; bottom:0; width:100%; overflow:auto;"></div>' +
							'</div>' +
						'</div>' +
						'<div id="hook"></div>' +
						'<div id="dialogs"></div>' +
					'</div>' 
		};
	});
	
	app.factory('MetamodelUtils', ['$q', function($q) {
		
		return {

			/**
			 * Return the metadata for a particular palette entry in a particular group.
			 * @param {String} name - name of the palette entry
			 * @param {string} group - group in which the palette entry should exist (e.g. sinks)
			 * @return {{name:string,group:string,unresolved:Boolean}}
			 */
			getMetadata: function(metamodel, name, group) {
				if (name && group && metamodel[group][name]) {
					return metamodel[group][name];
				} else {
					return {
						name: name,
						group: group,
						unresolved: true,
						get: function() {
							var deferred = $q.defer();
							deferred.resolve();
							return deferred.promise;
						}
					};
				}
			},

			matchGroup: function(metamodel, type, incoming, outgoing) {
				incoming = typeof incoming === 'number' ? incoming : 0;
				outgoing = typeof outgoing === 'number' ? outgoing : 0;
				var matches = [];
				var i;
				if (type) {
					for (i in metamodel) {
						if (metamodel[i][type]) {
							matches.push(metamodel[i][type]);
						}
					}
				}
				var group;
				var score = Number.MIN_VALUE;
				for (i = 0; i < matches.length; i++) {
					var constraints = matches[i].constraints;
					if (constraints) {
						var failedConstraintsNumber = 0;
						if (typeof constraints.maxOutgoingLinksNumber === 'number' && constraints.maxOutgoingLinksNumber < outgoing) {
							failedConstraintsNumber++;
						}
						if (typeof constraints.minOutgoingLinksNumber === 'number' && constraints.minOutgoingLinksNumber > outgoing) {
							failedConstraintsNumber++;
						}
						if (typeof constraints.maxIncomingLinksNumber === 'number' && constraints.maxIncomingLinksNumber < incoming) {
							failedConstraintsNumber++;
						}
						if (typeof constraints.minIncomingLinksNumber === 'number' && constraints.minIncomingLinksNumber > incoming) {
							failedConstraintsNumber++;
						}

						if (failedConstraintsNumber === 0) {
							return matches[i].group;
						} else if (failedConstraintsNumber > score) {
							score = failedConstraintsNumber;
							group = matches[i].group;
						}
					} else {
						return matches[i].group;
					}
				}
				return group;
			}
		};

	}]);
	
	return app;

});
