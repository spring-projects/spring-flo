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
 * Convert a graph to a text representation.
 * 
 * @author Alex Boyko
 * @author Andy Clement
 */
define(function() {
	'use strict';

	// Graph
	var g;
	
	// Number of Links left to visit
	var numberOfLinksToVisit;
	
	// Number of nodes left to visit
	var numberOfNodesToVisit;
	
	// Map of links left to visit indexed by id
	var linksToVisit;
	
	// Map of nodes left to visit indexed by id
	var nodesToVisit;
	
	// Map of nodes incoming non-visited links degrees index by node id
	var nodesInDegrees;
	
	// Priority:
	// 1. find links whose source has no other links pointing at it
	// 2. find links whose source has already been processed (not currently needed in sample DSL since
	//    can't create graphs like that due to metamodel constraints)
	// 3. find remaining links
	function nextLink() {
		var indegree = Number.MAX_INT;
		var currentBest;
		for (var id in linksToVisit) {
			var link = g.getCell(id);
			var source = g.getCell(link.get('source').id);
			var currentInDegree = nodesInDegrees[source.get('id')];
			if (currentInDegree === 0) {
				return visit(link);
			} else if (indegree > currentInDegree) {
				indegree = currentInDegree;
				currentBest = link;
			}
		}
		if (currentBest) {
			return visit(currentBest);
		}
	}
	
	function visit(e) {
		if (e.isLink()) {
			delete linksToVisit[e.get('id')];
			nodesInDegrees[e.get('target').id]--;
			numberOfLinksToVisit--;
		} else {
			delete nodesToVisit[e.get('id')];
			numberOfNodesToVisit--;
		}
		return e;
	}
	
	function init(graph) {
		numberOfLinksToVisit = 0;
		numberOfNodesToVisit = 0;
		linksToVisit = {};
		nodesToVisit = {};
		nodesInDegrees = {};
		g = graph;
		g.getElements().forEach(function(element) {
			if (element.attr('metadata/name')) { // is it a node?
				nodesToVisit[element.get('id')] = element;
				var indegree = 0;
				g.getConnectedLinks(element, {inbound: true}).forEach(function(link) {
					if (link.get('source') && link.get('source').id && g.getCell(link.get('source').id) && 
						g.getCell(link.get('source').id).attr('metadata/name')) {
						linksToVisit[link.get('id')] = link;
						numberOfLinksToVisit++;
						indegree++;
					}
				});
				nodesInDegrees[element.get('id')] = indegree;
				numberOfNodesToVisit++;
			}
		});
	}
	
	/**
	 * Starts at a link and proceeds down a chain. Converts each node to
	 * text and then joins them with a ' > '. 
	 */
	function chainToText(link) {
		var text = '';
		var source = g.getCell(link.get('source').id);
		text += nodeToText(source, true);
		while (link) {
			var target = g.getCell(link.get('target').id);
			text += ' > ';
			text += nodeToText(target, false);
			
			// Find next not visited link to follow
			link = null;
			var outgoingLinks = g.getConnectedLinks(target, {outbound: true});
			for (var i = 0; i < outgoingLinks.length && !link; i++) {
				if (linksToVisit[outgoingLinks[i].get('id')]) {
					source = target;
					link = visit(outgoingLinks[i]);
				}
			}
		}
		return text;
	}
	
	/**
	 * Very basic format. From a node to the text:
	 * "name --key=value --key=value"
	 */
	function nodeToText(element) {
		var text = '';
		var props = element.attr('props');
		if (!element) {
			return;
		}
		text += element.attr('metadata/name');
		if (props) {
			Object.keys(props).forEach(function(propertyName) {
				text += ' --' + propertyName + '=' + props[propertyName];
			});
		}
		visit(element);
		return text;
	}
	
	function appendChainText(text, chainText) {
		if (chainText) {
			if (text) {
				text += '\n';
			}
			text += chainText;
		}
		return text;
	}
	
	// Translate a graph into a basic string
	return function(g) {
		var text = '';
		var chainText;
		var id;
		init(g);
		while (numberOfLinksToVisit) {
			chainText = chainToText(nextLink());
			text = appendChainText(text, chainText);
		}
		// Visit all disconnected nodes
		for (id in nodesToVisit) {
			chainText = nodeToText(nodesToVisit[id], true);
			text = appendChainText(text, chainText);
		}
		return text;
	};
	
});