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

define(function() {
	'use strict';

	/**
	 * Graph representation of stream(s)/module(s).
	 * @type {joint.dia.Graph}
	 */
	var g;
	
	/**
	 * Number of Links left to visit
	 * @type {number}
	 */
	var numberOfLinksToVisit;
	
	/**
	 * Number of nodes left to visit
	 * @type {number}
	 */
	var numberOfNodesToVisit;
	
	/**
	 * Links left to visit indexed by id
	 * @type {Object.<string,{joint.dia.Link}>}
	 */
	var linksToVisit;
	
	/**
	 * Nodes left to visit indexed by id
	 * @type {Object.<string,{joint.dia.Element}>}
	 */
	var nodesToVisit;
	
	/**
	 * Nodes incoming non-visited links degrees index by node id
	 * @type {Object.<string,number>}
	 */
	var nodesInDegrees;
	
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
    
	// Priority:
	// 1. find links whose source has no other links pointing at it
	// 2. find links whose source has already been processed
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
	
	function init(graph) {
		numberOfLinksToVisit = 0;
		numberOfNodesToVisit = 0;
		linksToVisit = {};
		nodesToVisit = {};
		nodesInDegrees = {};
		g = graph;
		g.getElements().forEach(function(element) {
			if (element.attr('metadata/name')) {
				nodesToVisit[element.get('id')] = element;
				var indegree = 0;
				g.getConnectedLinks(element, {inbound: true}).forEach(function(link) {
					if (link.get('source') && link.get('source').id && g.getCell(link.get('source').id) && g.getCell(link.get('source').id).attr('metadata/name')) {
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
	
	function isChannel(e) {
		return e && (e.attr('metadata/name') === 'tap' || e.attr('metadata/name') === 'named-channel');
	}
	
	function isJobDefinition(e) {
		return e && e.attr('metadata/group') === 'job definition';
	}
    
	function node2text(element, first) {
		var text = '';
		var props = element.attr('props');
		if (!element) {
			return;
		}
		
		if (first) {
			if (element.attr('stream-name')) {
				text += element.attr('stream-name') + '=';
			}
		}
		if ('job definition' === element.attr('metadata/group')) {
			// expressed as a queue
			if (first) {
				text += 'tap:job:' + element.attr('metadata/name');
				if (props) {
					Object.keys(props).forEach(function(propertyName) {
						var prop = props[propertyName];
						if (prop && prop.length !== 0) {
							text += '.' + props[propertyName];
						}
					});
				}
			} else {
				text += 'queue:job:' + element.attr('metadata/name');
			}
		} else if ('tap' === element.attr('metadata/name') || 'named-channel' === element.attr('metadata/name')) {
//			if ('tap' === element.attr('metadata/name')) {
//				text += 'tap ';
//			}
			if (props.channel) {
				text += props.channel;
			}
		} else {
			if (element.attr('.label/text') && element.attr('.label/text') !== element.attr('metadata/name')) {
				text += element.attr('.label/text') + ': ';
			}
			text += element.attr('metadata/name');
			if (props) {
				Object.keys(props).forEach(function(propertyName) {
					text += ' --' + propertyName + '=' + props[propertyName];
				});
			}
		}
		visit(element);
		return text;
	}
	
	function stream2text(link) {
		var text = '';
		var source = g.getCell(link.get('source').id);
		text += node2text(source, true);
		while (link) {
			var target = g.getCell(link.get('target').id);
			text += (isChannel(source) || isChannel(target) ||
					isJobDefinition(source) || isJobDefinition(target)) ? ' > '
							: ' | ';
			text += node2text(target, false);
			
			/*
			 * Find next not visited link to follow
			 */
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
	
	function appendStreamText(text, stream) {
		if (stream) {
			if (text) {
				text += '\n';
			}
			text += stream;
		}
		return text;
	}
	
	/**
	 * Translates the stream(s)/module(s) definition(s) from graph form into text form
	 * @param {joint.dia.Graph} g Graph form of stream(s) and or module(s)
	 * @return {string} Textual form
	 */
	return function(g) {
		var text = '';
		var streamText;
		var node;
		var id;

		init(g);		
		/*
		 * Visit all connected nodes via links
		 */
		while (numberOfLinksToVisit) {
			streamText = stream2text(nextLink());
			text = appendStreamText(text, streamText);
		}
		/*
		 * Visit all disconnected nodes
		 */
		for (id in nodesToVisit) {
			node = nodesToVisit[id];
			streamText = node2text(nodesToVisit[id], true);
			if (streamText && isChannel(node)) {
				streamText += ' > ';
			}
			text = appendStreamText(text, streamText);
		}
		return text;
	};
	
});
