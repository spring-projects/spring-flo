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

    return ['$interpolate', function ($interpolate) {
        return {
            restrict: 'A',
            scope: true,
            controller: require('controllers/dsl-editor'),
            link: function (scope, element, attrs) {
                if (attrs.contentAssistServiceName) {
                    scope.contentAssistServiceName = attrs.contentAssistServiceName;
                }
                if (attrs.placeholder) {
                    scope.placeholder = $interpolate(attrs.placeholder)(scope);
                }
                if (attrs.scrollbarStyle) {
                    scope.scrollbarStyle = $interpolate(attrs.scrollbarStyle)(scope);
                }
                if (attrs.overviewRuler) {
                    scope.overviewRuler = $interpolate(attrs.overviewRuler)(scope);
                }
                scope.init(element.context);
            }
        };
    }];
});