/*
 * Copyright 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(['joint', 'angular'], function (joint) {
	'use strict';
    
	console.log('RUNNING SPEC TEST!');
	
	describe('Joint JS Graph', function () {
		var graph;
		
		beforeEach(function() {
			graph = new joint.dia.Graph();			
			var rect = new joint.shapes.basic.Rect({
			    position: { x: 100, y: 30 },
			    size: { width: 100, height: 30 },
			    attrs: { rect: { fill: 'blue' }, text: { text: 'my box', fill: 'white' } }
			});
			var rect2 = rect.clone();
			rect2.translate(300);
			var link = new joint.dia.Link({
			    source: { id: rect.id },
			    target: { id: rect2.id }
			});
			graph.addCells([rect, rect2, link]);
		});
		
		afterEach(function() {
			if (graph) {
				graph.clear();
			}
		});
		
		it('create element on a graph', function () {
			expect(graph.getElements().length).toEqual(2);
		});
		
		it('create link on a graph', function () {
			expect(graph.getLinks().length).toEqual(1);
		});
		
	});
	
});
