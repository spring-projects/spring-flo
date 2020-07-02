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

import { dia } from 'jointjs';

/**
 * Convert a graph to a text representation.
 *
 * @author Alex Boyko
 * @author Andy Clement
 */
class GraphToTextConverter {

  // Graph
  private g : dia.Graph;

  // Number of Links left to visit
  private numberOfLinksToVisit : number;

  // Number of nodes left to visit
  private numberOfNodesToVisit : number;

  // Map of links left to visit indexed by id
  private linksToVisit : Set<string>;

  // Map of nodes left to visit indexed by id
  private nodesToVisit : Set<string>;

  // Map of nodes incoming non-visited links degrees index by node id
  private nodesInDegrees : Map<string, number>;

  constructor(graph : dia.Graph) {
    this.numberOfLinksToVisit = 0;
    this.numberOfNodesToVisit = 0;
    this.linksToVisit = new Set<string>();
    this.nodesToVisit = new Set<string>();
    this.nodesInDegrees = new Map<string, number>();
    this.g = graph;
    graph.getElements().forEach((element : dia.Element) => {
      if (element.get('metadata')?.name) {
        this.nodesToVisit.add(element.get('id'));
        let indegree = 0;
        this.g.getConnectedLinks(element, {inbound: true}).forEach(link => {
          if (link.get('source') && link.get('source').id && this.g.getCell(link.get('source').id) &&
            this.g.getCell(link.get('source').id).get('metadata')?.name) {
            this.linksToVisit.add(link.get('id'));
            this.numberOfLinksToVisit++;
            indegree++;
          }
        });
        this.nodesInDegrees.set(element.get('id'), indegree);
        this.numberOfNodesToVisit++;
      }
    });
  }

  // Priority:
  // 1. find links whose source has no other links pointing at it
  // 2. find links whose source has already been processed (not currently needed in sample DSL since
  //    can't create graphs like that due to metamodel constraints)
  // 3. find remaining links
  private nextLink() : dia.Link {
    let indegree : number = Number.MAX_VALUE;
    let currentBest : dia.Link;
    for (let id of Array.from(this.linksToVisit)) {
      let link = <dia.Link> this.g.getCell(id);
      let source = this.g.getCell(link.get('source').id);
      let currentInDegree = this.nodesInDegrees.get(source.get('id'));
      if (currentInDegree === 0) {
        this.visitLink(link);
        return link;
      } else if (indegree > currentInDegree) {
        indegree = currentInDegree;
        currentBest = link;
      }
    }
    if (currentBest) {
      this.visitLink(currentBest);
    }
    return currentBest;
  }

  private visitNode(n : dia.Element) : void {
    this.nodesToVisit.delete(n.get('id'));
    this.numberOfNodesToVisit--;
  }

  private visitLink(e : dia.Link) : void {
    this.linksToVisit.delete(e.get('id'));
    let id = e.get('target').id;
    this.nodesInDegrees.set(id, this.nodesInDegrees.get(id) - 1);
    this.numberOfLinksToVisit--;
  }

  /**
   * Starts at a link and proceeds down a chain. Converts each node to
   * text and then joins them with a ' > '.
   */
  private chainToText(link : dia.Link) : string {
    let text = '';
    let source = <dia.Element> this.g.getCell(link.get('source').id);
    text += this.nodeToText(source);
    while (link) {
      let target = <dia.Element> this.g.getCell(link.get('target').id);
      text += ' > ';
      text += this.nodeToText(target);

      // Find next not visited link to follow
      link = null;
      let outgoingLinks = this.g.getConnectedLinks(target, {outbound: true});
      for (let i = 0; i < outgoingLinks.length && !link; i++) {
        if (this.linksToVisit.has(outgoingLinks[i].get('id'))) {
          source = target;
          link = outgoingLinks[i];
          this.visitLink(link);
        }
      }
    }
    return text;
  }

  /**
   * Very basic format. From a node to the text:
   * "name --key=value --key=value"
   */
  private nodeToText(element : dia.Element) {
    let text = '';
    let props = element.attr('props');
    if (!element) {
      return;
    }
    text += element.get('metadata')?.name;
    if (props) {
      Object.keys(props).forEach(propertyName => {
        text += ' --' + propertyName + '=' + props[propertyName];
      });
    }
    this.visitNode(element);
    return text;
  }

  private appendChainText(text : string, chainText : string) {
    if (chainText) {
      if (text) {
        text += '\n';
      }
      text += chainText;
    }
    return text;
  }

  public convert() : string {
    let text = '';
    let chainText : string;
    let id : string;

    while (this.numberOfLinksToVisit) {
      chainText = this.chainToText(this.nextLink());
      text = this.appendChainText(text, chainText);
    }
    // Visit all disconnected nodes
    this.nodesToVisit.forEach(id => {
      chainText = this.nodeToText(<dia.Element> this.g.getCell(id));
      text = this.appendChainText(text, chainText);
    });
    return text;
  }

}

export function convertGraphToText(g : dia.Graph) : string {
  return new GraphToTextConverter(g).convert();
}
