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

import { Flo, Constants } from 'spring-flo';
import { dia } from 'jointjs';

const dagre = require('dagre');

const joint : any = Flo.joint;


const HANDLE_ICON_MAP = new Map<string, string>()
  .set(Constants.REMOVE_HANDLE_TYPE, 'icons/delete.svg')
  .set(Constants.PROPERTIES_HANDLE_TYPE, 'icons/cog.svg');

const DECORATION_ICON_MAP = new Map<string, string>()
  .set(Constants.ERROR_DECORATION_KIND, 'icons/error.svg');

const IMAGE_W = 120;
const IMAGE_H = 40;

const PORT_RADIUS = 2;

joint.shapes.flo.Multi = joint.shapes.basic.Generic.extend({

  markup:
  '<g class="stream-module">' +
  '<g class="shape">' +
  '<rect class="box"/>' +
  '<text class="label"/>' +
  '<text class="label2"/>' +
  '</g>' +
  '<g class="port1-group">' +
    '<circle class="input-port1" />' +
    '<g class="label-group">' +
      '<rect class="port1-label-rect"/>' +
      '<text class="port1-label"></text>' +
    '</g>' +
  '</g>' +
  '<g class="port2-group">' +
    '<circle class="input-port2" />' +
    '<g class="label-group">' +
      '<rect class="port2-label-rect"/>' +
      '<text class="port2-label"></text>' +
    '</g>' +
  '</g>' +
  '<g class="port3-group">' +
    '<circle class="input-port3" />' +
    '<g class="label-group">' +
      '<rect class="port3-label-rect"/>' +
      '<text class="port3-label"></text>' +
    '</g>' +
  '</g>' +
  '<g class="port4-group">' +
    '<circle class="input-port4" />' +
    '<g class="label-group">' +
      '<rect class="port4-label-rect"/>' +
      '<text class="port4-label"></text>' +
    '</g>' +
  '</g>' +
  '<g class="port5-group">' +
    '<circle class="input-port5" />' +
    '<g class="label-group">' +
      '<rect class="port5-label-rect"/>' +
      '<text class="port5-label"></text>' +
    '</g>' +
  '</g>' +
  '<rect class="output-port"/>' +
  '</g>',

  defaults: joint.util.defaultsDeep({

    type: joint.shapes.flo.NODE_TYPE,
    position: {x: 0, y: 0},
    size: { width: IMAGE_W, height: IMAGE_H },
    attrs: {
      '.': {
        magnet: false,
      },
      '.box': {
        width: IMAGE_W,
        height: IMAGE_H,
        rx: 2,
        ry: 2,
        // 'fill-opacity':0, // see through
        stroke: '#6db33f',
        fill: '#eeeeee',
        'stroke-width': 2,
      },
      '.input-port1': {
        portName: 'port-1',
        port: 'input',
        ref: '.box',
        refCx: 0,
        refCy: 1 * 0.17,
        r: PORT_RADIUS,
        magnet: true,
        class: 'input-port1 flo-input-port'
      },
      '.port1-label': {
        ref: '.input-port1',
        'ref-x': 10,
        'ref-y': 0,
        text: 'port-1',
        class: 'port1-label flo-port-label'
      },
      '.port1-label-rect': {
        ref: '.port1-label',
        refWidth: 1,
        refHeight: 1,
        refX: 0,
        refY: 0,
        class: 'port1-label-rect flo-port-label-bg'
      },
      '.input-port2': {
        portName: 'port-2',
        port: 'in-port-2',
        r: PORT_RADIUS,
        ref: '.box',
        refCx: 0,
        refCy: 2 * 0.17,
        magnet: true,
        class: 'input-port2 flo-input-port'
      },
      '.port2-label': {
        ref: '.input-port2',
        'ref-x': 10,
        'ref-y': 0,
        text: 'port-2',
        class: 'port2-label flo-port-label'
      },
      '.port2-label-rect': {
        ref: '.port2-label',
        refWidth: 1,
        refHeight: 1,
        refX: 0,
        refY: 0,
        class: 'port2-label-rect flo-port-label-bg'
      },
      '.input-port3': {
        portName: 'port-3',
        port: 'input',
        r: PORT_RADIUS,
        ref: '.box',
        refCx: 0,
        refCy: 3 * 0.17,
        magnet: true,
        class: 'input-port3 flo-input-port'
      },
      '.port3-label': {
        ref: '.input-port3',
        'ref-x': 10,
        'ref-y': 0,
        text: 'port-3',
        class: 'port3-label flo-port-label'
      },
      '.port3-label-rect': {
        ref: '.port3-label',
        refWidth: 1,
        refHeight: 1,
        refX: 0,
        refY: 0,
        class: 'port3-label-rect flo-port-label-bg'
      },
      '.input-port4': {
        portName: 'port-4',
        port: 'input',
        r: PORT_RADIUS,
        ref: '.box',
        refCx: 0,
        refCy: 4 * 0.17,
        magnet: true,
        class: 'input-port4 flo-input-port'
      },
      '.port4-label': {
        ref: '.input-port4',
        'ref-x': 10,
        'ref-y': 0,
        text: 'port-4',
        class: 'port4-label flo-port-label'
      },
      '.port4-label-rect': {
        ref: '.port4-label',
        refWidth: 1,
        refHeight: 1,
        refX: 0,
        refY: 0,
        class: 'port4-label-rect flo-port-label-bg'
      },
      '.input-port5': {
        portName: 'port-5',
        port: 'input',
        r: PORT_RADIUS,
        ref: '.box',
        refCx: 0,
        refCy: 5 * 0.17,
        magnet: true,
        class: 'input-port5 flo-input-port'
      },
      '.port5-label': {
        ref: '.input-port5',
        'ref-x': 10,
        'ref-y': 0,
        text: 'port-5',
        class: 'port5-label flo-port-label'
      },
      '.port5-label-rect': {
        ref: '.port5-label',
        refWidth: 1,
        refHeight: 1,
        refX: 0,
        refY: 0,
        class: 'port5-label-rect flo-port-label-bg'
      },
      '.output-port': {
        port: 'output',
        height: 8, width: 8,
        magnet: true,
        fill: '#eeeeee',
        transform: 'translate(' + (IMAGE_W - 4) + ',' + ((IMAGE_H / 2) - 4) + ')',
        stroke: '#34302d',
        'stroke-width': 1,
      },
      '.label': {
        'ref-x': 0.5, // jointjs specific: relative position to ref'd element
        'ref-y': 0.525,
        'y-alignment': 'middle',
        'x-alignment': 'middle',
        ref: '.box', // jointjs specific: element for ref-x, ref-y
        fill: 'black',
        'font-size': 14
      },
      '.label2': {
        'y-alignment': 'middle',
        'ref-x': 0.15, // jointjs specific: relative position to ref'd element
        'ref-y': 0.2, // jointjs specific: relative position to ref'd element
        ref: '.box', // jointjs specific: element for ref-x, ref-y
        fill: 'black',
        'font-size': 20
      },
      '.shape': {
      }
    }
  }, joint.shapes.basic.Generic.prototype.defaults)
});

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

    createDecoration(kind : string, parent: dia.Cell) : dia.Element {
      const error = new joint.shapes.flo.ErrorDecoration({
        size: {width: 16, height: 16},
        attrs: {
          'image': {
            'xlink:href': DECORATION_ICON_MAP.get(kind)
          }
        }
      });
      if (parent instanceof joint.dia.Element) {
        const pt = (<dia.Element> parent).getBBox().topRight().offset(-error.size().width, 0);
        error.position(pt.x, pt.y);
      } else {
        // TODO: do something for the link perhaps?
      }
      return error;
    }

    createNode(viewerDescriptor: Flo.ViewerDescriptor, metadata : Flo.ElementMetadata, props : Map<string, any>): dia.Element {
      if (metadata.name === 'multi') {
        return new joint.shapes.flo.Multi();
      }
      return new joint.shapes.flo.Node();
    }

    initializeNewNode(node : dia.Element, viewerDescriptor : Flo.ViewerDescriptor) {
      let metadata : Flo.ElementMetadata = node.get('metadata');
      if (metadata) {
        node.attr('.label/text', node.get('metadata').name);
        let group = node.get('metadata')?.group;
        if (group === 'source') {
          node.attr('.input-port/display','none');
        }
        if (group === 'sink') {
          node.attr('.output-port/display','none');
        }
      }
    }

    createLink(source : Flo.LinkEnd, target : Flo.LinkEnd, metadata : Flo.ElementMetadata, props : Map<string, any>) : dia.Link {
      const link = new joint.shapes.flo.Link(joint.util.deepSupplement({
        smooth: true,
        attrs: {
          '.': {
            //filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } }
          },
          '.connection': {'stroke-width': 3, 'stroke': 'black', 'stroke-linecap': 'round'},
          '.marker-arrowheads': {display: 'none'},
          '.tool-options': {display: 'none'}
        },
      }));
      return link;
    }

  handleLinkEvent?(context: Flo.EditorContext, event: string, link: dia.Link) {
      switch (event) {
        case 'change:target':
          this.updateTargetLabel(link, context.getPaper());
          break;
      }
  }

  updateTargetLabel(link: joint.dia.Link, paper: dia.Paper) {
      const view = paper.findViewByModel(link.getTargetElement());
      const portElement = view ? view.findBySelector(link.target().selector) : undefined;
      const labelText = portElement && portElement.length ? portElement[0].getAttribute('port-name') : undefined;
      setTimeout(() => {
        let idx = -1;
        for (let i = 0; idx < 0 && i < link.labels().length; i++) {
          if (link.labels()[i].attrs.text.id === 'target-channel-label') {
            idx = i;
          }
        }
        if (idx >= 0) {
          link.removeLabel(idx);
        }
        if (labelText) {
          link.appendLabel({
            attrs: {
              text: {
                id: 'target-channel-label',
                text: labelText,
                class: 'link-channel-label',
                'text-anchor': 'end'
              },
              rect: {
                class: 'link-channel-label'
              }
            },
            position: {
              args: {
                keepGradient: true,
                ensureLegibility: true
              },
              distance: -20,
              offset: 20
            },
          });
        }
      });
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
            node.translate(g.node(v).x - g.node(v).width / 2 - bbox.x, g.node(v).y - g.node(v).height / 2 - bbox.y);
          }
        });

        resolve(undefined);
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
