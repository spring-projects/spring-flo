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
 * Code-editor directive. Connects Code-Mirror editor to angular.
 * Supports passing language and code text via 2-way scope binding variables or via DOM node attributes.
 * There is support for text transformation functions, i.e. encode/decode text before modifying the value
 *
 * Note: instead of language and code text it's likely the code will be changed to have getters and setters
 * for the code text which will avoid having encode and decode functions.
 *
 * This editor is typically used for properties where the property value is a script/code like value and
 * benefit from the use of a real editor that can provide features like syntax highlighting and mark
 * errors/warnings.
 */
define(function (require) {
    'use strict';

    return ['$scope', function ($scope) {

        var angular = require('angular');
        var CodeMirror = require('codemirror');

        require('codemirror/mode/meta');
        require('codemirror/addon/lint/lint');
        require('codemirror/addon/hint/show-hint');
        require('codemirror/addon/mode/loadmode');
        require('codemirror/addon/edit/matchbrackets');
        require('codemirror/addon/edit/closebrackets');
        require('codemirror/addon/display/placeholder');
        require('codemirror/addon/scroll/annotatescrollbar');
        require('codemirror/addon/scroll/simplescrollbars');


        // languages
        require('codemirror/mode/groovy/groovy');
        require('codemirror/mode/javascript/javascript');
        require('codemirror/mode/python/python');
        require('codemirror/mode/ruby/ruby');
        require('codemirror/mode/clike/clike');

        // Lint support
        require('jshint');
        require('codemirror/addon/lint/javascript-lint');

        CodeMirror.modeURL = 'codemirror/mode/%N/%N';


        var defaultText = '';
        var defaultLanguage = 'Plain Text';

        var doc;
        var errorRuler;
        var warningRuler;

        var LINT_MAP = {
            'javascript': {
                onUpdateLinting: function (annotations) {
                    var warnings = [];
                    var errors = [];
                    if ($scope.overviewRuler) {
                        if (angular.isArray(annotations)) {
                            annotations.forEach(function (a) {
                                if (a.to && a.from && a.from.line >= 0 && a.from.ch >= 0 && a.to.line >= a.from.line && a.from.ch >= 0) {
                                    if (a.severity === 'error') {
                                        errors.push(a);
                                    } else if (a.severity === 'warning') {
                                        warnings.push(a);
                                    }
                                }
                            });
                        }
                    }
                    warningRuler.update(warnings);
                    errorRuler.update(errors);
                }
            }
        };

        $scope.init = function (textarea, attrs) {

            doc = CodeMirror.fromTextArea(textarea, {
                gutters: ['CodeMirror-lint-markers'],
                lineNumbers: true,
                lineWrapping: true,
                matchBrackets: true,
                autoCloseBrackets: true
            });

            if ($scope.scrollbarStyle) {
                doc.setOption('scrollbarStyle', $scope.scrollbarStyle);
            }

            // CodeMirror would set 'placeholder` value at construction time based on the string value of placeholder attribute in the DOM
            // Thus, set the correct placeholder value in case value is angular expression.
            if (angular.isString($scope.placeholder)) {
                doc.setOption('placeholder', $scope.placeholder);
            }

            warningRuler = doc.annotateScrollbar('CodeMirror-vertical-ruler-warning');
            errorRuler = doc.annotateScrollbar('CodeMirror-vertical-ruler-error');

            function getLintOption(modeName) {
                var lint = LINT_MAP[modeName.toLowerCase()];
                return lint ? lint : false;
            }

            function updateScopeText() {
                var text = doc.getValue();
                var result;
                var encodeFunc = $scope.encodeFunction();
                if (angular.isFunction(encodeFunc)) {
                    result = encodeFunc.call(null, text);
                }
                if (typeof result === 'string') {
                    text = result;
                }
                if (text === defaultText) {
                    $scope.text = undefined;
                } else {
                    $scope.text = text;
                }
                $scope.$apply();
            }

            function updateMode() {
                var language = $scope.language && typeof $scope.language === 'string' ? $scope.language : defaultLanguage;
                if (language) {
                    var info = CodeMirror.findModeByName(language);

                    // Set proper editor mode
                    doc.setOption('mode', info.mime);
                    CodeMirror.autoLoadMode(doc, info.mode);

                    // Set proper Lint mode
                    doc.setOption('lint', getLintOption(info.name));
                }
            }

            if (attrs.defaultText) {
                defaultText = attrs.defaultText;
            }

            if (attrs.defaultLanguage) {
                defaultLanguage = attrs.defaultLanguage.toLowerCase();
            }

            updateMode();

            var text = $scope.text ? $scope.text : defaultText;
            var result;
            var decodeFunc = $scope.decodeFunction();
            if (angular.isFunction(decodeFunc)) {
                result = decodeFunc.call(this, text);
            }
            if (typeof result === 'string') {
                text = result;
            }
            doc.setValue(text);

            doc.on('changes', function () {
                updateScopeText();
            });
            doc.on('blur', function () {
                updateScopeText();
            });
            $scope.$watch('language', function () {
                updateMode();
            });
        };

    }];
});