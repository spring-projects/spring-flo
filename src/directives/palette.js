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
            scope: true,
            link: function(scope, element, attrs) {
                if (attrs.metamodelServiceName) {
                    scope.metamodelServiceName = attrs.metamodelServiceName;
                }
                scope.init(element.context, attrs);
            },
            controller: require('controllers/palette'),
            controllerAs: 'floPalette',
            template:
                '<div id="palette-filter" class="palette-filter">' +
                    '<input type="text" id="palette-filter-textfield" ng-model="filterText" ng-change="filterTextUpdated()" class="palette-filter-textfield" ng-model-options="{ debounce: 500 }"/>' +
                '</div>' +
                '<div id="palette-paper-container" style="height:calc(100% - 46px); width:100%; overflow:auto;">' +
                    '<div id="palette-paper" class="palette-paper" style="overflow:hidden;"></div>' +
                '</div>'
        };
    }];

});