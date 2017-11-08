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

import { Flo, Constants } from 'spring-flo';
import { dia } from 'jointjs';

const dagre = require('dagre');

const joint : any = Flo.joint;


const HANDLE_ICON_MAP = new Map<string, string>()
  .set(Constants.REMOVE_HANDLE_TYPE, 'icons/delete.svg')
  .set(Constants.PROPERTIES_HANDLE_TYPE, 'icons/cog.svg');

const DECORATION_ICON_MAP = new Map<string, string>()
  .set(Constants.ERROR_DECORATION_KIND, 'icons/error.svg');

/**
 * @author Alex Boyko
 * @author Andy Clement
 */
export class Renderer implements Flo.Renderer {

    createHandle(kind :string) : dia.Element {
      return new joint.shapes.flo.ErrorDecoration({
        size: {width: 10, height: 10},
        attrs: {
          'image': {
            'xlink:href': HANDLE_ICON_MAP.get(kind)
          }
        }
      });
    }

    createDecoration(kind : string) : dia.Element {
      return new joint.shapes.flo.ErrorDecoration({
        size: {width: 16, height: 16},
        attrs: {
          'image': {
            'xlink:href': DECORATION_ICON_MAP.get(kind)
          }
        }
      });
    }

    createNode(metadata : Flo.ElementMetadata, props : Map<string, any>): dia.Element {
      return new joint.shapes.flo.Node();
    }

    initializeNewNode(node : dia.Element, viewerDescriptor : Flo.ViewerDescriptor) {
      let metadata : Flo.ElementMetadata = node.attr('metadata');
      if (metadata) {
        node.attr('.label/text', node.attr('metadata/name'));
        let group = node.attr('metadata/group');
        if (group === 'source') {
          node.attr('.input-port/display','none');
        }
        if (group === 'sink') {
          node.attr('.output-port/display','none');
        }
      }
    }

    createLink(source : Flo.LinkEnd, target : Flo.LinkEnd, metadata : Flo.ElementMetadata, props : Map<string, any>) : dia.Link {
      return new joint.shapes.flo.Link(joint.util.deepSupplement({
        smooth: true,
        attrs: {
          '.': {
            //filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } }
          },
          '.connection': { 'stroke-width': 3, 'stroke': 'black', 'stroke-linecap': 'round' },
          '.marker-arrowheads': { display: 'none' },
          '.tool-options': { display: 'none' }
        },
      }, joint.shapes.flo.Link.prototype.defaults));
    }

    isSemanticProperty(propertyPath : string, element : dia.Cell) : boolean {
      return propertyPath === '.label/text';
    }

    refreshVisuals(cell : dia.Cell, propertyPath : string, paper : dia.Paper) : void {
//        	var type = element.attr('metadata/name');
    }

    layout(paper : dia.Paper) {
      return new Promise((resolve) => {
        let graph = paper.model;
        let i : number;
        let g = new dagre.graphlib.Graph();

        g.setGraph({});
        g.setDefaultEdgeLabel(() => {});

        let nodes = graph.getElements();

        nodes.forEach((node : dia.Element) => {
          if (node.get('type') === joint.shapes.flo.NODE_TYPE) {
            g.setNode(node.id, node.get('size'));
          }
        });

        let links = graph.getLinks();
        links.forEach((link : dia.Link) => {
          if (link.get('type') === joint.shapes.flo.LINK_TYPE) {
            let options = {
              minlen: 1.5
            };
//					if (link.get('labels') && link.get('labels').length > 0) {
//						options.minlen = 1 + link.get('labels').length * 0.5;
//					}
            g.setEdge(link.get('source').id, link.get('target').id, options);
            link.set('vertices', []);
          }
        });

        g.graph().rankdir = 'LR';

        dagre.layout(g);

        g.nodes().forEach((v : any) => {
          let node : any = graph.getCell(v);
          if (node) {
            let bbox = node.getBBox();
            node.translate(g.node(v).x - bbox.x, g.node(v).y - bbox.y);
          }
        });

        resolve();
      });
    }

    getLinkAnchorPoint(linkView : dia.LinkView, view : dia.ElementView, magnet : SVGElement, reference : dia.Point) : dia.Point {
      if (magnet) {
        let type = magnet.getAttribute('port');
        let bbox = joint.V(magnet).bbox(false, (<any>linkView).paper.viewport);
        let rect = joint.g.rect(bbox);
        if (type === 'input') {
          return joint.g.point(rect.x, rect.y + rect.height / 2);
        } else {
          return joint.g.point(rect.x + rect.width, rect.y + rect.height / 2);
        }
      } else {
        return reference;
      }
    }

}
