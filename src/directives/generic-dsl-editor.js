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

    var angular = require('angular');
    var _ = require('underscore');

    return ['$injector', function($injector) {

        var CodeMirror = require('codemirror');

        var doc;
        
        var contentAssistService;

        var lintService;

        var debounce;

        require('codemirror/addon/lint/lint');
        require('codemirror/addon/hint/show-hint');
        require('codemirror/addon/display/placeholder');

        return {
            restrict: 'A',
            scope: {
                dsl: '='
            },
            link: function (scope, element, attrs) {

                if (attrs.contentAssistServiceName) {
                    contentAssistService = $injector.get(attrs.contentAssistServiceName);
                }

                if (attrs.lintServiceName) {
                    lintService = $injector.get(attrs.lintServiceName);
                }

                if (attrs.debounce) {
                    debounce = parseInt(attrs.debounce);
                }

                doc = CodeMirror.fromTextArea(element.context, {
                    value: scope.dsl,
                    gutters: ['CodeMirror-lint-markers'],
                    lint: lintService && angular.isFunction(lintService.getAnnotations) ? {
                        async: true,
                        getAnnotations: lintService.getAnnotations
                    } : undefined,
                    extraKeys: {'Ctrl-Space': 'autocomplete'},
                    hintOptions: {
                        async: 'true',
                        hint: contentAssistService && angular.isFunction(contentAssistService.complete) ? contentAssistService.complete : undefined
                    },
                    lineNumbers: attrs.lineNumbers && attrs.lineNumbers.toLowerCase() === 'true',
                    lineWrapping: attrs.lineWrapping && attrs.lineWrapping.toLowerCase() === 'true'
                });
                var dslChangedHandler = function () {
                    scope.$apply(function() {
                        scope.dsl = doc.getValue();
                    });
                };
                doc.on('change', debounce ? _.debounce(dslChangedHandler, debounce) : dslChangedHandler);
                scope.$watch('dsl', function (newValue) {
                    if (newValue!==doc.getValue()) {
                        var cursorPosition = doc.getCursor();
                        doc.setValue(newValue ? newValue : '');
                        doc.setCursor(cursorPosition);
                    }
                });
            }
        };
    }];
});