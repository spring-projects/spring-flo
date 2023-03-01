import { dia } from 'jointjs';
import { Flo } from './flo-common';
import template from 'lodash/template';
import isFunction from 'lodash/isFunction';
import $ from 'jquery';
const joint: any = Flo.joint;

const isChrome: boolean = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
const isFF: boolean = navigator.userAgent.indexOf('Firefox') > 0;

const IMAGE_W = 120;
const IMAGE_H = 35;

const ERROR_MARKER_SIZE: dia.Size = {width: 16, height: 16};

const HANDLE_SIZE: dia.Size = {width: 10, height: 10};

const HANDLE_ICON_MAP: Map<string, string> = new Map<string, string>();
const REMOVE = 'remove';
HANDLE_ICON_MAP.set(REMOVE, 'icons/delete.svg');

const DECORATION_ICON_MAP: Map<string, string> = new Map<string, string>();
const ERROR = 'error';
DECORATION_ICON_MAP.set(ERROR, 'icons/error.svg');

export function loadShapes() {

  joint.shapes.flo = {};

  joint.shapes.flo.NODE_TYPE = 'sinspctr.IntNode';
  joint.shapes.flo.LINK_TYPE = 'sinspctr.Link';
  joint.shapes.flo.DECORATION_TYPE = 'decoration';
  joint.shapes.flo.HANDLE_TYPE = 'handle';


  // joint.util.cloneDeep = (obj: any) => {
  //   return _.cloneDeepWith(obj, (o) => {
  //     if (_.isObject(o) && !_.isPlainObject(o)) {
  //       return o;
  //     }
  //   });
  // };

  joint.util.filter.redscale = (args: Shapes.FilterOptions) => {

    let amount = Number.isFinite(args.amount) ? args.amount : 1;

    return template(
      '<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 ${d} ${e} ${f} ${g} 0 0 ${h} ${i} ${k} 0 0 0 0 0 1 0"/></filter>',
      <any>{
        a: 1 - 0.96 * amount,
        b: 0.95 * amount,
        c: 0.01 * amount,
        d: 0.3 * amount,
        e: 0.2 * amount,
        f: 1 - 0.9 * amount,
        g: 0.7 * amount,
        h: 0.05 * amount,
        i: 0.05 * amount,
        k: 1 - 0.1 * amount
      }
    );
  };

  joint.util.filter.orangescale = (args: Shapes.FilterOptions) => {

    let amount = Number.isFinite(args.amount) ? args.amount : 1;

    return template(
      '<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 ${d} ${e} ${f} ${g} 0 ${h} ${i} ${k} ${l} 0 0 0 0 0 1 0"/></filter>',
      <any>{
        a: 1.0 + 0.5 * amount,
        b: 1.4 * amount,
        c: 0.2 * amount,
        d: 0.3 * amount,
        e: 0.3 * amount,
        f: 1 + 0.05 * amount,
        g: 0.2 * amount,
        h: 0.15 * amount,
        i: 0.3 * amount,
        k: 0.3 * amount,
        l: 1 - 0.6 * amount
      }
    );
  };

  joint.shapes.flo.Node = joint.shapes.basic.Generic.extend({
    markup:
    '<g class="shape"><image class="image" /></g>' +
    '<rect class="border-white"/>' +
    '<rect class="border"/>' +
    '<rect class="box"/>' +
    '<text class="label"/>' +
    '<text class="label2"></text>' +
    '<rect class="input-port" />' +
    '<rect class="output-port"/>' +
    '<rect class="output-port-cover"/>',

    defaults: joint.util.deepSupplement({

      type: joint.shapes.flo.NODE_TYPE,
      position: {x: 0, y: 0},
      size: { width: IMAGE_W, height: IMAGE_H },
      attrs: {
        '.': { magnet: false },
        // rounded edges around image
        '.border': {
          refWidth: 1,
          refHeight: 1,
          rx: 3,
          ry: 3,
          'fill-opacity': 0, // see through
          stroke: '#eeeeee',
          'stroke-width': 0
        },

        '.box': {
          refWidth: 1,
          refHeight: 1,
          rx: 3,
          ry: 3,
          //'fill-opacity': 0, // see through
          stroke: '#6db33f',
          fill: '#eeeeee',
          'stroke-width': 1
        },
        '.input-port': {
          idp: 'input',
          port: 'input',
          height: 8, width: 8,
          magnet: true,
          fill: '#eeeeee',
          transform: 'translate(' + -4 + ',' + ((IMAGE_H / 2 ) - 4) + ')',
          stroke: '#34302d',
          'stroke-width': 1
        },
        '.output-port': {
          id: 'output',
          port: 'output',
          height: 8, width: 8,
          magnet: true,
          fill: '#eeeeee',
          transform: 'translate(' + (IMAGE_W - 4) + ',' + ((IMAGE_H / 2) - 4) + ')',
          stroke: '#34302d',
          'stroke-width': 1
        },
        '.label': {
          'text-anchor': 'middle',
          'ref-x': 0.5, // jointjs specific: relative position to ref'd element
          // 'ref-y': -12, // jointjs specific: relative position to ref'd element
          'ref-y': 0.3,
          ref: '.border', // jointjs specific: element for ref-x, ref-y
          fill: 'black',
          'font-size': 14
        },
        '.label2': {
          'text': '\u21d2',
          'text-anchor': 'middle',
          'ref-x': 0.15, // jointjs specific: relative position to ref'd element
          'ref-y': 0.2, // jointjs specific: relative position to ref'd element
          ref: '.border', // jointjs specific: element for ref-x, ref-y
          // transform: 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H/2) + ')',
          fill: 'black',
          'font-size': 24
        },
        '.shape': {
        },
        '.image': {
          refWidth: 1,
          refHeight: 1,
        }
      }
    }, joint.shapes.basic.Generic.prototype.defaults)
  });


  joint.shapes.flo.Link = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
      type: joint.shapes.flo.LINK_TYPE,
      attrs: {
        '.connection': { stroke: '#34302d', 'stroke-width': 2 },
        // Lots of alternatives that have been played with:
//	            '.smoooth': true
//	            '.marker-source': { stroke: '#9B59B6', fill: '#9B59B6', d: 'M24.316,5.318,9.833,13.682,9.833,5.5,5.5,5.5,5.5,25.5,9.833,25.5,9.833,17.318,24.316,25.682z' },
//	            '.marker-target': { stroke: '#F39C12', fill: '#F39C12', d: 'M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z' },
//	        	'.connection': { 'stroke':'black'},
//	        	'.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } } },
//	        	'.connection': { 'stroke-width': 10, 'stroke-linecap': 'round' },
        // This means: moveto 10 0, lineto 0 5, lineto, 10 10 closepath(z)
//	        	'.marker-target': { d: 'M 5 0 L 0 7 L 5 14 z', stroke: '#34302d','stroke-width': 1},
//	        	'.marker-target': { d: 'M 14 2 L 9,2 L9,0 L 0,7 L 9,14 L 9,12 L 14,12 z', 'stroke-width': 1, fill: '#34302d', stroke: '#34302d'},
//	        	'.marker-source': {d: 'M 5 0 L 5,10 L 0,10 L 0,0 z', 'stroke-width': 0, fill: '#34302d', stroke: '#34302d'},
//	            '.marker-target': { stroke: '#E74C3C', fill: '#E74C3C', d: 'M 10 0 L 0 5 L 10 10 z' },
        '.marker-arrowheads': { display: 'none' },
        '.tool-options': { display: 'none' }
      },
//	    	connector: { name: 'normalDimFix' }
    }, joint.dia.Link.prototype.defaults)
  });

  joint.shapes.flo.LinkView = joint.dia.LinkView.extend({

    options: joint.util.deepSupplement({
      linkToolsOffset: 0.5,
      shortLinkLength: 40
    }, joint.dia.LinkView.prototype.options),

    updateToolsPosition: function() {
      // Overriden to support relative offset for tools placement.
      // If offset is between 0 and 1 then percentage of the connection length will be used to offset the tools group
      if (this.options.linkToolsOffset < 1 && this.options.linkToolsOffset > 0) {
        let connectionLength = this.getConnectionLength();
        const relativeOffset = this.options.linkToolsOffset
        this.options.linkToolsOffset = connectionLength * relativeOffset;
        const returnValue = joint.dia.LinkView.prototype.updateToolsPosition.apply(this, arguments);
        this.options.linkToolsOffset = relativeOffset;
        return returnValue;
      } else {
        return joint.dia.LinkView.prototype.updateToolsPosition.apply(this, arguments);
      }
    },

    _beforeArrowheadMove: function() {
      if (this.model.get('source').id) {
        this._oldSource = this.model.get('source');
      }
      if (this.model.get('target').id) {
        this._oldTarget = this.model.get('target');
      }
      joint.dia.LinkView.prototype._beforeArrowheadMove.apply(this, arguments);
    },

    _afterArrowheadMove: function() {
      joint.dia.LinkView.prototype._afterArrowheadMove.apply(this, arguments);
      if (!this.model.get('source').id) {
        if (this._oldSource) {
          this.model.set('source', this._oldSource);
        } else {
          this.model.remove();
        }
      }
      if (!this.model.get('target').id) {
        if (this._oldTarget) {
          this.model.set('target', this._oldTarget);
        } else {
          this.model.remove();
        }
      }
      delete this._oldSource;
      delete this._oldTarget;
    }

  });

// TODO: must do cleanup for the `mainElementView'
  joint.shapes.flo.ElementView = joint.dia.ElementView.extend({
    // canShowTooltip: true,
    beingDragged: false,
    // _tempZorder: 0,
    _tempOpacity: 1.0,
    _hovering: false,

    dragLinkStart: function(evt: any, magnet: any, x: number, y: number) {

      this.model.startBatch('add-link');

      const linkView = this.addLinkFromMagnet(magnet, x, y);

      // backwards compatiblity events
      joint.dia.CellView.prototype.pointerdown.apply(linkView, [evt, x, y]);
      linkView.notify('link:pointerdown', evt, x, y);

      /*** START MAIN DIFF ***/
      const sourceOrTarget = $(magnet).attr('port') === 'input' ? 'source' : 'target';
      linkView.eventData(evt, linkView.startArrowheadMove(sourceOrTarget, { whenNotAllowed: 'remove' }));
      /*** END MAIN DIFF ***/

      this.eventData(evt, { linkView: linkView });
    },

    addLinkFromMagnet: function(magnet: any, x: number, y: number) {

      const paper = this.paper;
      const graph = paper.model;

      const link = paper.getDefaultLink(this, magnet);

      let sourceEnd, targetEnd: any;

      /*** START MAIN DIFF ***/
      if ($(magnet).attr('port') === 'input') {
        sourceEnd = { x: x, y: y };
        targetEnd = this.getLinkEnd(magnet, x, y, link, 'target');
      } else {
        sourceEnd = this.getLinkEnd(magnet, x, y, link, 'source');
        targetEnd = { x: x, y: y };
      }
      /*** END MAIN DIFF ***/

      link.set({
        source: sourceEnd,
        target: targetEnd
      }).addTo(graph, {
        async: false,
        ui: true
      });

      return link.findView(paper);
    },

    // pointerdown: function(evt: any, x: number, y: number) {
    //   // this.canShowTooltip = false;
    //   // this.hideTooltip();
    //   this.beingDragged = false;
    //   this._tempOpacity = this.model.attr('./opacity');
    //
    //   this.model.trigger('batch:start');
    //
    //   if ( // target is a valid magnet start linking
    //     evt.target.getAttribute('magnet') &&
    //     this.paper.options.validateMagnet.call(this.paper, this, evt.target)
    //   ) {
    //     let link = this.paper.getDefaultLink(this, evt.target);
    //     if ($(evt.target).attr('port') === 'input') {
    //       link.set({
    //         source: { x: x, y: y },
    //         target: {
    //           id: this.model.id,
    //           selector: this.getSelector(evt.target),
    //           port: evt.target.getAttribute('port')
    //         }
    //       });
    //     } else {
    //       link.set({
    //         source: {
    //           id: this.model.id,
    //           selector: this.getSelector(evt.target),
    //           port: evt.target.getAttribute('port')
    //         },
    //         target: { x: x, y: y }
    //       });
    //     }
    //     this.paper.model.addCell(link);
    //     this._linkView = this.paper.findViewByModel(link);
    //     if ($(evt.target).attr('port') === 'input') {
    //       this._linkView.startArrowheadMove('source');
    //     } else {
    //       this._linkView.startArrowheadMove('target');
    //     }
    //     this.paper.__creatingLinkFromPort = true;
    //   } else {
    //     this._dx = x;
    //     this._dy = y;
    //     joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
    //   }
    // },
    drag: function(evt: MouseEvent, x: number, y: number) {
      let interactive = isFunction(this.options.interactive) ? this.options.interactive(this, 'pointermove') :
        this.options.interactive;
      if (interactive !== false) {
        this.paper.trigger('dragging-node-over-canvas', {type: Flo.DnDEventType.DRAG, view: this, event: evt});
      }
      joint.dia.ElementView.prototype.drag.apply(this, arguments);
    },
    dragEnd: function(evt: MouseEvent, x: number, y: number) { // jshint ignore:line
      this.paper.trigger('dragging-node-over-canvas', {type: Flo.DnDEventType.DROP, view: this, event: evt});
      joint.dia.ElementView.prototype.dragEnd.apply(this, arguments);
    },
    // events: {
    //   // Tooltips on the elements in the graph
    //   'mouseenter': function(evt: MouseEvent) {
    //     if (this.canShowTooltip) {
    //       this.showTooltip(evt.pageX, evt.pageY);
    //     }
    //     if (!this._hovering && !this.paper.__creatingLinkFromPort) {
    //       this._hovering = true;
    //       if (isChrome || isFF) {
    //         this._tempZorder = this.model.get('z');
    //         this.model.toFront({deep: true});
    //       }
    //     }
    //   },
    //   'mouseleave': function() {
    //     this.hideTooltip();
    //     if (this._hovering) {
    //       this._hovering = false;
    //       if (isChrome || isFF) {
    //         this.model.set('z', this._tempZorder);
    //         var z = this._tempZorder;
    //         this.model.getEmbeddedCells({breadthFirst: true}).forEach(function(cell: dia.Cell) {
    //           cell.set('z', ++z);
    //         });
    //       }
    //     }
    //   },
    //   'mousemove': function(evt: MouseEvent) {
    //     this.moveTooltip(evt.pageX, evt.pageY);
    //   }
    // },
    // showTooltip: function(x: number, y: number) {
    //   var mousex = x + 10;
    //   var mousey = y + 10;
    //
    //   var nodeTooltip: HTMLElement;
    //   if (this.model instanceof joint.dia.Element && this.model.get('metadata')) {
    //     nodeTooltip = document.createElement('div');
    //     $(nodeTooltip).addClass('node-tooltip');
    //
    //     $(nodeTooltip).appendTo($('body')).fadeIn('fast');
    //     $(nodeTooltip).addClass('tooltip-description');
    //     var nodeTitle = document.createElement('div');
    //     $(nodeTooltip).append(nodeTitle);
    //     var nodeDescription = document.createElement('div');
    //     $(nodeTooltip).append(nodeDescription);
    //
    //     var model = this.model;
    //
    //     if (model.attr('metadata/name')) {
    //       var typeSpan = document.createElement('span');
    //       $(typeSpan).addClass('tooltip-title-type');
    //       $(nodeTitle).append(typeSpan);
    //       $(typeSpan).text(model.attr('metadata/name'));
    //       if (model.attr('metadata/group')) {
    //         var groupSpan = document.createElement('span');
    //         $(groupSpan).addClass('tooltip-title-group');
    //         $(nodeTitle).append(groupSpan);
    //         $(groupSpan).text('(' + model.attr('metadata/group') + ')');
    //       }
    //     }
    //
    //     model.get('metadata').get('description').then(function(description: string) {
    //       $(nodeDescription).text(description);
    //     }, function(error: any) {
    //       if (error) {
    //         Logger.error(error);
    //       }
    //     });
    //
    //     // defaultValue
    //     if (!model.attr('metadata/metadata/hide-tooltip-options')) {
    //       model.get('metadata')?.get('properties').then(function(metaProps: any) {
    //         var props = model.attr('props'); // array of {'name':,'value':}
    //         if (metaProps && props) {
    //           Object.keys(props).sort().forEach(function(propertyName) {
    //             if (metaProps[propertyName]) {
    //               var optionRow = document.createElement('div');
    //               var optionName = document.createElement('span');
    //               var optionDescription = document.createElement('span');
    //               $(optionName).addClass('node-tooltip-option-name');
    //               $(optionDescription).addClass('node-tooltip-option-description');
    //               $(optionName).text(metaProps[propertyName].name);
    //               $(optionDescription).text(props[propertyName]);//nodeOptionData[i].description);
    //               $(optionRow).append(optionName);
    //               $(optionRow).append(optionDescription);
    //               $(nodeTooltip).append(optionRow);
    //             }
    //             // This was the code to add every parameter in:
    //             //			    				$(optionName).addClass('node-tooltip-option-name');
    //             //			    				$(optionDescription).addClass('node-tooltip-option-description');
    //             //			    				$(optionName).text(metaProps[propertyName].name);
    //             //			    				$(optionDescription).text(metaProps[propertyName].description);
    //             //			    				$(optionRow).append(optionName);
    //             //			    				$(optionRow).append(optionDescription);
    //             //			    				$(nodeTooltip).append(optionRow);
    //           });
    //         }
    //       }, function(error: any) {
    //         if (error) {
    //           Logger.error(error);
    //         }
    //       });
    //     }
    //
    //     $('.node-tooltip').css({ top: mousey, left: mousex });
    //   } else if (this.model.get('type') === joint.shapes.flo.DECORATION_TYPE && this.model.attr('./kind') === 'error') {
    //     Logger.debug('mouse enter: ERROR box=' + JSON.stringify(this.model.getBBox()));
    //     nodeTooltip = document.createElement('div');
    //     var errors = this.model.attr('messages');
    //     if (errors && errors.length > 0) {
    //       $(nodeTooltip).addClass('error-tooltip');
    //       $(nodeTooltip).appendTo($('body')).fadeIn('fast');
    //       var header = document.createElement('p');
    //       $(header).text('Errors:');
    //       $(nodeTooltip).append(header);
    //       for (var i = 0;i < errors.length; i++) {
    //         var errorElement = document.createElement('li');
    //         $(errorElement).text(errors[i]);
    //         $(nodeTooltip).append(errorElement);
    //       }
    //       $('.error-tooltip').css({ top: mousey, left: mousex });
    //     }
    //   }
    // },
    // hideTooltip: function() {
    //   $('.node-tooltip').remove();
    //   $('.error-tooltip').remove();
    // },
    // moveTooltip: function(x: number, y: number) {
    //   $('.node-tooltip')
    //     .css({ top: y + 10, left: x + 10 });
    //   $('.error-tooltip')
    //     .css({ top: y + 10, left: x + 10 });
    // }
  });

  joint.shapes.flo.ErrorDecoration = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><image/></g></g>',

    defaults: joint.util.deepSupplement({

      type: joint.shapes.flo.DECORATION_TYPE,
      size: ERROR_MARKER_SIZE,
      attrs: {
        'image': ERROR_MARKER_SIZE
      }

    }, joint.shapes.basic.Generic.prototype.defaults)
  });

  joint.shapes.flo.PaletteGroupHeader = joint.shapes.basic.Generic.extend({
    // The path is the open/close arrow, defaults to vertical (open)
    markup: '<g class="scalable"><rect/></g><text/><g class="rotatable"><path d="m 10 10 l 5 8.7 l 5 -8.7 z"/></g>',
    defaults: joint.util.deepSupplement({
      type: 'palette.groupheader',
      size: {width: 170, height: 30},
      position: {x: 0, y: 0},
      attrs: {
        'rect': { fill: '#34302d', 'stroke-width': 1, stroke: '#6db33f', 'follow-scale': true, width: 80, height: 40 },
        'text': {
          text: '',
          fill: '#eeeeee',
          'ref-x': 0.5,
          'ref-y': 7,
          'x-alignment': 'middle',
          'font-size': 18/*, 'font-weight': 'bold', 'font-variant': 'small-caps', 'text-transform': 'capitalize'*/
        },
        'path': { fill: 'white', 'stroke-width': 2, stroke: 'white'/*,transform:'rotate(90,15,15)'*/}
      },
      // custom properties
      isOpen: true
    }, joint.shapes.basic.Generic.prototype.defaults)
  });

  joint.shapes.flo.NoMatchesFound = joint.shapes.basic.Generic.extend({
    // The path is the open/close arrow, defaults to vertical (open)
    markup: '<g class="scalable"><rect class="no-matches-label-border"/></g><rect class="no-mathes-label-bg"/><text class="no-matches-label"/>',
    defaults: joint.util.deepSupplement({
      size: {width: 170, height: 30},
      position: {x: 0, y: 0},
      attrs: {
        '.no-matches-label-border': {
          refWidth: 1,
          refHeight: 1,
          refX: 0,
          refY: 0,
        },
        '.no-macthes-label-bg': {
          ref: '.no-matches-label',
          refWidth: 10,
          refHeight: 2,
          'follow-scale': true
        },
        '.no-matches-label': {
          text: 'No results found.',
          ref: '.no-matches-label-border',
          refY: 0.5,
          refY2: 5,
          yAlignment: 'middle',
        },
      },
    }, joint.shapes.basic.Generic.prototype.defaults)
  });

}


export namespace Constants {

  export const REMOVE_HANDLE_TYPE = REMOVE;

  export const PROPERTIES_HANDLE_TYPE = 'properties';

  export const ERROR_DECORATION_KIND = ERROR;

  export const PALETTE_CONTEXT = 'palette';

  export const CANVAS_CONTEXT = 'canvas';

  export const FEEDBACK_CONTEXT = 'feedback';

}

export namespace Shapes {

  export interface CreationParams extends Flo.CreationParams {
    renderer?: Flo.Renderer;
    paper?: dia.Paper;
    graph?: dia.Graph;
  }

  export interface ElementCreationParams extends CreationParams {
    position?: dia.Point;
  }

  export interface LinkCreationParams extends CreationParams {
    source: Flo.LinkEnd;
    target: Flo.LinkEnd;
  }

  export interface EmbeddedChildCreationParams extends CreationParams {
    parent: dia.Cell;
    position?: dia.Point;
  }

  export interface DecorationCreationParams extends EmbeddedChildCreationParams {
    kind: string;
    messages: Array<string>;
  }

  export interface HandleCreationParams extends EmbeddedChildCreationParams {
    kind: string;
  }

  export interface FilterOptions {
    amount: number;
    [propName: string]: any;
  }


  export class Factory {

    /**
     * Create a JointJS node that embeds extra metadata (properties).
     */
    static createNode(params: ElementCreationParams): dia.Element {
      let renderer = params.renderer;
      let paper = params.paper;
      let metadata = params.metadata;
      let position = params.position;
      let props = params.props;
      let graph = params.graph || (params.paper ? params.paper.model : undefined);

      let node: dia.Element;
      if (!position) {
        position = {x: 0, y: 0};
      }

      if (renderer && isFunction(renderer.createNode)) {
        node = renderer.createNode({graph, paper}, metadata, props);
      } else {
        node = new joint.shapes.flo.Node();
        if (metadata) {
          node.attr('.label/text', metadata.name);
        }
      }
      node.set('type', joint.shapes.flo.NODE_TYPE);
      if (position) {
        node.set('position', position);
      }
      if (props) {
        Array.from(props.keys()).forEach(key => node.attr(`props/${key}`, props!.get(key)));
      }
      node.set('metadata', metadata);
      if (graph) {
        graph.addCell(node);
      }
      if (renderer && isFunction(renderer.initializeNewNode)) {
        let descriptor: Flo.ViewerDescriptor = {
          paper: paper,
          graph: graph
        };
        renderer.initializeNewNode(node, descriptor);
      }
      return node;
    }

    static createLink(params: LinkCreationParams): dia.Link {
      let renderer = params.renderer;
      let paper = params.paper;
      let metadata = params.metadata;
      let source = params.source;
      let target = params.target;
      let props = params.props;
      let graph = params.graph || (params.paper ? params.paper.model : undefined);

      let link: dia.Link;
      if (renderer && isFunction(renderer.createLink)) {
        link = renderer.createLink(source, target, metadata, props);
      } else {
        link = new joint.shapes.flo.Link();
      }
      if (source) {
        link.set('source', source);
      }
      if (target) {
        link.set('target', target);
      }
      link.set('type', joint.shapes.flo.LINK_TYPE);
      if (metadata) {
        link.set('metadata', metadata);
      }
      if (props) {
        Array.from(props.keys()).forEach(key => link.attr(`props/${key}`, props!.get(key)));
      }
      if (graph) {
        graph.addCell(link);
      }
      if (renderer && isFunction(renderer.initializeNewLink)) {
        let descriptor: Flo.ViewerDescriptor = {
          paper: paper,
          graph: graph
        };
        renderer.initializeNewLink(link, descriptor);
      }
      // prevent creation of link breaks
      link.attr('.marker-vertices/display', 'none');
      return link;
    }

    static createDecoration(params: DecorationCreationParams): dia.Element {
      let renderer = params.renderer;
      let paper = params.paper;
      let parent = params.parent;
      let kind = params.kind;
      let messages = params.messages;
      let location = params.position;
      let graph = params.graph || (params.paper ? params.paper.model : undefined);

      let decoration: dia.Element;
      if (renderer && isFunction(renderer.createDecoration)) {
        decoration = renderer.createDecoration(kind, parent);
      }
      if (decoration) {
        decoration.set('type', joint.shapes.flo.DECORATION_TYPE);
        if ((isChrome || isFF) && parent && typeof parent.get('z') === 'number') {
          decoration.set('z', parent.get('z') + 1);
        }
        decoration.attr('./kind', kind);
        decoration.attr('messages', messages);
        if (graph) {
          graph.addCell(decoration);
        }
        parent.embed(decoration);
        if (renderer && isFunction(renderer.initializeNewDecoration)) {
          let descriptor: Flo.ViewerDescriptor = {
            paper: paper,
            graph: graph
          };
          renderer.initializeNewDecoration(decoration, descriptor);
        }
        return decoration;
      }

    }

    static createHandle(params: HandleCreationParams): dia.Element {
      let renderer = params.renderer;
      let paper = params.paper;
      let parent = params.parent;
      let kind = params.kind;
      let location = params.position;
      let graph = params.graph || (params.paper ? params.paper.model : undefined);

      let handle: dia.Element;
      if (!location) {
        location = {x: 0, y: 0};
      }
      if (renderer && isFunction(renderer.createHandle)) {
        handle = renderer.createHandle(kind, parent);
      } else {
        handle = new joint.shapes.flo.ErrorDecoration({
          size: HANDLE_SIZE,
          attrs: {
            'image': {
              'xlink:href': HANDLE_ICON_MAP.get(kind)
            }
          }
        });
      }
      handle.set('type', joint.shapes.flo.HANDLE_TYPE);
      handle.set('position', location);
      if ((isChrome || isFF) && parent && typeof parent.get('z') === 'number') {
        handle.set('z', parent.get('z') + 1);
      }
      handle.attr('./kind', kind);
      if (graph) {
        graph.addCell(handle);
      }
      parent.embed(handle);
      if (renderer && isFunction(renderer.initializeNewHandle)) {
        let descriptor: Flo.ViewerDescriptor = {
          paper: paper,
          graph: graph
        };
        renderer.initializeNewHandle(handle, descriptor);
      }
      return handle;
    }

  }
}

loadShapes();

