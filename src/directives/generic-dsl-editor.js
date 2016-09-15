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

    var _ = require('underscore');
    var angular = require('angular');

    return [ function() {

        var CodeMirror = require('codemirror');

        var doc;
        
        var debounce;

        require('codemirror/addon/lint/lint');
        require('codemirror/addon/hint/show-hint');
        require('codemirror/addon/display/placeholder');
        require('codemirror/addon/scroll/annotatescrollbar');
        require('codemirror/addon/scroll/simplescrollbars');

        return {
            restrict: 'A',
            scope: {
                dsl: '=',
                hint: '=',
                lint: '=',
                placeholder: '@',
                scrollbarStyle: '@'
            },
            link: function (scope, element, attrs) {

                if (attrs.debounce) {
                    debounce = parseInt(attrs.debounce);
                }

                var options = {
                    value: scope.dsl,
                    gutters: ['CodeMirror-lint-markers'],
                    extraKeys: {'Ctrl-Space': 'autocomplete'},
                    lineNumbers: attrs.lineNumbers && attrs.lineNumbers.toLowerCase() === 'true',
                    lineWrapping: attrs.lineWrapping && attrs.lineWrapping.toLowerCase() === 'true',
                };

                if (scope.scrollbarStyle) {
                    options.scrollbarStyle = scope.scrollbarStyle;
                }

                if (scope.lint) {
                    options.lint = scope.lint;
                }

                if (scope.hint) {
                    options.hintOptions = scope.hint;
                }

                doc = CodeMirror.fromTextArea(element.context, options);

                // CodeMirror would set 'placeholder` value at construction time based on the string value of placeholder attribute in the DOM
                // Thus, set the correct placeholder value in case value is angular expression.
                if (angular.isString(scope.placeholder)) {
                    doc.setOption('placeholder', scope.placeholder);
                }

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

                scope.$watch('hint', function(newValue) {
                    doc.setOption('hintOptions', newValue);
                });

                scope.$watch('lint', function(newValue) {
                    doc.setOption('lint', newValue);
                });
            }
        };
    }];
});