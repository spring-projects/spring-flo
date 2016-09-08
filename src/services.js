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
 * Services
 *
 * @author Alex Boyko
 */
define(['angular'], function (angular) {
    'use strict';

    return angular.module('flo.services', [])
        .factory('MetamodelUtils', ['$q', function ($q) {

            return {

                /**
                 * Return the metadata for a particular palette entry in a particular group.
                 * @param {String} name - name of the palette entry
                 * @param {string} group - group in which the palette entry should exist (e.g. sinks)
                 * @return {{name:string,group:string,unresolved:Boolean}}
                 */
                getMetadata: function (metamodel, name, group) {
                    if (name && group && metamodel[group][name]) {
                        return metamodel[group][name];
                    } else {
                        return {
                            name: name,
                            group: group,
                            unresolved: true,
                            get: function () {
                                var deferred = $q.defer();
                                deferred.resolve();
                                return deferred.promise;
                            }
                        };
                    }
                },

                matchGroup: function (metamodel, type, incoming, outgoing) {
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

});
