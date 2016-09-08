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
define(function () {
    'use strict';

    return [function () {

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
            controller: require('controllers/graph-editor'),
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
        
    }];
});