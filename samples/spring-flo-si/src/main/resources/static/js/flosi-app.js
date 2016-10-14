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
 * @author Alex Boyko
 * @author Andy Clement
 */
define(function(require) {
	'use strict';
	var angular = require('angular');
	require('flo');
	var app = angular.module('floSiApp', [ 'spring.flo' ]);
	app.factory('SampleMetamodelService', require('metamodel-service'));
	app.factory('SampleRenderService', require('render-service'));
	app.factory('SampleEditorService', require('editor-service'));
	
    app.controller('SiController', ['$scope', '$http', 'SampleMetamodelService', function($scope, $http, metamodelService) {
      $scope.endpoint = 'http://localhost:8080/integration';
      $scope.labelpath = "stats.sendcount";
      $scope.refreshrate=0;

      var refreshTimer;

      $scope.load = function(endpoint) {
    	console.log("Loading from endpoint: '"+endpoint+"'");
    	$scope.endpoint = endpoint;
    	// Load the graph from the endpoint
    	$http.get(endpoint, { }).success(function(json) {
    		// console.log("JSON is "+json);
    		// console.log("it is "+$('#endpoint').val());
    		// $('#flow-definition').val('foo');
    		$scope.definition.text = JSON.stringify(json);
    		$scope.flo.updateGraphRepresentation();
    	}).error(function(err) {
	    	console.log(err);
	    });    	
      };

        $scope.updateRefreshRate = function(newRefreshRate) {
        	console.log("Update refresh rate: '"+newRefreshRate+"'");
        	$scope.refreshrate=newRefreshRate;
        	if (refreshTimer) {
        		clearTimeout(refreshTimer);
        	}
        	if (newRefreshRate >0) {
        		if (newRefreshRate < 250) {
        			$scope.refreshrate = 250;
        		} 
        		var refresher = function() {
        			refresh();
        			refreshTimer = setTimeout(function() { refresher() }, $scope.refreshrate);
        		}
        		refreshTimer = setTimeout(refresher, $scope.refreshrate);
        	} else {
        		$scope.refreshrate=0;
        	}
        }

        function refresh() {
        	$http.get($scope.endpoint, { }).success(function(json) {
        		metamodelService.updateGraphLabels($scope.flo, JSON.stringify(json), $scope.labelpath);
	      	}).error(function(err) {
	  	    	console.log(err);
	  	    });    	        	
        }
        
        $scope.updateLabelPath = function(newLabelPath) {
        	console.log("Update label path: '"+newLabelPath+"'");
        	$scope.labelpath = newLabelPath;
        	// Update the graph from the endpoint
        	$http.get($scope.endpoint, { }).success(function(json) {
        		metamodelService.updateGraphLabels($scope.flo, JSON.stringify(json), newLabelPath);
	      	}).error(function(err) {
	  	    	console.log(err);
	  	    });    	
        };
        
      }]).directive('ngEnter', function() {
          return function(scope, element, attrs) {
              element.bind("keydown keypress", function(event) {
                  if(event.which === 13) {
                          scope.$apply(function(){
                                  scope.$eval(attrs.ngEnter);
                          });
                          event.preventDefault();
                  }
              });
          };
  });
	return app;
});
