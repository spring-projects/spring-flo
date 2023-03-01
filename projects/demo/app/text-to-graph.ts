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

import { Flo } from 'spring-flo';
import { dia } from 'jointjs';


/**
 * Convert a text representation to a graph.
 *
 * @author Alex Boyko
 * @author Andy Clement
 */
class TextToGraphConverter {

  constructor(private flo : Flo.EditorContext, private metamodel : Map<string, Map<string, Flo.ElementMetadata>>) {

  }

  matchGroup(name : string, incoming : number, outgoing : number) : string {
    let score = Number.MIN_VALUE;
    let group : string;
    Array.from(this.metamodel.keys()).filter(group => this.metamodel.get(group).has(name)).map(group => this.metamodel.get(group).get(name)).find(match => {
      let failedConstraintsNumber = 0;
      if (match.group === 'source') {
        if (incoming > 0) {
          failedConstraintsNumber++;
        }
        if (outgoing > 1) {
          failedConstraintsNumber++;
        }
      } else if (match.group === 'sink') {
        if (incoming > 1) {
          failedConstraintsNumber++;
        }
        if (outgoing > 0) {
          failedConstraintsNumber++;
        }
      } else if (match.group === 'processor') {
        if (incoming > 1) {
          failedConstraintsNumber++;
        }
        if (outgoing > 1) {
          failedConstraintsNumber++;
        }
      }
      if (failedConstraintsNumber < score) {
        score = failedConstraintsNumber;
        group = match.group;
      }
      return failedConstraintsNumber === 0;
    });
    return group;
  }

  convertToGraph(input : string) {
    this.flo.getGraph().clear();

    // input is a string like this (3 nodes: foo, goo and hoo):   foo --a=b --c=d > goo --d=e --f=g>hoo
    let trimmed = input.trim();
    if (trimmed.length===0) {
      return;
    }

    trimmed.split('\n').forEach(line => {
      let lastNode : dia.Element;
      line.trim().split('>').map(e => e.trim()).forEach(element => {
        let startOfProps = element.indexOf(' ');
        let name = element.trim();
        let properties = new Map<string, any>();
        if (startOfProps !== -1) {
          name = element.substring(0,startOfProps);
          element.substring(startOfProps+1).trim().split(' ').map(pv => pv.trim()).filter(pv => pv.length).forEach(pv => {
            var equalsIndex = pv.indexOf('=');
            // The 2 skips the '--'
            let key = pv.substring(2,equalsIndex);
            let value = pv.substring(equalsIndex+1);
            properties.set(key, value);
          });
        }
        let group = this.matchGroup(name, 0, 0);
        let newNode = this.flo.createNode(Flo.getMetadata(this.metamodel,name,group),properties,{x:0,y:0});
        newNode.attr('.label/text',name);
        if (lastNode) {
          let sourceView = this.flo.getPaper().findViewByModel(lastNode);
          let sourceMagnet = Flo.findMagnetByClass(sourceView, '.output-port');
          let sourceEnd : Flo.LinkEnd = {
            id: lastNode.id,
            selector: sourceView.getSelector(sourceMagnet, undefined),
          };
          if (sourceMagnet.getAttribute('port')) {
            sourceEnd.port = sourceMagnet.getAttribute('port');
          }
          let targetView = this.flo.getPaper().findViewByModel(newNode);
          let targetMagnet = Flo.findMagnetByClass(targetView, '.input-port');
          let targetEnd : Flo.LinkEnd = {
            id: newNode.id,
            selector: targetView.getSelector(targetMagnet, undefined),
          };
          if (targetMagnet.getAttribute('port')) {
            targetEnd.port = targetMagnet.getAttribute('port');
          }
          this.flo.createLink(sourceEnd, targetEnd);
        }
        lastNode = newNode;
      })
    });
  }

}

export function convertTextToGraph(flo : Flo.EditorContext, metamodel : Map<string, Map<string, Flo.ElementMetadata>>, input : string) {
  return new TextToGraphConverter(flo, metamodel).convertToGraph(input);
}
