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

    return ['$document', function($document) {

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

    }];

});