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
    
	var angular = require('angular');
	require('angularMocks');
	require('metamodelService');
	require('editor-service');
	require('render-service');
	require('flo');
	require('text');

	var data = JSON.parse(require('text!../resources/metamodel.json'));
	var domElement;
	
	var groupsData = {};
	data.forEach(function(e) {
		if (!groupsData[e.group]) {
			groupsData[e.group] = {};
		}
		groupsData[e.group][e.name] = e;
	});

	describe('Unit testing Flo editor', function() {
		var $compile, $httpBackend, $scope, $http, $timeout, StandaloneMetamodel, MetamodelUtils;

		// Load the Flo module, which contains the directive
		beforeEach(angular.mock.module('spring.flo'));
		
		// Store references to $rootScope and $compile
		// so they are available to all tests in this describe block
		beforeEach(function(done) {
			inject(function($rootScope, $controller, _$http_, _$compile_, _$httpBackend_, _$timeout_, _StandaloneMetamodel_, _MetamodelUtils_) {
				$compile = _$compile_;
			    $scope = $rootScope.$new();
			    $http = _$http_;
			    $httpBackend = _$httpBackend_;
			    $timeout = _$timeout_;
			    StandaloneMetamodel = _StandaloneMetamodel_;
				MetamodelUtils = _MetamodelUtils_;
			    
				// Set up the mock http service responses
				$httpBackend.when('GET', '/parse?text=').respond(200, {format: 'xd', nodes: [], links: []});
				$httpBackend.when('GET', '/metamodel').respond(200, data);
	
				// Setup initial scope.
				$scope.flo = {};
				$scope.definition = {};
				$scope.editorServiceName = 'sample-editor-service';
				$scope.renderServiceName = 'SampleRenderService';
				$scope.metamodelServiceName = 'StandaloneMetamodel';
				
				// Compile a piece of HTML containing the directive
				domElement = $compile('<div><flo-editor></flo-editor></div>')($scope);
				angular.element(document.body).append(domElement);
				$scope.$digest();
			    $scope.$apply();
				$httpBackend.flush();
			    setTimeout(function() {
			    	done();
			    }, 1000);
			});
		});
		
		afterEach(function() {
			$scope.flo.clearGraph();
			domElement.remove();
		});
		
		it('Replaces the element with the appropriate content', function() {		    
		    // Check that the compiled element contains the templated content		    
		    expect(domElement.find('#paper').length).toBe(1);
		    expect(domElement.find('#palette-paper').length).toBe(1);
		    expect(domElement.find('#properties').length).toBe(1);		    
		});

		it('Verify palette contents', function() {
		    var paletteGraph = $scope.flo._paletteGraph();
		    
		    var groups = {};
		    var elementCounter = {};
		    paletteGraph.getElements().forEach(function(e) {
		    	if (e.attr('metadata')) {
		    		var group = e.attr('metadata/group');
		    		var name = e.attr('metadata/name');
		    		if (group) {
		    			if (!elementCounter[group]) {
		    				elementCounter[group] = {};
		    			}
		    			elementCounter[group][name] = e;
		    		}
		    	} else if (e.attr('text/text')) {
		    		groups[e.attr('text/text')] = e;
		    	}
		    });
		    
		    expect(Object.keys(groups).sort()).toEqual(Object.keys(groupsData).sort());
		    expect(Object.keys(elementCounter).sort()).toEqual(Object.keys(groupsData).sort());
		    Object.keys(elementCounter).forEach(function(group) {
		    	var current = Object.keys(elementCounter[group]).sort();
		    	var expected = Object.keys(groupsData[group]).sort();
		    	expect(current).toEqual(expected);
		    });
		});
		
		it('Create module', function(done) {
			StandaloneMetamodel.load().then(function(metamodel) {
				var node = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'http', 'source'));
				var view = $scope.flo.getPaper().findViewByModel(node);
				expect(view).toBeDefined();
				expect(node.attr('.label/text')).toBe('http');
				expect($scope.flo.zoomPercent()).toBe(100);
				var bbox = view.getBBox();
				expect(node.get('position')).toEqual({x: 0, y: 0});
				expect(node.get('size')).toEqual({width: 120, height: 35});
				expect(bbox.x).toBe(0);
				expect(bbox.y).toBeDefined();
				expect(bbox.width).toBe(124);
				// Account for the label above.
				expect(bbox.height).toBe(35);
				done();
			});
			$timeout.flush();
		});
		
		it('Test link creation', function(done) {
			StandaloneMetamodel.load().then(function(metamodel) {
				var http = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'http', 'source'));
				var log = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'log', 'sink'));
                $scope.flo.getPaper().findViewByModel(http); // httpView
				$scope.flo.getPaper().findViewByModel(log); // logView
				$scope.flo.createLink({
					'id': http.get('id'),
					'selector': '.output'
				}, {
					'id': log.get('id'),
					'selector': '.input'
				});
				expect($scope.flo.getGraph().getLinks().length).toBe(1);
				var link = $scope.flo.getGraph().getLinks()[0];
				expect($scope.flo.getPaper().findViewByModel(link)).toBeDefined();
				expect(link.get('source').id).toEqual(http.get('id'));
				expect(link.get('target').id).toEqual(log.get('id'));
				
				// Test layout
				$scope.flo.performLayout();
				expect(http.get('position').y).toEqual(log.get('position').y);
				expect(http.get('position').x + http.get('size').width + 20).toBeLessThan(log.get('position').x);
				done();
			});
			$timeout.flush();
		});
	
		it('Test basic layout of disoconnected elements', function(done) {
			StandaloneMetamodel.load().then(function(metamodel) {
				var http = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'http', 'source'));
				var log = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'log', 'sink'));
				
				// Test layout
				$scope.flo.performLayout();
				expect(http.get('position').x).toEqual(log.get('position').x);
				expect(http.get('position').y + http.get('size').height + 20).toBeLessThan(log.get('position').y);
				done();
			});
			$timeout.flush();
		});
		
		it('Test sync text stream', function(done) {
			StandaloneMetamodel.load().then(function(metamodel) {
				var mail = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'mail', 'source'));
				var log = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'log', 'sink'));
				$scope.flo.createLink({
					'id': mail.get('id'),
					'selector': '.output'
				}, {
					'id': log.get('id'),
					'selector': '.input'
				});
				/*return*/ $scope.flo.updateTextRepresentation();
//			}).then(function() {
				expect($scope.definition.text).toEqual('mail | log');
				done();
			});
			$timeout.flush();
		});
		
		it('Test deferred automated text stream sync', function(done) {
			StandaloneMetamodel.load().then(function(metamodel) {
				var mail = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'mail', 'source'));
				var log = $scope.flo.createNode(MetamodelUtils.getMetadata(metamodel, 'log', 'sink'));
				$scope.flo.createLink({
					'id': mail.get('id'),
					'selector': '.output'
				}, {
					'id': log.get('id'),
					'selector': '.input'
				});
				expect($scope.definition.text).toEqual('');
				setTimeout(function() {
					var flush = true;
					while (flush) {
						try {
							$timeout.flush();
						} catch (error) {
							flush = false;
						}
					}
					expect($scope.definition.text).toEqual('mail | log');
					done();
				}, 500);
			});
			$timeout.flush();
		});
		
	});
	
});
