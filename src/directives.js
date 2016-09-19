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
 * Definition of directives
 *
 * @author Alex Boyko
 */
define(function(require) {
    'use strict';

    var angular = require('angular');

    return angular.module('flo.directives', [])
        .directive('resizer', require('directives/resizer'))
        .directive('dslEditor', require('directives/dsl-editor'))
        .directive('codeEditor', require('directives/code-editor'))
        .directive('floPalette', require('directives/palette'))
        .directive('floEditor', require('directives/graph-editor'))
        .directive('genericDslEditor', require('directives/generic-dsl-editor'));
});
